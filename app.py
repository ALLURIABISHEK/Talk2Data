from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
import google.generativeai as genai
import json
from hashlib import sha256
import os

app = Flask(__name__, template_folder="templates", static_folder="static")

# MongoDB setup
client = MongoClient("mongodb://localhost:27017")
db = client["talk2data"]
collection = db["employees"]

# Gemini setup
genai.configure(api_key="")  # 🔁 Replace with your actual key
model = genai.GenerativeModel("gemini-1.5-flash")

# 🔁 Prompt (only sent once per session)
PROMPT = """
You are an intelligent assistant that converts English questions into a JSON with two fields:
- "filter": MongoDB filter object
- "projection": Optional fields to include (like {"_id": 0, "name": 1}), or just {"_id": 0}

Use regex for year filtering like:
{ "joinedDate": { "$regex": "^2023" } }

Examples:
Q: Employees who joined in 2023
A: {
  "filter": { "joinedDate": { "$regex": "^2023" } },
  "projection": { "_id": 0 }
}

Q: HR in Mumbai
A: {
  "filter": { "department": "HR", "location": "Mumbai" },
  "projection": { "_id": 0 }
}

Now convert this:
"""

# Start single chat session
chat = model.start_chat()
chat.send_message(PROMPT.strip())
# Global prompt cache
prompt_cache = {}

@app.route("/generate-sql", methods=["POST"])
def generate_sql():
    global chat
    try:
        user_input = request.json.get("query")
        if not user_input:
            return jsonify({"error": "No query provided"}), 400

        cache_key = sha256(user_input.encode()).hexdigest()

        if cache_key in prompt_cache:
            response_text = prompt_cache[cache_key]
        else:
            try:
                response = chat.send_message(user_input)
                response_text = response.text.strip()
            except Exception as e:
                # Restart chat on failure or quota exhaustion
                chat = model.start_chat(history=[{ "role": "system", "parts": [PROMPT.strip()] }])
                response = chat.send_message(user_input)
                response_text = response.text.strip()

            prompt_cache[cache_key] = response_text

        # Debug log
        print("🔹 Gemini Response:\n", response_text)

        # Clean response
        json_text = response_text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(json_text)

        # Handle both direct and wrapped filter objects
        if "filter" in parsed:
            filter_obj = parsed["filter"]
            projection_obj = parsed.get("projection", {"_id": 0})
        else:
            filter_obj = parsed
            projection_obj = {"_id": 0}

        results = list(collection.find(filter_obj, projection_obj))

        return jsonify({
            "mongo_query": filter_obj,
            "projection": projection_obj,
            "results": results
        })

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({ "error": str(e) }), 500


@app.route("/load-data", methods=["POST"])
def load_data():
    try:
        with open("dataset/employees.json", "r") as f:
            data = json.load(f)
        collection.delete_many({})
        collection.insert_many(data)
        return jsonify({"status": "success", "inserted": len(data)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
