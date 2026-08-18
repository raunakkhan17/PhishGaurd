# Web Security ChatBot Browser Extension

A Chrome extension that uses Gemini AI to analyze websites and answer security-related questions.

## 🚀 Setup Instructions

### 1. Get Gemini API Key
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy the key

### 2. Configure the Extension
- Open `background.js`
- Replace `YOUR_GEMINI_API_KEY` with your actual API key

### 3. Load Extension in Chrome
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode" (toggle in top right)
- Click "Load unpacked"
- Select the `web-secure-bot` folder

### 4. Use the Extension
- Click the extension icon in your toolbar
- Navigate to any website
- Ask questions about the site's security, content, or structure

## 🔧 Features

- **Page Content Extraction**: Automatically extracts title, URL, text, links, and forms
- **AI-Powered Analysis**: Uses Gemini to understand and respond to questions
- **Security Focus**: Designed for security analysis and website understanding

## 📁 File Structure

```
web-secure-bot/
│── manifest.json      # Extension configuration
│── background.js      # Service worker & Gemini API calls
│── content.js         # Page content extraction
│── popup.html         # Chat interface
│── popup.js          # Chat functionality
│── styles.css         # UI styling
│── README.md          # This file
```

## ⚠️ Important Notes

- **API Key Security**: Never commit your API key to version control
- **Permissions**: The extension requests broad permissions to analyze any website
- **Rate Limits**: Be aware of Gemini API rate limits for production use

## 🧪 Testing

Try asking these questions:
- "Is this website secure?"
- "What forms are on this page?"
- "Are there any suspicious links?"
- "Summarize this website's content"
