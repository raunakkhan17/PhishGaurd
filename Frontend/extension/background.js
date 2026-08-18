// Background Service Worker for Website Security Scanner
class SecurityScanner {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.predictEndpoint = '/predict';
    this.scannedUrls = new Set();
    this.isEnabled = true;
    this.useTestData = false;

    this.init();
  }

  init() {
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));

    // Listen for tab activation
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    console.log('Security Scanner: Background service initialized');
  }

  /**
   * Extract only the base origin (protocol + domain) from a URL.
   * Removes paths, query params, fragments, session IDs, and dynamic route IDs.
   *
   * @param {string} url - Full URL
   * @returns {string} Base origin with trailing slash
   */
  extractBaseOrigin(url) {
    try {
      const parsed = new URL(url);
      return parsed.origin + '/';
    } catch (error) {
      console.warn('Failed to parse URL:', url, error);
      return url;
    }
  }

  // Handle tab updates
  async handleTabUpdate(tabId, changeInfo, tab) {
    if (!this.isEnabled || changeInfo.status !== 'complete') return;

    if (tab.url && tab.url.startsWith('http')) {
      const baseOrigin = this.extractBaseOrigin(tab.url);
      console.log('Security Scanner: New website detected:', tab.url);
      console.log('Security Scanner: Sending base origin:', baseOrigin);

      if (!this.scannedUrls.has(baseOrigin)) {
        this.scanWebsite(tabId, baseOrigin, tab.url);
      }
    }
  }

  // Handle tab activation
  async handleTabActivated(activeInfo) {
    if (!this.isEnabled) return;

    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.url.startsWith('http')) {
        const baseOrigin = this.extractBaseOrigin(tab.url);
        console.log('Security Scanner: Tab activated, scanning:', tab.url);
        console.log('Security Scanner: Sending base origin:', baseOrigin);

        if (!this.scannedUrls.has(baseOrigin)) {
          this.scanWebsite(tab.id, baseOrigin, tab.url);
        }
      }
    } catch (error) {
      console.error('Security Scanner: Error getting tab info:', error);
    }
  }

  // Scan website for security threats
  async scanWebsite(tabId, urlToScan, originalUrl = null) {
    try {
      const displayUrl = originalUrl || urlToScan;
      console.log('Security Scanner: Starting security scan for:', displayUrl);
      console.log('Security Scanner: Sending to backend (base origin):', urlToScan);

      this.scannedUrls.add(urlToScan);

      let securityData;

      if (this.useTestData) {
        console.log('Security Scanner: Using test data instead of API');
        try {
          const response = await fetch(chrome.runtime.getURL('securityData.json'));
          const testData = await response.json();
          securityData = { success: true, data: testData };
          console.log('Security Scanner: Loaded test data:', testData);
        } catch (error) {
          console.error('Security Scanner: Error loading test data:', error);
          securityData = { success: false, error: error.message };
        }
      } else {
        securityData = await this.callSecurityAPI(urlToScan);
      }

      if (securityData.success) {
        console.log('Security Scanner: Scan completed successfully');

        setTimeout(() => {
          this.showSecurityResults(tabId, securityData.data);
        }, this.useTestData ? 5000 : 10000);

      } else {
        console.error('Security Scanner: Scan failed:', securityData.error);
      }

    } catch (error) {
      console.error('Security Scanner: Error during scan:', error);
    }
  }

  // Call the security API
  async callSecurityAPI(url) {
    try {
      console.log('Security Scanner: Calling API for:', url);

      const response = await fetch(this.baseURL + this.predictEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ url: url })
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      console.log('Security Scanner: API response:', data);

      this.lastScanTime = new Date().toISOString();

      return { success: true, data: data };

    } catch (error) {
      console.error('Security Scanner: API call failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Show security results on the webpage
  async showSecurityResults(tabId, securityData) {
    try {
      console.log('Security Scanner: Showing results for tab:', tabId);
      console.log('Security Scanner: Data being sent to content script:', securityData);

      try {
        await this.ensureContentScriptLoaded(tabId);

        chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_SECURITY_RESULTS',
          data: securityData
        });
      } catch (error) {
        console.error('Security Scanner: Failed to communicate with content script:', error);
      }
    } catch (error) {
      console.error('Security Scanner: Error showing results:', error);
    }
  }

  // Ensure content script is loaded and ready
  async ensureContentScriptLoaded(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: 'PING' }, response => {
        const lastError = chrome.runtime.lastError;
        if (lastError || !response || response.type !== 'PONG') {
          console.log('Security Scanner: Content script not ready, injecting...');

          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          }).then(() => {
            console.log('Security Scanner: Content script injected successfully');

            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { type: 'PING' }, pingResponse => {
                if (chrome.runtime.lastError || !pingResponse) {
                  reject(new Error('Failed to inject content script'));
                } else {
                  resolve();
                }
              });
            }, 300);
          }).catch(err => {
            console.error('Security Scanner: Failed to inject content script:', err);
            reject(err);
          });
        } else {
          resolve();
        }
      });
    });
  }

  // Debug API call with detailed logging
  async debugAPICall(url) {
    try {
      console.log('DEBUG: Starting API call to:', this.baseURL + this.predictEndpoint);

      const response = await fetch(this.baseURL + this.predictEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ url: url })
      });

      console.log('DEBUG: HTTP Response status:', response.status);

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      console.log('DEBUG: Parsed API response:', data);

      if (data.final_result) {
        console.log('DEBUG: Final result:', data.final_result);
      } else {
        console.log('DEBUG: No final_result data found');
      }

    } catch (error) {
      console.error('DEBUG: API call failed:', error);
    }
  }

  // Handle messages from popup
  handleMessage(request, sender, sendResponse) {
    if (request.type === 'GET_STATUS') {
      sendResponse({
        enabled: this.isEnabled,
        useTestData: this.useTestData,
        scannedCount: this.scannedUrls.size,
        lastScan: this.lastScanTime
      });
    } else if (request.type === 'TOGGLE_ENABLED') {
      this.isEnabled = request.enabled;
      sendResponse({ success: true });
    } else if (request.type === 'TOGGLE_TEST_DATA') {
      this.useTestData = request.useTestData;
      console.log('Security Scanner: Test data mode ' + (this.useTestData ? 'enabled' : 'disabled'));
      sendResponse({ success: true });
    } else if (request.type === 'CLEAR_SCANNED') {
      this.scannedUrls.clear();
      sendResponse({ success: true });
    } else if (request.type === 'TEST_API') {
      fetch(chrome.runtime.getURL('securityData.json'))
        .then(response => response.json())
        .then(data => {
          console.log('Security Scanner: Loaded test data:', data);

          if (request.tabId) {
            this.showSecurityResults(request.tabId, data);
          } else {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
              if (tabs[0]) {
                this.showSecurityResults(tabs[0].id, data);
              }
            });
          }

          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('Security Scanner: Error loading test data:', error);
          sendResponse({ success: false, error: error.message });
        });

      return true;
    } else if (request.type === 'MANUAL_SCAN') {
      if (request.url) {
        const cleanUrl = this.extractBaseOrigin(request.url);
        console.log('Security Scanner: Manual scan - Original:', request.url, '| Clean:', cleanUrl);
        this.scanWebsite(request.tabId, cleanUrl, request.url);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No URL provided' });
      }
    } else if (request.type === 'DEBUG_DATA') {
      if (request.url) {
        const cleanUrl = this.extractBaseOrigin(request.url);
        console.log('DEBUG: Original URL:', request.url);
        console.log('DEBUG: Clean URL:', cleanUrl);
        console.log('DEBUG: Scanned URLs:', Array.from(this.scannedUrls));
        console.log('DEBUG: Scanner enabled:', this.isEnabled);
        console.log('DEBUG: Last scan time:', this.lastScanTime);
        console.log('DEBUG: Sending to API:', cleanUrl);
        this.debugAPICall(cleanUrl);

        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No URL provided' });
      }
    }
  }
}

// Initialize the security scanner
const securityScanner = new SecurityScanner();