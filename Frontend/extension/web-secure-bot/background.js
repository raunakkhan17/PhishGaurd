// ============================================
// WEB SECURITY BOT - BACKGROUND SERVICE WORKER
// Manifest V3 Compatible - Persistent Monitoring
// ============================================

let GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ============================================
// STATE MANAGEMENT
// ============================================
let isMonitoring = true;
let scannedUrls = new Set();
let recentScans = [];
let lastAPICall = null;
let lastResponse = null;

// Service worker keepalive system for MV3
let keepAliveInterval = null;
let lastKeepAlive = Date.now();

// ============================================
// INITIALIZATION
// ============================================
console.log('🚀 Background: Web Security Bot service worker loaded');
console.log('🔑 Background: Groq API key configured:', GROQ_API_KEY ? 'Yes' : 'No');

initializeServiceWorker();

// ============================================
// SERVICE WORKER INITIALIZATION
// ============================================
async function initializeServiceWorker() {
  console.log('🔧 Background: Initializing service worker...');
  setupTabListeners();
  startKeepAliveSystem();
  console.log('✅ Background: Service worker initialized');
  console.log('✅ Background: Monitoring is', isMonitoring ? 'ACTIVE' : 'INACTIVE');
}

// ============================================
// TAB LISTENERS
// ============================================
function setupTabListeners() {
  console.log('🔧 Background: Setting up tab listeners...');

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log('📡 Background: Tab updated event', { tabId, status: changeInfo.status, url: tab?.url });

    if (changeInfo.status !== 'complete') return;
    if (!isMonitoring) return;

    try {
      const fullTab = await chrome.tabs.get(tabId);
      if (!fullTab.url || !isValidURL(fullTab.url)) return;
      if (isBrowserPage(fullTab.url)) return;

      const baseURL = extractBaseOrigin(fullTab.url);
      if (scannedUrls.has(baseURL)) {
        console.log('⏭️ Background: Already scanned:', baseURL);
        return;
      }

      scannedUrls.add(baseURL);
      await scanWebsite(baseURL, fullTab.url);
    } catch (error) {
      console.error('❌ Background: Error processing tab update:', error);
    }
  });

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (!isMonitoring) return;

    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab.url || !isValidURL(tab.url)) return;
      if (isBrowserPage(tab.url)) return;

      const baseURL = extractBaseOrigin(tab.url);
      await scanWebsite(baseURL, tab.url);
    } catch (error) {
      console.error('❌ Background: Error processing tab activation:', error);
    }
  });

  console.log('✅ Background: Tab listeners setup complete');
}

// ============================================
// CORE SCANNING FUNCTION
// ============================================
async function scanWebsite(urlToScan, originalUrl = null) {
  const displayUrl = originalUrl || urlToScan;
  console.log('🔍 Background: Starting security scan for:', displayUrl);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{
          role: "user",
          content: `Analyze this URL for phishing/malicious indicators: ${urlToScan}. Respond ONLY with valid JSON: {"score": 0-100, "status": "safe/unsafe", "reason": "brief reason"}`
        }],
        max_tokens: 150
      })
    });

    console.log('📡 Background: Groq response status:', response.status);

    let securityData = null;
    try {
      const aiData = await response.json();
      if (response.ok) {
        const rawText = aiData.choices?.[0]?.message?.content || '';
        const clean = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        securityData = {
          final_result: {
            final_score: parsed.score || 0,
            status: parsed.status || 'Unknown',
            reasoning: parsed.reason || ''
          }
        };
        console.log('✅ Background: Scan parsed:', securityData);
      } else {
        console.error('❌ Background: Groq scan error:', aiData?.error?.message);
      }
    } catch (e) {
      console.log('📡 Background: Could not parse Groq scan response:', e.message);
    }

    const scanRecord = {
      url: displayUrl,
      apiUrl: urlToScan,
      timestamp: new Date().toISOString(),
      status: 'completed',
      securityData: securityData
    };

    recentScans.push(scanRecord);
    lastAPICall = displayUrl;
    lastResponse = securityData
      ? `Score: ${securityData.final_result?.final_score ?? 'N/A'}/100 (${securityData.final_result?.status ?? 'Unknown'})`
      : 'Scan recorded (no score data)';

    if (recentScans.length > 50) recentScans = recentScans.slice(-50);

    notifyPopupOfScan(scanRecord);

  } catch (error) {
    console.error('❌ Background: Scan failed:', error);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function isValidURL(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

function isBrowserPage(url) {
  return url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('file://');
}

function extractBaseOrigin(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin + '/';
  } catch (error) {
    return url;
  }
}

// ============================================
// KEEPALIVE SYSTEM
// ============================================
function startKeepAliveSystem() {
  keepAliveInterval = setInterval(() => {
    lastKeepAlive = Date.now();
    chrome.runtime.getPlatformInfo().then(() => {
      console.log('💓 Background: SW still alive');
    }).catch(() => {
      initializeServiceWorker();
    });
  }, 25000);
}

// ============================================
// POPUP COMMUNICATION
// ============================================
function notifyPopupOfScan(scanRecord) {
  try {
    chrome.runtime.sendMessage({ type: 'SCAN_UPDATE', data: scanRecord }).catch(() => { });
  } catch (error) {
    console.log('📨 Background: Could not notify popup:', error.message);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('📨 Background: Message received:', msg.type);

  try {
    if (msg.type === 'GET_STATUS') {
      sendResponse({
        isMonitoring,
        recentScans,
        lastAPICall,
        lastResponse,
        scannedCount: scannedUrls.size
      });
    }

    else if (msg.type === 'TOGGLE_MONITORING') {
      isMonitoring = msg.enabled;
      sendResponse({ success: true, isMonitoring });
    }

    else if (msg.type === 'SET_API_KEY') {
      GROQ_API_KEY = msg.apiKey;
      console.log('📨 Background: Groq API key updated');
      sendResponse({ success: true });
    }

    else if (msg.type === 'GET_API_KEY') {
      sendResponse({ apiKey: GROQ_API_KEY });
    }

    else if (msg.type === 'MANUAL_SCAN') {
      const baseURL = extractBaseOrigin(msg.url);
      scanWebsite(baseURL, msg.url).then(() => sendResponse({ success: true }));
      return true;
    }

    else if (msg.type === 'CLEAR_SCANS') {
      scannedUrls.clear();
      recentScans = [];
      sendResponse({ success: true });
    }

    else if (msg.type === 'ASK_GEMINI_RAG' || msg.type === 'ASK_GEMINI') {
      handleAIRequest(msg).then(response => {
        sendResponse(response);
      }).catch(error => {
        sendResponse({ error: error.message });
      });
      return true;
    }

  } catch (error) {
    console.error('❌ Background: Message handling error:', error);
    sendResponse({ error: error.message });
  }

  return true;
});

// ============================================
// AI REQUEST HANDLING (Groq API)
// ============================================
async function handleAIRequest(msg) {
  console.log('🤖 Background: Processing AI request:', msg.type);

  const prompt = msg.type === 'ASK_GEMINI_RAG'
    ? createRAGPrompt(msg.question, msg.context, msg.pageData)
    : createLegacyPrompt(msg.question, msg.pageData);

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + GROQ_API_KEY
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || `HTTP ${response.status}`;
    console.error('❌ Background: Groq API error:', errMsg);
    throw new Error(`Groq API error: ${errMsg}`);
  }

  const answer = data.choices?.[0]?.message?.content;

  if (!answer) {
    console.error('❌ Background: No answer in Groq response:', data);
    throw new Error('Groq returned empty response');
  }

  console.log('✅ Background: Groq answer received, length:', answer.length);
  return { answer };
}

// ============================================
// PROMPT CREATION
// ============================================
function createRAGPrompt(question, context, pageData) {
  const secInfo = pageData?.securityInfo || {};
  const forms = pageData?.forms || [];
  const links = pageData?.links || [];
  const hasLogin = pageData?.hasLoginForm ? 'Yes' : 'No';
  const hasPayment = pageData?.hasPaymentForm ? 'Yes' : 'No';

  return `You are WebSec-Bot, an AI assistant that answers questions about the website the user is currently visiting. You have full access to the page content and security data below.

CURRENT WEBSITE:
- URL: ${pageData?.url || 'Unknown'}
- Title: ${pageData?.title || 'Unknown'}
- HTTPS: ${secInfo.isHttps ? 'Yes (Secure)' : 'No (Insecure)'}
- Domain: ${secInfo.domain || 'Unknown'}
- Has Login Form: ${hasLogin}
- Has Payment Form: ${hasPayment}
- Total Links: ${links.length}
- Total Forms: ${forms.length}
- Meta Description: ${pageData?.metaDescription || 'None'}

PAGE CONTENT (relevant sections):
${context?.context || 'No content extracted'}

FORMS ON PAGE:
${forms.length > 0 ? forms.map((f, i) => `Form ${i + 1}: action="${f.action}", inputs: ${f.inputs.map(inp => inp.type + '(' + inp.name + ')').join(', ')}`).join('\n') : 'No forms found'}

LINKS ON PAGE (sample):
${links.slice(0, 10).map(l => `- ${l.text || 'No text'}: ${l.href}`).join('\n') || 'No links found'}

USER QUESTION: ${question}

Answer based on the actual page content above. If the question is about security, give a security assessment. If it's about page content or features, answer from what you can see in the page data.`;
}

function createLegacyPrompt(question, pageData) {
  const secInfo = pageData?.securityInfo || {};
  const forms = pageData?.forms || [];
  const links = pageData?.links || [];

  return `You are WebSec-Bot, an AI assistant that answers questions about the website the user is currently visiting.

CURRENT WEBSITE:
- URL: ${pageData?.url || 'Unknown'}
- Title: ${pageData?.title || 'Unknown'}
- HTTPS: ${secInfo.isHttps ? 'Yes (Secure)' : 'No (Insecure)'}
- Domain: ${secInfo.domain || 'Unknown'}
- Has Login Form: ${pageData?.hasLoginForm ? 'Yes' : 'No'}
- Has Payment Form: ${pageData?.hasPaymentForm ? 'Yes' : 'No'}
- Total Links: ${links.length}
- Total Forms: ${forms.length}

PAGE TEXT:
${pageData?.text?.substring(0, 3000) || 'No text extracted'}

FORMS:
${forms.length > 0 ? forms.map((f, i) => `Form ${i + 1}: action="${f.action}", inputs: ${f.inputs.map(inp => inp.type + '(' + inp.name + ')').join(', ')}`).join('\n') : 'No forms found'}

USER QUESTION: ${question}

Answer based on the actual page content above. Be specific and reference actual content from the page when possible.`;
}

// ============================================
// SERVICE WORKER LIFECYCLE
// ============================================
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 Background: Extension installed:', details.reason);
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Background: Extension started');
  initializeServiceWorker();
});

console.log('✅ Background: Service worker setup complete');
