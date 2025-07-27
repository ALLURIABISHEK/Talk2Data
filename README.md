# 🚀 KJC VOX – Institutional Feedback & Communication Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tech](https://img.shields.io/badge/built%20with-Angular%20%7C%20Java%20%7C%20MongoDB-informational)
![Status](https://img.shields.io/badge/status-Active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

> A role-based, secure, and modular feedback system designed for students, faculty, and admins — built as part of the KJSDC initiative at Kristu Jayanti University.

---

## 🌐 Live Preview *(Optional)*
<!-- Uncomment when deployed -->
<!-- [View Live Project](https://your-demo-link.com) -->

---

## 📽️ Demo – Platform in Action

> 🎥 **Student Registration & Feedback Submission**
  
![Student Flow Demo](https://media.giphy.com/media/your-demo1.gif)  
> *OTP Verification, Dashboard View, and Anonymous Feedback Submission*

> 🎥 **Faculty & Admin Dashboards**

![Faculty/Admin Demo](https://media.giphy.com/media/your-demo2.gif)  
> *Faculty viewing feedback, Admin managing faculty records*

---

## 🧠 Features

✅ Secure role-based login system  
✅ OTP-based registration using JavaMail API  
✅ Anonymous student feedback submission  
✅ Faculty dashboard to view feedback  
✅ Admin panel for user and faculty management  
✅ Angular + TypeScript frontend  
✅ Java backend using Jetty Embedded Server  
✅ MongoDB Atlas for cloud data storage  
✅ Modular, scalable, and ready for institutional deployment

---

## 🏗️ Tech Stack

| Layer        | Technology Used                          |
|--------------|-------------------------------------------|
| **Frontend** | Angular, TypeScript, HTML, CSS            |
| **Backend**  | Java (Servlets, Jetty Embedded Server)    |
| **Database** | MongoDB Atlas (NoSQL Cloud DB)            |
| **Email API**| JavaMail API                              |
| **Tools**    | IntelliJ IDEA, Postman, MongoDB Compass   |

---

## 📁 Folder Structure (Simplified)

```bash
KJC-VOX/
│
├── frontend/              # Angular UI (Student, Faculty, Admin views)
├── backend/               # Java backend logic and API handlers
│   ├── servlets/
│   ├── utils/
│   └── db/
├── emails/                # JavaMail-based OTP/password handlers
├── docs/                  # Screenshots, reports, presentations
└── README.md
