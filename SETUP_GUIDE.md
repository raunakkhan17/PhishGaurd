# 🛠️ PhishGuard - New Laptop Setup & Troubleshooting Guide

This guide provides step-by-step instructions to set up **PhishGuard** on a newly cloned machine, configure both browser extensions, and fix the **`401 (Unauthorized)` Login Error**.

---

## 🚨 Fixing the `401 (Unauthorized)` Login Error

### Why does this error occur on a fresh clone?
When you clone the project on a new laptop, your local MongoDB database is completely empty. When you try to log in from the web frontend, the backend looks for `admin@phishguard.com` or `user@phishguard.com` in MongoDB, finds no match, and returns **`401 (Unauthorized)`**.

### ⚡ Quick Fix (1-Minute Fix)

1. Ensure **MongoDB** service is running on your laptop.
2. Open a terminal in the `Backend` directory and run:
   ```bash
   cd Backend
   node seed.js
   ```
   *Output should display:*
   ```text
   ✅ Connected to MongoDB
   🔑 Created default admin: admin@phishguard.com
   👤 Created default user: user@phishguard.com
   ✅ Forums, Education resources, and Flagged websites seeded successfully!
   ```
3. Restart your backend server (`npm run dev` inside `Backend`).
4. Try logging in again on `http://localhost:5173/login` using:
   - **Admin**: `admin@phishguard.com` / `admin123`
   - **User**: `user@phishguard.com` / `user123`

---

## 🧩 Overview of the 2 Chrome Extensions

PhishGuard comes with **two distinct browser extensions** serving complementary security functions:

```
PhishGuard/Frontend/extension/
├── (Extension 1) Phishing Security Scanner      [Root: Frontend/extension]
│   └── Real-time overlay threat warnings, risk scoring, Ctrl+Shift+S shortcut
│
└── (Extension 2) Web Security Bot & RAG AI      [Subfolder: Frontend/extension/web-secure-bot]
    └── Local IndexedDB vector RAG + Groq Llama-3.3 AI Chatbot for page security Q&A
```

| Extension Name | Folder Location | Key Capabilities |
| :--- | :--- | :--- |
| **1. Phishing Security Scanner** | `Frontend/extension` | Full-screen webpage warning overlay, API prediction, layer-by-layer security score, `Ctrl+Shift+S` shortcut |
| **2. Web Security Bot & RAG AI** | `Frontend/extension/web-secure-bot` | Client-side RAG vector storage, page DOM chunking, interactive Groq Llama 3.3 AI Security Chatbot |

---

## 📋 Full Step-by-Step Setup for a New Laptop

### Prerequisites

Make sure the following are installed on your new laptop:
1. **Node.js**: `v18.x` or `v20.x` LTS ([Download Node.js](https://nodejs.org/))
2. **MongoDB Community Server**: Running locally on port `27017` ([Download MongoDB](https://www.mongodb.com/try/download/community))
3. **Google Chrome / Brave Browser**: For testing the extension.

---

### Step 1: Verify MongoDB is Running

* **Windows**: Open PowerShell as Admin and run:
  ```powershell
  Get-Service -Name "*mongo*"
  # If not running, start it:
  Start-Service MongoDB
  ```
* **macOS / Linux**:
  ```bash
  sudo systemctl start mongod
  # Or with Homebrew:
  brew services start mongodb-community
  ```

---

### Step 2: Backend API Setup

1. Open terminal and navigate to `Backend`:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file inside `Backend/`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/threat-website
   JWT_SECRET=phishguard_secret_jwt_key_2026
   JWT_EXPIRE=30d
   WHOIS_API_KEY=at_5MVKxFZb6ZNGjXJM9XCyz3NJIZdBP
   ```

4. Seed the database with initial test data & hashed passwords:
   ```bash
   node seed.js
   ```

5. Start the Backend API server:
   ```bash
   npm run dev
   # Or: node src/server.js
   ```
   *Server will run at http://localhost:5000*

---

### Step 3: Web Frontend Setup

1. Open a **new terminal** and navigate to `Frontend/web`:
   ```bash
   cd Frontend/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Web Development server:
   ```bash
   npm run dev
   ```
   *Web application will open at http://localhost:5173*

---

### Step 4: Loading Both Extensions in Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle switch in the top-right corner).
3. **Load Extension 1 (Phishing Security Scanner)**:
   - Click **Load unpacked** (top-left).
   - Select folder: `PhishGuard/Frontend/extension`.
4. **Load Extension 2 (Web Security Bot & RAG AI Chatbot)**:
   - Click **Load unpacked** again.
   - Select folder: `PhishGuard/Frontend/extension/web-secure-bot`.
5. **Configure Groq API Key for Extension 2**:
   - Open line 6 of `Frontend/extension/web-secure-bot/background.js`:
     ```javascript
     let GROQ_API_KEY = "gsk_your_groq_api_key_here";
     ```

---

## 🔑 Pre-Configured Test Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@phishguard.com` | `admin123` | Full admin portal & website report approvals |
| **User** | `user@phishguard.com` | `user123` | Community forum, threat submission & guides |

---

## ❓ Common Troubleshooting Tips

* **`401 Unauthorized` Login Error**: Run `node seed.js` in `Backend` to populate the database with users and bcrypt password hashes.
* **`ECONNREFUSED 127.0.0.1:27017`**: MongoDB service is not running. Start the service using `Start-Service MongoDB`.
* **CORS Error**: Ensure the backend server is running on port `5000` and frontend on port `5173`.
