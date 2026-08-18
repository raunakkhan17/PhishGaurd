# 🛡️ PhishGuard

> **AI-Powered Web Security & Phishing Protection Suite**  
> *Real-time website threat analysis, Chrome extension with Groq Llama 3.3 RAG chatbot, threat database, and community hub.*

---

## 🌟 Core Features

- 🔍 **Real-Time Website Detection**: Machine-learning powered URL scanner detecting phishing, typosquatting, and malicious domain variants.
- 🤖 **RAG AI Security Chatbot**: Integrated Chrome Extension with local Retrieval-Augmented Generation (RAG) powered by **Groq Llama-3.3-70b**.
- 📊 **Public Threat Directory**: Searchable repository of community-reported and verified malicious websites.
- 🎓 **Educational Hub**: Comprehensive guides, tutorials, and security awareness articles on identifying social engineering attacks.
- 💬 **Community Forums**: Collaborative platform for discussing cyber threats and reporting scam campaigns.
- ⚡ **Admin Dashboard**: Full administrative portal for reviewing pending domain reports, managing content, and monitoring system stats.

---

## 🏗️ Architecture

```
                  +-----------------------------------+
                  |           MongoDB Database        |
                  |    (mongodb://localhost:27017)    |
                  +-----------------+-----------------+
                                    |
                  +-----------------+-----------------+
                  |          Backend API              |
                  |     (Node.js / Express :5000)     |
                  +--------+-----------------+--------+
                           |                 |
         +-----------------+                 +-----------------+
         |                                                     |
+--------v------------------+                       +----------v-----------------+
|       Web Frontend        |                       |   Chrome Security Extension|
|  (React + Vite + Tailwind)|                       |      & RAG AI Chatbot       |
|    http://localhost:5173  |                       | (Manifest V3 + Groq Llama) |
+---------------------------+                       +----------------------------+
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (`v18+` or `v20+` LTS)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017 (`mongodb://localhost:27017/threat-website`)

---

### 1. Backend Setup

```bash
cd Backend
npm install
node seed.js      # Seed initial database records & demo accounts
npm run dev       # Starts API server on http://localhost:5000
```

---

### 2. Web Frontend Setup

```bash
cd Frontend/web
npm install
npm run dev       # Starts React web app on http://localhost:5173
```

---

### 3. Chrome Security Extension & Chatbot

1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the folder:
   `Frontend/extension/web-secure-bot`
4. Set your Groq API key in the extension background script or popup.

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@phishguard.com` | `admin123` | Full admin portal & verification capabilities |
| **User** | `user@phishguard.com` | `user123` | Community forums, threat reporting & guides |

---

## 📁 Repository Structure

```
PhishGuard/
├── Backend/                    # Express.js REST API & MongoDB models
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/            # Mongoose schemas (User, Forum, Directory, etc.)
│   │   └── routes/            # API endpoints
│   └── seed.js                 # Database seed script
├── Frontend/
│   ├── web/                    # React + Vite + Tailwind web application
│   └── extension/
│       └── web-secure-bot/     # Chrome Extension with Groq Llama RAG Chatbot
├── README.md                   # Project documentation
└── .gitignore                  # Git ignore definitions
```

---

## 📜 License

Distributed under the **ISC License**.