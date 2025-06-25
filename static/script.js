// DOM Elements
const micBtn = document.getElementById("mic-button");
const micWave = document.getElementById("mic-animation");
const queryInput = document.getElementById("query-input");
const sendBtn = document.getElementById("send-btn");
const mongoQueryBox = document.getElementById("mongo-query");
const resultBody = document.getElementById("result-body");
const chatMessages = document.getElementById("chat-messages");
const clearChatBtn = document.getElementById("clear-chat");
const copyQueryBtn = document.getElementById("copy-query");
const exportCsvBtn = document.getElementById("export-csv");
const exportJsonBtn = document.getElementById("export-json");
const suggestionItems = document.querySelectorAll(".suggestion-item");

// Chat history array
let chatHistory = [];
let currentResults = [];

// 🎤 Speech Recognition Setup
let recognition = null;
let isListening = false;

// Initialize Speech Recognition if available
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.continuous = false;
} else {
  // Disable mic button if speech recognition is not supported
  micBtn.style.opacity = "0.5";
  micBtn.style.cursor = "not-allowed";
  micBtn.title = "Speech recognition not supported in this browser";
}

// 🎤 Mic Button Click Handler
micBtn.onclick = () => {
  if (!recognition) {
    alert("🎤 Speech recognition is not supported in this browser. Please type your question instead.");
    return;
  }
  
  if (isListening) return;
  
  isListening = true;
  micBtn.classList.add("listening");
  micWave.classList.remove("hidden");
  
  try {
    recognition.start();
  } catch (error) {
    console.error("Speech recognition error:", error);
    resetMicState();
    alert("🎤 Speech recognition failed. Please try again.");
  }
};

// Speech Recognition Event Handlers
if (recognition) {
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    queryInput.value = transcript;
    resetMicState();
    
    // Add user message to chat
    addMessageToChat(transcript, 'user');
    
    // Auto-send after speech input
    setTimeout(() => {
      sendQuery();
    }, 500);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    resetMicState();
    if (event.error !== 'aborted') {
      alert("🎤 Speech recognition failed. Please try again.");
    }
  };

  recognition.onend = () => {
    resetMicState();
  };
}

function resetMicState() {
  isListening = false;
  micBtn.classList.remove("listening");
  micWave.classList.add("hidden");
}

// 🚀 Send Button Click Handler
sendBtn.onclick = sendQuery;

// Enter key handler for input
queryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendQuery();
  }
});

// Suggestion clicks
suggestionItems.forEach(item => {
  item.addEventListener('click', () => {
    queryInput.value = item.textContent;
    sendQuery();
  });
});

// Main query sending function
async function sendQuery() {
  const query = queryInput.value.trim();
  if (!query) return;

  // Add user message to chat if not already added (from speech)
  const lastMessage = chatHistory[chatHistory.length - 1];
  if (!lastMessage || lastMessage.text !== query || lastMessage.type !== 'user') {
    addMessageToChat(query, 'user');
  }

  // Clear input
  queryInput.value = '';

  // Show loading state
  showLoadingState();

  try {
    // Make API call to backend
    const response = await fetch("/generate-sql", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Process the response
    processQueryResponse(data, query);

  } catch (error) {
    console.error("API Error:", error);
    
    // Use dummy data for demonstration when backend is not available
    console.log("Using dummy data for demonstration...");
    const dummyData = generateDummyResponse(query);
    processQueryResponse(dummyData, query);
  }
}

// Process query response (real or dummy)
function processQueryResponse(data, query) {
  // Add bot response to chat
  let botMessage = "I found some results for your query!";
  if (data.results && data.results.length > 0) {
    botMessage = `Found ${data.results.length} result(s) for "${query}"`;
  } else {
    botMessage = "No results found for your query. Try rephrasing your question.";
  }
  
  addMessageToChat(botMessage, 'bot');

  // Show MongoDB Query
  if (data.mongo_query) {
    mongoQueryBox.textContent = JSON.stringify(data.mongo_query, null, 2);
  } else {
    mongoQueryBox.textContent = "No query generated";
  }

  // Store current results
  currentResults = data.results || [];

  // Render Results Table
  renderResultsTable(currentResults);
}

// Generate dummy response for demonstration
function generateDummyResponse(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('employee') || lowerQuery.includes('staff')) {
    return {
      mongo_query: {
        collection: "employees",
        filter: {},
        projection: { name: 1, department: 1, salary: 1, joinDate: 1 }
      },
      results: [
        { _id: "1", name: "John Doe", department: "Engineering", salary: 75000, joinDate: "2023-01-15" },
        { _id: "2", name: "Jane Smith", department: "Marketing", salary: 65000, joinDate: "2023-03-20" },
        { _id: "3", name: "Mike Johnson", department: "Engineering", salary: 80000, joinDate: "2022-11-10" },
        { _id: "4", name: "Sarah Wilson", department: "HR", salary: 60000, joinDate: "2023-05-08" }
      ]
    };
  } else if (lowerQuery.includes('developer') || lowerQuery.includes('engineer')) {
    return {
      mongo_query: {
        collection: "employees",
        filter: { department: "Engineering" },
        projection: { name: 1, role: 1, experience: 1, location: 1 }
      },
      results: [
        { _id: "1", name: "John Doe", role: "Senior Developer", experience: "5 years", location: "Delhi" },
        { _id: "3", name: "Mike Johnson", role: "Full Stack Developer", experience: "3 years", location: "Mumbai" },
        { _id: "5", name: "Alex Brown", role: "Frontend Developer", experience: "2 years", location: "Delhi" }
      ]
    };
  } else if (lowerQuery.includes('count') || lowerQuery.includes('department')) {
    return {
      mongo_query: {
        collection: "employees",
        aggregate: [
          { $group: { _id: "$department", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]
      },
      results: [
        { _id: "Engineering", count: 15 },
        { _id: "Marketing", count: 8 },
        { _id: "Sales", count: 12 },
        { _id: "HR", count: 5 }
      ]
    };
  } else {
    return {
      mongo_query: {
        collection: "data",
        filter: {},
        projection: {}
      },
      results: [
        { _id: "1", message: "Sample data", type: "demo", timestamp: new Date().toISOString() }
      ]
    };
  }
}

// Add message to chat
function addMessageToChat(text, type) {
  const message = { text, type, timestamp: new Date() };
  chatHistory.push(message);
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;
  
  const avatar = document.createElement('div');
  avatar.className = type === 'user' ? 'message-avatar' : 'bot-avatar';
  avatar.textContent = type === 'user' ? '👤' : '🤖';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = `<p>${text}</p>`;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
  chatMessages.appendChild(messageDiv);
  
  // Auto-scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show loading state
function showLoadingState() {
  addMessageToChat("Processing your query...", 'bot');
  mongoQueryBox.textContent = "Generating MongoDB query...";
}

// Render results table
function renderResultsTable(results) {
  const table = document.getElementById("result-table");
  const thead = table.querySelector("thead");
  const tbody = document.getElementById("result-body");

  // Clear existing content
  tbody.innerHTML = "";
  thead.innerHTML = "";

  if (results && Array.isArray(results) && results.length > 0) {
    const keys = Object.keys(results[0]);

    // Create header
    const headerRow = document.createElement("tr");
    keys.forEach((key) => {
      const th = document.createElement("th");
      th.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Create rows
    results.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.style.animationDelay = `${index * 0.1}s`;
      
      keys.forEach((key) => {
        const td = document.createElement("td");
        let value = row[key];
        
        // Format different data types
        if (value === null || value === undefined) {
          value = "-";
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        } else if (typeof value === 'boolean') {
          value = value ? "Yes" : "No";
        } else if (typeof value === 'number' && key.toLowerCase().includes('salary')) {
          value = new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR' 
          }).format(value);
        }
        
        td.textContent = value;
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="no-data">No results found. Try asking a different question!</td>`;
    tbody.appendChild(tr);
  }
}

// Clear chat handler
clearChatBtn.onclick = () => {
  if (confirm("Are you sure you want to clear the chat history?")) {
    chatHistory = [];
    chatMessages.innerHTML = `
      <div class="welcome-message">
        <div class="bot-avatar">🤖</div>
        <div class="message-content">
          <p>Hi! I'm your AI data assistant. Ask me anything about your MongoDB data using natural language!</p>
        </div>
      </div>
    `;
    
    // Reset other sections
    mongoQueryBox.textContent = "Ask a question to see the generated MongoDB query...";
    currentResults = [];
    renderResultsTable([]);
  }
};

// Copy query handler
copyQueryBtn.onclick = () => {
  const queryText = mongoQueryBox.textContent;
  if (queryText && queryText !== "Ask a question to see the generated MongoDB query...") {
    navigator.clipboard.writeText(queryText).then(() => {
      // Temporary visual feedback
      const originalText = copyQueryBtn.textContent;
      copyQueryBtn.textContent = "Copied!";
      copyQueryBtn.style.background = "rgba(34, 197, 94, 0.2)";
      copyQueryBtn.style.borderColor = "#22c55e";
      
      setTimeout(() => {
        copyQueryBtn.textContent = originalText;
        copyQueryBtn.style.background = "transparent";
        copyQueryBtn.style.borderColor = "rgba(255, 255, 255, 0.3)";
      }, 2000);
    }).catch(() => {
      alert("Failed to copy query to clipboard");
    });
  }
};

// Export CSV handler
exportCsvBtn.onclick = () => {
  if (currentResults.length === 0) {
    alert("No data to export. Please run a query first.");
    return;
  }
  
  const csv = convertToCSV(currentResults);
  downloadFile(csv, 'talk2data-results.csv', 'text/csv');
};

// Export JSON handler
exportJsonBtn.onclick = () => {
  if (currentResults.length === 0) {
    alert("No data to export. Please run a query first.");
    return;
  }
  
  const json = JSON.stringify(currentResults, null, 2);
  downloadFile(json, 'talk2data-results.json', 'application/json');
};

// Utility function to convert array to CSV
function convertToCSV(data) {
  if (!data.length) return '';
  
  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(','), // Header
    ...data.map(row => 
      keys.map(key => {
        let value = row[key];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// Utility function to download file
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 80; // Account for fixed navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(15, 15, 35, 0.98)';
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
  } else {
    navbar.style.background = 'rgba(15, 15, 35, 0.95)';
    navbar.style.boxShadow = 'none';
  }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Set focus on input
  queryInput.focus();
  
  // Add initial animation to particles
  const particles = document.querySelectorAll('.particle');
  particles.forEach((particle, index) => {
    particle.style.animationDelay = `${index * 0.5}s`;
  });
  
  console.log("Talk2Data initialized successfully!");
});

// Handle page visibility changes (pause/resume animations)
document.addEventListener('visibilitychange', () => {
  const particles = document.querySelectorAll('.particle');
    if (document.hidden) {
    // Pause animations when page is not visible
    particles.forEach(particle => {
      particle.style.animationPlayState = 'paused';
    });
  } else {
    // Resume animations when page becomes visible again
    particles.forEach(particle => {
      particle.style.animationPlayState = 'running';
    });
  }
});

// Add error handling for the API call
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  addMessageToChat("Sorry, something went wrong. Please try again.", 'bot');
});

// Add offline detection
window.addEventListener('offline', () => {
  addMessageToChat("You appear to be offline. Some features may not work.", 'bot');
});

window.addEventListener('online', () => {
  addMessageToChat("Connection restored! All features are now available.", 'bot');
});

// Add service worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// Add beforeunload handler to warn about unsaved queries
window.addEventListener('beforeunload', (event) => {
  if (chatHistory.length > 1) { // More than just the welcome message
    event.preventDefault();
    event.returnValue = 'You have active queries that may not be saved. Are you sure you want to leave?';
    return event.returnValue;
  }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Focus on input when pressing '/' (like Slack)
  if (event.key === '/' && event.target !== queryInput) {
    event.preventDefault();
    queryInput.focus();
  }
  
  // Send query with Ctrl+Enter
  if (event.ctrlKey && event.key === 'Enter' && document.activeElement === queryInput) {
    sendQuery();
  }
});

// Add responsive adjustments
function handleResponsiveChanges() {
  const isMobile = window.innerWidth < 768;
  
  // Adjust UI elements for mobile
  if (isMobile) {
    // Example: Hide some elements on mobile
    document.querySelectorAll('.stat-item').forEach((item, index) => {
      if (index > 0) item.style.display = 'none';
    });
  } else {
    // Restore elements on larger screens
    document.querySelectorAll('.stat-item').forEach(item => {
      item.style.display = 'flex';
    });
  }
}

// Initialize responsive adjustments
handleResponsiveChanges();
window.addEventListener('resize', handleResponsiveChanges);

// Add analytics tracking (example)
function trackEvent(eventName, payload = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, payload);
  }
  console.log('Tracking:', eventName, payload);
}

// Track important user actions
sendBtn.addEventListener('click', () => {
  trackEvent('send_query', { method: 'click' });
});

queryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    trackEvent('send_query', { method: 'keyboard' });
  }
});

micBtn.addEventListener('click', () => {
  trackEvent('voice_query_initiated');
});

// Final initialization
console.log("Talk2Data fully initialized");