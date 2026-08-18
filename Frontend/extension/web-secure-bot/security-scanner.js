// Security Scanner Main JavaScript
class SecurityScanner {
  constructor() {
    this.securityAPI = new SecurityAPIService();
    this.ragService = new RAGService(); // Add RAG service
    this.currentURL = '';
    this.currentSecurityData = null;
    this.isMonitoring = false;
    this.recentScans = [];
    this.init();
  }

  init() {
    console.log('🚀 Security Scanner: Initializing...');

    // Listen for messages from background service worker
    this.setupBackgroundListener();

    this.setupEventListeners();
    this.startBackgroundMonitoring();
    this.initializeBackgroundMonitor();
    this.initializeChatBot(); // Add chat bot initialization
    this.testNavigation(); // Add navigation test
    console.log('✅ Security Scanner: Initialized successfully');
  }

  // Setup listener for background service worker messages
  setupBackgroundListener() {
    console.log('🔧 Setting up background listener...');

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Popup: Received message from background:', message.type);

      if (message.type === 'SCAN_UPDATE') {
        console.log('📨 Popup: Scan update received:', message.data);

        const scanData = message.data;
        const timestamp = new Date().toLocaleTimeString();

        // Resolve score from Flask or legacy format
        let score = 85;
        let status = 'Scanned';
        if (scanData.securityData) {
          const d = scanData.securityData;
          if (d.prediction?.ml_risk_score !== undefined) {
            score = Math.round((1 - d.prediction.ml_risk_score) * 100);
            status = d.prediction.prediction || 'Unknown';
          } else if (d.final_result?.final_score !== undefined) {
            score = d.final_result.final_score;
            status = d.final_result.status || 'Scanned';
          }
          this.updateLastResponse(d, timestamp);
        } else {
          document.getElementById('debug-last-response').textContent = `Scan recorded at ${timestamp}`;
        }

        this.addRecentScan(scanData.url, score, status);
        this.updateCurrentWebsite(scanData.url, `Score: ${score}/100`);
        this.addActivityFeedItem('success', '✅ Auto Scan Complete',
          `Security scan completed for ${scanData.url} - Score: ${score}/100`, 'Background scan');
        this.updateDebugPanel();
      }

      return true;
    });

    console.log('✅ Background listener setup complete');
  }

  // Test navigation functionality
  testNavigation() {
    console.log('🧪 Testing navigation functionality...');
    
    // Test if all screens exist
    const screens = ['security-scanner', 'background-monitor', 'chat-bot'];
    screens.forEach(screenId => {
      const screen = document.getElementById(screenId);
      console.log(`Screen ${screenId}:`, !!screen, screen?.classList.toString());
    });
    
    // Test if all tabs exist
    const tabs = ['security-tab', 'monitor-tab', 'chat-tab'];
    tabs.forEach(tabId => {
      const tab = document.getElementById(tabId);
      console.log(`Tab ${tabId}:`, !!tab, tab?.classList.toString());
    });
    
    console.log('🧪 Navigation test completed');
  }

  setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Navigation tabs
    document.getElementById('security-tab').addEventListener('click', () => showSecurityScanner());
    document.getElementById('monitor-tab').addEventListener('click', () => showBackgroundMonitor());
    document.getElementById('chat-tab').addEventListener('click', () => showChatBot());
    
    // Test API button
    document.getElementById('test-api-btn').addEventListener('click', () => this.testAPI());
    
    // Scan URL button
    document.getElementById('scan-btn').addEventListener('click', () => this.scanURL());
    
    // Retry button
    document.getElementById('retry-btn').addEventListener('click', () => retryScan());
    
    // Toggle monitoring button
    document.getElementById('toggle-monitor-btn').addEventListener('click', () => toggleMonitoring());
    
    // Debug panel buttons
    document.getElementById('clear-logs-btn').addEventListener('click', () => clearDebugLogs());
    document.getElementById('export-data-btn').addEventListener('click', () => exportDebugData());
    document.getElementById('test-bg-api-btn').addEventListener('click', () => testBackgroundAPI());
    document.getElementById('test-json-btn').addEventListener('click', () => testNewJSONStructure());
    document.getElementById('test-rag-btn').addEventListener('click', () => testRAGService());

    // URL input enter key
    document.getElementById('url-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.scanURL();
      }
    });
    
    console.log('✅ Event listeners set up successfully');
  }

  // Initialize background monitor screen
  initializeBackgroundMonitor() {
    // Set start time
    const startTime = new Date().toLocaleTimeString();
    document.getElementById('start-time').textContent = startTime;
    
    // Start monitoring by default
    this.isMonitoring = true;
    this.updateMonitorStatus();
    
    // Initialize debug panel
    this.initializeDebugPanel();
  }

  // Initialize debug panel
  initializeDebugPanel() {
    // Update debug values
    this.updateDebugPanel();
    
    // Update every 2 seconds
    setInterval(() => {
      this.updateDebugPanel();
    }, 2000);
  }

  // Update debug panel with current values
  async updateDebugPanel() {
    document.getElementById('debug-base-url').textContent = this.securityAPI.baseURL;

    try {
      const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      console.log('📊 Debug panel: Background status:', status);

      document.getElementById('debug-monitoring-status').textContent = status.isMonitoring ? 'Active' : 'Inactive';
      document.getElementById('debug-total-scans').textContent = status.scannedCount || 0;
      document.getElementById('debug-last-call').textContent = status.lastAPICall || 'None';
      document.getElementById('debug-last-response').textContent = status.lastResponse || 'None';

      // Populate recent scans from background if local list is empty
      if (this.recentScans.length === 0 && status.recentScans?.length > 0) {
        status.recentScans.slice(-10).reverse().forEach(scan => {
          const score = scan.securityData?.final_result?.final_score ?? 85;
          const scanStatus = scan.securityData?.final_result?.status ?? 'Scanned';
          this.recentScans.push({ url: scan.url, score, status: scanStatus, time: new Date(scan.timestamp).toLocaleTimeString() });
        });
        this.updateRecentScansDisplay();
      }
    } catch (error) {
      console.log('📊 Debug panel: Using local status');
      document.getElementById('debug-monitoring-status').textContent = this.isMonitoring ? 'Active' : 'Inactive';
      document.getElementById('debug-total-scans').textContent = this.recentScans.length;
    }

    this.getActiveTabInfo();
  }

  // Get active tab information for debug panel
  async getActiveTabInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        document.getElementById('debug-active-tab').textContent = tab.url;
      } else {
        document.getElementById('debug-active-tab').textContent = 'No active tab';
      }
    } catch (error) {
      document.getElementById('debug-active-tab').textContent = 'Error getting tab';
    }
  }

  // Update last API call info
  updateLastAPICall(url, timestamp) {
    document.getElementById('debug-last-call').textContent = `${url} at ${timestamp}`;
  }

  // Update last response info
  updateLastResponse(data, timestamp) {
    let responseText = 'No data';

    if (data) {
      // Flask format: { prediction: { ml_risk_score, prediction } }
      if (data.prediction?.ml_risk_score !== undefined) {
        const score = Math.round((1 - data.prediction.ml_risk_score) * 100);
        const status = data.prediction.prediction || 'Unknown';
        responseText = `Score: ${score}/100 (${status})`;
      } else {
        const finalScore = data.final_result?.final_score || 'N/A';
        const status = data.final_result?.status || 'Unknown';
        responseText = `Score: ${finalScore}/100 (${status})`;
      }
    }

    document.getElementById('debug-last-response').textContent = `${responseText} at ${timestamp}`;
  }

  // Parse and display JSON response details
  parseJSONResponse(jsonString) {
    try {
      // Remove markdown code blocks if present
      let cleanJson = jsonString;
      if (jsonString.includes('```json')) {
        cleanJson = jsonString.replace(/```json\n?/g, '').replace(/```/g, '');
      }
      
      const data = JSON.parse(cleanJson);
      console.log('✅ JSON Response Parsed Successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to parse JSON response:', error);
      console.log('Raw response:', jsonString);
      return null;
    }
  }

  // Enhanced display security results with JSON parsing
  displaySecurityResults(data) {
    console.log('📊 Security Scanner: Displaying results:', data);
    
    // If data is a string, try to parse it as JSON
    if (typeof data === 'string') {
      const parsedData = this.parseJSONResponse(data);
      if (parsedData) {
        data = parsedData;
      } else {
        console.error('❌ Could not parse response data');
        this.showErrorState('Invalid response format received');
        return;
      }
    }
    
    // Hide loading and error states
    this.hideAllStates();
    
    // Show results
    const resultsDiv = document.getElementById('security-results');
    resultsDiv.classList.remove('hidden');
    
    // Support Flask format: { prediction: { ml_risk_score, prediction } }
    let finalScore, finalStatus, finalReason;
    if (data.prediction?.ml_risk_score !== undefined) {
      finalScore = Math.round((1 - data.prediction.ml_risk_score) * 100);
      finalStatus = data.prediction.prediction || 'Unknown';
      finalReason = `ML risk score: ${(data.prediction.ml_risk_score * 100).toFixed(1)}%`;
    } else {
      finalScore = data.final_result?.final_score || 0;
      finalStatus = data.final_result?.status || 'Unknown';
      finalReason = data.final_result?.reasoning || 'No data available';
    }

    document.getElementById('score-number').textContent = finalScore;
    document.getElementById('status-text').textContent = finalStatus;
    document.getElementById('status-reason').textContent = finalReason;

    const scoreCircle = document.getElementById('score-circle');
    scoreCircle.className = 'score-circle';
    if (finalScore < 40) {
      scoreCircle.classList.add('dangerous');
    } else if (finalScore < 80) {
      scoreCircle.classList.add('moderate');
    }
    
    // Update layer scores with proper data
    this.updateLayerScores(data);
    
    // Update detailed analysis
    this.updateDetailedAnalysis(data);
    
    // Check security thresholds for overlay
    this.checkSecurityThresholds(data);
  }

  // Update monitor status display
  updateMonitorStatus() {
    const statusDot = document.getElementById('monitor-dot');
    const statusText = document.getElementById('monitor-status-text');
    const toggleBtn = document.getElementById('toggle-monitor-btn');
    
    if (this.isMonitoring) {
      statusDot.classList.remove('inactive');
      statusText.textContent = 'Monitoring Active';
      toggleBtn.textContent = '🛑 Stop Monitoring';
      toggleBtn.classList.remove('start');
    } else {
      statusDot.classList.add('inactive');
      statusText.textContent = 'Monitoring Stopped';
      toggleBtn.textContent = '▶️ Start Monitoring';
      toggleBtn.classList.add('start');
    }
  }

  // Toggle monitoring on/off
  toggleMonitoring() {
    this.isMonitoring = !this.isMonitoring;
    
    if (this.isMonitoring) {
      this.startBackgroundMonitoring();
      this.addActivityFeedItem('success', '🟢 Monitoring Started', 'Background security monitoring has been activated', 'Monitoring resumed');
    } else {
      this.stopBackgroundMonitoring();
      this.addActivityFeedItem('warning', '🟡 Monitoring Stopped', 'Background security monitoring has been deactivated', 'Monitoring paused');
    }
    
    this.updateMonitorStatus();
  }

  // Add item to activity feed
  addActivityFeedItem(type, title, description, timeText) {
    const feedContainer = document.getElementById('feed-container');
    const time = new Date().toLocaleTimeString();
    
    const feedItem = document.createElement('div');
    feedItem.className = `feed-item ${type}`;
    feedItem.innerHTML = `
      <div class="feed-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : type === 'api' ? '🌐' : 'ℹ️'}</div>
      <div class="feed-content">
        <div class="feed-title">${title}</div>
        <div class="feed-desc">${description}</div>
        <div class="feed-time">${timeText}: ${time}</div>
      </div>
    `;
    
    // Add to top of feed
    feedContainer.insertBefore(feedItem, feedContainer.firstChild);
    
    // Limit feed items to prevent overflow
    const feedItems = feedContainer.querySelectorAll('.feed-item');
    if (feedItems.length > 20) {
      feedItems[feedItems.length - 1].remove();
    }
  }

  // Update current website display
  updateCurrentWebsite(url, status) {
    const websiteInfo = document.getElementById('current-website-info');
    websiteInfo.innerHTML = `
      <div class="website-url">${url}</div>
      <div class="website-status">${status}</div>
    `;
  }

  // Add scan to recent scans
  addRecentScan(url, score, status) {
    const scan = {
      url: url,
      score: score,
      status: status,
      time: new Date().toLocaleTimeString()
    };
    
    this.recentScans.unshift(scan);
    
    // Keep only last 10 scans
    if (this.recentScans.length > 10) {
      this.recentScans = this.recentScans.slice(0, 10);
    }
    
    this.updateRecentScansDisplay();
  }

  // Update recent scans display
  updateRecentScansDisplay() {
    const scansContainer = document.getElementById('scans-container');
    
    if (this.recentScans.length === 0) {
      scansContainer.innerHTML = '<div class="no-scans">No scans performed yet</div>';
      return;
    }
    
    let html = '';
    this.recentScans.forEach(scan => {
      const scoreClass = scan.score < 40 ? 'dangerous' : scan.score < 80 ? 'moderate' : 'safe';
      html += `
        <div class="scan-item ${scoreClass}">
          <div class="scan-url">${scan.url}</div>
          <div class="scan-score ${scoreClass}">${scan.score}/100</div>
          <div class="scan-time">${scan.time}</div>
        </div>
      `;
    });
    
    scansContainer.innerHTML = html;
  }

  // Test API connection
  async testAPI() {
    const testBtn = document.getElementById('test-api-btn');
    const testResult = document.getElementById('test-result');
    
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    testResult.innerHTML = '';
    
    try {
      const result = await this.securityAPI.testAPI();
      
      if (result.success) {
        testResult.innerHTML = `
          <div class="test-result success">
            ✅ API Connection Successful!<br>
            Response: ${JSON.stringify(result.data)}
          </div>
        `;
        this.addActivityFeedItem('success', '✅ API Test Success', 'Security API connection test completed successfully', 'API tested');
      } else {
        testResult.innerHTML = `
          <div class="test-result error">
            ❌ API Connection Failed!<br>
            Error: ${result.error}
          </div>
        `;
        this.addActivityFeedItem('error', '❌ API Test Failed', `API connection test failed: ${result.error}`, 'API test failed');
      }
    } catch (error) {
      testResult.innerHTML = `
        <div class="test-result error">
          ❌ API Test Error!<br>
          Error: ${error.message}
        </div>
      `;
      this.addActivityFeedItem('error', '❌ API Test Error', `API test error: ${error.message}`, 'API test error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test API Connection';
    }
  }

  // Scan a specific URL
  async scanURL() {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    
    if (!url) {
      alert('Please enter a valid URL');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    this.currentURL = url;
    await this.performSecurityScan(url);
  }

  // Perform security scan
  async performSecurityScan(url) {
    console.log('🔍 Security Scanner: Starting scan for:', url);
    
    // Show loading state
    this.showLoadingState();
    
    // Add to activity feed
    this.addActivityFeedItem('api', '🌐 Manual Scan Started', `Initiating security scan for: ${url}`, 'Scan started');
    
    try {
      const result = await this.securityAPI.getSecurityPrediction(url);
      
      if (result.success) {
        this.currentSecurityData = result.data;
        this.displaySecurityResults(result.data);
        this.checkSecurityThresholds(result.data);

        // Support Flask format
        const finalScore = result.data.prediction?.ml_risk_score !== undefined
          ? Math.round((1 - result.data.prediction.ml_risk_score) * 100)
          : (result.data.final_result?.final_score || 0);
        const finalStatus = result.data.prediction?.prediction || result.data.final_result?.status || 'Unknown';
        this.addRecentScan(url, finalScore, finalStatus);

        this.addActivityFeedItem('success', '✅ Scan Completed', `Security scan completed for ${url} - Score: ${finalScore}/100`, 'Scan completed');
      } else {
        this.showErrorState(result.error);
        this.addActivityFeedItem('error', '❌ Scan Failed', `Security scan failed for ${url}: ${result.error}`, 'Scan failed');
      }
    } catch (error) {
      console.error('❌ Security Scanner: Scan failed:', error);
      this.showErrorState(error.message);
      this.addActivityFeedItem('error', '❌ Scan Error', `Scan error for ${url}: ${error.message}`, 'Scan error');
    }
  }

  // Update layer scores with proper data display
  updateLayerScores(data) {
    // Layer 1 - LLM Classification
    const layer1 = data.layer1 || {};
    document.getElementById('layer1-score').textContent = layer1.score || 0;
    document.getElementById('layer1-status').textContent = layer1.status || 'Unknown';
    document.getElementById('layer1-reason').textContent = layer1.reason || 'No data';
    
    // Layer 2 - Threat Intelligence & Domain Analysis
    const layer2 = data.layer2 || {};
    document.getElementById('layer2-score').textContent = layer2.score || 0;
    document.getElementById('layer2-status').textContent = layer2.summary || 'No data';
    document.getElementById('layer2-reason').textContent = this.formatLayer2Reason(layer2);
    
    // Layer 3 - Feature Analysis
    const layer3 = data.layer3 || {};
    document.getElementById('layer3-score').textContent = layer3.score || 0;
    document.getElementById('layer3-status').textContent = 'Feature Analysis';
    document.getElementById('layer3-reason').textContent = this.formatLayer3Reason(layer3);
  }

  // Format Layer 2 reason - Updated for new structure
  formatLayer2Reason(layer2) {
    if (!layer2.threat_intel_analysis || !layer2.domain_analysis) return 'No data';
    
    const threatIntel = layer2.threat_intel_analysis;
    const domain = layer2.domain_analysis;
    
    let reason = '';
    
    // Threat Intel Analysis
    if (threatIntel.malicious_ratio !== undefined) {
      reason += `Threat Intel: ${threatIntel.malicious_ratio}% malicious, `;
    }
    
    // Domain Analysis
    if (domain.domain_age_days !== null) {
      reason += `Domain Age: ${domain.domain_age_days} days, `;
    }
    if (domain.registrar_trustworthiness) {
      reason += `Registrar: ${domain.registrar_trustworthiness}, `;
    }
    if (domain.safety_score !== undefined) {
      reason += `Safety: ${domain.safety_score}/10`;
    }
    
    return reason || 'Domain and threat analysis complete';
  }

  // Format Layer 3 reason
  formatLayer3Reason(layer3) {
    if (!layer3.feature_analysis) return 'No data';
    
    const features = layer3.feature_analysis;
    const keyFeatures = [];
    
    if (features.is_https) keyFeatures.push('HTTPS');
    if (features.has_suspicious_words === false) keyFeatures.push('No suspicious words');
    if (features.url_length) keyFeatures.push('URL length normal');
    
    return keyFeatures.length > 0 ? keyFeatures.join(', ') : 'Feature analysis complete';
  }

  // Update detailed analysis
  updateDetailedAnalysis(data) {
    const analysisContent = document.getElementById('analysis-content');
    
    let html = `
      <div class="analysis-section">
        <h4>🛡️ Final Security Assessment</h4>
        <p><strong>Score:</strong> ${data.final_result?.final_score || 0}/100</p>
        <p><strong>Status:</strong> ${data.final_result?.status || 'Unknown'}</p>
        <p><strong>Reasoning:</strong> ${data.final_result?.reasoning || 'No data'}</p>
      </div>
    `;
    
    // Layer 1 details
    if (data.layer1) {
      html += `
        <div class="analysis-section">
          <h4>🛡️ Layer 1: LLM Classification</h4>
          <p><strong>Status:</strong> ${data.layer1.status}</p>
          <p><strong>Score:</strong> ${data.layer1.score}/10</p>
          <p><strong>Reason:</strong> ${data.layer1.reason}</p>
        </div>
      `;
    }
    
    // Layer 2 details - Updated for new structure
    if (data.layer2) {
      html += `
        <div class="analysis-section">
          <h4>🔒 Layer 2: Threat Intelligence & Domain Analysis</h4>
          <p><strong>Overall Score:</strong> ${data.layer2.score}/50</p>
          <p><strong>Summary:</strong> ${data.layer2.summary}</p>
      `;
      
      // Threat Intel Analysis
      if (data.layer2.threat_intel_analysis) {
        const threatIntel = data.layer2.threat_intel_analysis;
        html += `
          <div class="sub-section">
            <h5>🕵️ Threat Intelligence Analysis</h5>
            <p><strong>Score:</strong> ${threatIntel.score || 'N/A'}/20</p>
            <p><strong>Malicious:</strong> ${threatIntel.malicious || 0} (${threatIntel.malicious_ratio || 0}%)</p>
            <p><strong>Suspicious:</strong> ${threatIntel.suspicious || 0} (${threatIntel.suspicious_ratio || 0}%)</p>
            <p><strong>Harmless:</strong> ${threatIntel.harmless || 0}</p>
            <p><strong>Undetected:</strong> ${threatIntel.undetected || 0}</p>
            <p><strong>Timeout:</strong> ${threatIntel.timeout || 0}</p>
          </div>
        `;
      }
      
      // Domain Analysis
      if (data.layer2.domain_analysis) {
        const domain = data.layer2.domain_analysis;
        html += `
          <div class="sub-section">
            <h5>🌐 Domain Analysis</h5>
            <p><strong>Safety Score:</strong> ${domain.safety_score || 'N/A'}/10</p>
            <p><strong>Domain Age:</strong> ${domain.domain_age_days !== null ? domain.domain_age_days + ' days' : 'Unknown'}</p>
            <p><strong>Registrar Trustworthiness:</strong> ${domain.registrar_trustworthiness || 'Unknown'}</p>
            <p><strong>Registrant Email:</strong> ${domain.registrant_email_type || 'Unknown'}</p>
            <p><strong>Registrant Name:</strong> ${domain.registrant_name_authenticity || 'Unknown'}</p>
            <p><strong>Country:</strong> ${domain.country_of_registrant || 'Unknown'}</p>
            <p><strong>TLD Country Mismatch:</strong> ${domain.tld_country_mismatch !== null ? (domain.tld_country_mismatch ? 'Yes' : 'No') : 'Unknown'}</p>
            <p><strong>Domain Status:</strong> ${domain.domain_status ? domain.domain_status.join(', ') : 'Unknown'}</p>
            <p><strong>Name Servers:</strong> ${domain.name_servers ? domain.name_servers.join(', ') : 'Unknown'}</p>
          </div>
        `;
      }
      
      html += `</div>`;
    }
    
    // Layer 3 details - Updated for new structure
    if (data.layer3) {
      html += `
        <div class="analysis-section">
          <h4>🔍 Layer 3: Feature Analysis</h4>
          <p><strong>Score:</strong> ${data.layer3.score}/40</p>
          <div class="sub-section">
            <h5>🔧 URL Features Analysis</h5>
      `;
      
      if (data.layer3.feature_analysis) {
        const features = data.layer3.feature_analysis;
        const featureItems = [
          { key: 'url_length', label: 'URL Length' },
          { key: 'num_dots', label: 'Number of Dots' },
          { key: 'has_at', label: 'Contains @ Symbol' },
          { key: 'num_hyphens', label: 'Number of Hyphens' },
          { key: 'num_digits', label: 'Number of Digits' },
          { key: 'is_https', label: 'HTTPS Protocol' },
          { key: 'has_suspicious_words', label: 'Suspicious Words' },
          { key: 'has_suspicious_domain', label: 'Suspicious Domain' },
          { key: 'domain_length', label: 'Domain Length' }
        ];
        
        featureItems.forEach(item => {
          if (features[item.key] !== undefined) {
            html += `<p><strong>${item.label}:</strong> ${features[item.key]}</p>`;
          }
        });
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    analysisContent.innerHTML = html;
  }

  // Check security thresholds and show overlays
  checkSecurityThresholds(data) {
    const finalScore = data.prediction?.ml_risk_score !== undefined
      ? Math.round((1 - data.prediction.ml_risk_score) * 100)
      : (data.final_result?.final_score || 0);

    if (finalScore < 40) {
      this.showDangerousOverlay(data);
    } else if (finalScore < 80) {
      this.showModerateOverlay(data);
    }
  }

  // Show dangerous overlay
  showDangerousOverlay(data) {
    const score = data.prediction?.ml_risk_score !== undefined
      ? Math.round((1 - data.prediction.ml_risk_score) * 100)
      : (data.final_result?.final_score || 0);
    const reason = data.prediction?.ml_risk_score !== undefined
      ? `ML risk score: ${(data.prediction.ml_risk_score * 100).toFixed(1)}%`
      : (data.final_result?.reasoning || 'Multiple security threats detected');
    const overlay = document.createElement('div');
    overlay.className = 'security-overlay dangerous-overlay';
    overlay.innerHTML = `
      <div class="overlay-content">
        <div class="overlay-icon">🚨</div>
        <h2>⚠️ DANGEROUS WEBSITE DETECTED!</h2>
        <div class="overlay-score">
          <span class="score-number">${score}</span>/100
        </div>
        <div class="overlay-reason">
          <strong>Security Issues:</strong><br>
          ${reason}
        </div>
        <div class="overlay-actions">
          <button class="overlay-btn danger-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
            🚫 STOP - Do Not Continue
          </button>
          <button class="overlay-btn continue-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
            ⚠️ Continue at Your Own Risk
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  // Show moderate overlay
  showModerateOverlay(data) {
    const score = data.prediction?.ml_risk_score !== undefined
      ? Math.round((1 - data.prediction.ml_risk_score) * 100)
      : (data.final_result?.final_score || 0);
    const reason = data.prediction?.ml_risk_score !== undefined
      ? `ML risk score: ${(data.prediction.ml_risk_score * 100).toFixed(1)}%`
      : (data.final_result?.reasoning || 'Some security issues detected');
    const overlay = document.createElement('div');
    overlay.className = 'security-overlay moderate-overlay';
    overlay.innerHTML = `
      <div class="overlay-content">
        <div class="overlay-icon">⚠️</div>
        <h2>⚠️ MODERATE SECURITY RISK</h2>
        <div class="overlay-score">
          <span class="score-number">${score}</span>/100
        </div>
        <div class="overlay-reason">
          <strong>Security Concerns:</strong><br>
          ${reason}
        </div>
        <div class="overlay-actions">
          <button class="overlay-btn warning-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
            ⚠️ Proceed with Caution
          </button>
          <button class="overlay-btn back-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
            🔙 Go Back
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  // Show loading state
  showLoadingState() {
    this.hideAllStates();
    document.getElementById('loading-state').classList.remove('hidden');
  }

  // Show error state
  showErrorState(errorMessage) {
    this.hideAllStates();
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('error-message').textContent = errorMessage;
  }

  // Hide all states
  hideAllStates() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('security-results').classList.add('hidden');
  }

  // Start background monitoring
  async startBackgroundMonitoring() {
    if (!this.isMonitoring) return;

    try {
      // Request background to start monitoring via message
      const response = await chrome.runtime.sendMessage({
        type: 'TOGGLE_MONITORING',
        enabled: true
      });

      console.log('🔍 Security Scanner: Background monitoring started via service worker');
      console.log('🔍 Response:', response);
    } catch (error) {
      console.error('❌ Error starting background monitoring:', error);
    }
  }

  // Stop background monitoring
  async stopBackgroundMonitoring() {
    try {
      await chrome.runtime.sendMessage({
        type: 'TOGGLE_MONITORING',
        enabled: false
      });
      console.log('🔍 Security Scanner: Background monitoring stopped');
    } catch (error) {
      console.error('❌ Error stopping background monitoring:', error);
    }
  }

  // Handle tab updates with logging
  async handleTabUpdateWithLogging(tabId, changeInfo, tab) {
    if (!this.isMonitoring || changeInfo.status !== 'complete') return;
    
    console.log('🔍 Security Scanner: Tab updated, checking security:', tab.url);
    
    if (tab.url && tab.url.startsWith('http')) {
      // Update current website display
      this.updateCurrentWebsite(tab.url, 'Scanning...');
      
      // Update debug panel
      const timestamp = new Date().toLocaleTimeString();
      this.updateLastAPICall(tab.url, timestamp);
      
      // Add to activity feed
      this.addActivityFeedItem('api', '🌐 Website Detected', `New website detected: ${tab.url}`, 'Website detected');
      
      try {
        const result = await this.securityAPI.getSecurityPrediction(tab.url);
        if (result.success) {
          const finalScore = result.data.prediction?.ml_risk_score !== undefined
            ? Math.round((1 - result.data.prediction.ml_risk_score) * 100)
            : (result.data.final_result?.final_score || 0);
          const finalStatus = result.data.prediction?.prediction || result.data.final_result?.status || 'Unknown';
          this.addRecentScan(tab.url, finalScore, finalStatus);
          this.updateCurrentWebsite(tab.url, `Scanned - Score: ${finalScore}/100`);
          this.updateLastResponse(result.data, timestamp);
          this.addActivityFeedItem('success', '✅ Background Scan Complete', `Security scan completed for ${tab.url} - Score: ${finalScore}/100`, 'Background scan');
          
          // Send security data to content script for overlay display
          console.log('🛡️ Security Scanner: Sending security data to content script for overlay');
          chrome.tabs.sendMessage(tabId, {
            type: 'SECURITY_UPDATE',
            data: result.data
          }).catch((error) => {
            console.log('ℹ️ Security Scanner: Content script not ready yet, will retry:', error.message);
            // Retry after a short delay
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, {
                type: 'SECURITY_UPDATE',
                data: result.data
              }).catch(() => {
                console.log('ℹ️ Security Scanner: Content script still not ready');
              });
            }, 2000);
          });
        }
      } catch (error) {
        console.error('❌ Security Scanner: Error checking tab security:', error);
        this.addActivityFeedItem('error', '❌ Background Scan Failed', `Failed to scan ${tab.url}: ${error.message}`, 'Background scan failed');
        this.updateCurrentWebsite(tab.url, 'Scan failed');
      }
    }
  }

  // Handle tab activation with logging
  async handleTabActivatedWithLogging(activeInfo) {
    if (!this.isMonitoring) return;
    
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.url.startsWith('http')) {
        console.log('🔍 Security Scanner: Tab activated, checking security:', tab.url);
        
        // Update current website display
        this.updateCurrentWebsite(tab.url, 'Checking...');
        
        const result = await this.securityAPI.getSecurityPrediction(tab.url);
        if (result.success) {
          const finalScore = result.data.prediction?.ml_risk_score !== undefined
            ? Math.round((1 - result.data.prediction.ml_risk_score) * 100)
            : (result.data.final_result?.final_score || 0);
          const finalStatus = result.data.prediction?.prediction || result.data.final_result?.status || 'Unknown';
          this.addRecentScan(tab.url, finalScore, finalStatus);
          this.updateCurrentWebsite(tab.url, `Scanned - Score: ${finalScore}/100`);
          console.log('🛡️ Security Scanner: Sending security data to activated tab for overlay');
          chrome.tabs.sendMessage(tab.id, {
            type: 'SECURITY_UPDATE',
            data: result.data
          }).catch((error) => {
            console.log('ℹ️ Security Scanner: Content script not ready yet, will retry:', error.message);
            // Retry after a short delay
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, {
                type: 'SECURITY_UPDATE',
                data: result.data
              }).catch(() => {
                console.log('ℹ️ Security Scanner: Content script still not ready');
              });
            }, 2000);
          });
        }
      }
    } catch (error) {
      console.error('❌ Security Scanner: Error checking activated tab:', error);
    }
  }

  // Retry scan
  retryScan() {
    if (this.currentURL) {
      this.performSecurityScan(this.currentURL);
    }
  }

  // Test RAG service functionality
  async testRAGService() {
    console.log('🧪 Testing RAG service...');
    
    try {
      // Get current page data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.startsWith('http')) {
        console.log('🧪 RAG Test: Getting page data from:', tab.url);
        
        const pageData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
        console.log('🧪 RAG Test: Page data received:', {
          hasData: !!pageData,
          hasText: !!pageData?.text,
          textLength: pageData?.text?.length || 0,
          hasChunks: !!pageData?.textChunks,
          chunksCount: pageData?.textChunks?.length || 0
        });
        
        if (pageData && pageData.text && pageData.text.length > 0) {
          // Store in RAG service
          console.log('🧪 RAG Test: Storing page data in RAG service...');
          await this.ragService.storeChunks(pageData.url, pageData.textChunks || [], {
            title: pageData.title,
            url: pageData.url,
            text: pageData.text,
            forms: pageData.forms,
            links: pageData.links
          });
          
          // Test retrieval
          console.log('🧪 RAG Test: Testing context retrieval...');
          const context = await this.ragService.getContextForQuestion('Is this website secure?', pageData.url);
          console.log('🧪 RAG Test: Context retrieved:', {
            hasContext: !!context,
            contextLength: context?.context?.length || 0,
            chunksCount: context?.chunks?.length || 0
          });
          
          this.addActivityFeedItem('success', '✅ RAG Test Success', 'RAG service is working correctly', 'RAG test');
        } else {
          this.addActivityFeedItem('error', '❌ RAG Test Failed', 'No page data available for testing', 'RAG test');
        }
      } else {
        this.addActivityFeedItem('error', '❌ RAG Test Failed', 'No active website tab found', 'RAG test');
      }
    } catch (error) {
      console.error('❌ RAG Test Error:', error);
      this.addActivityFeedItem('error', '❌ RAG Test Error', `Test failed: ${error.message}`, 'RAG test');
    }
  }

  // Test with sample JSON response to demonstrate new structure
  testNewJSONStructure() {
    const sampleResponse = `{
      "layer1": {
        "status": "Phishing",
        "reason": "The URL has a suspicious top-level domain and lacks indicators of trust",
        "score": 2
      },
      "layer2": {
        "threat_intel_analysis": {
          "malicious": 0,
          "suspicious": 0,
          "harmless": 0,
          "undetected": 0,
          "timeout": 0,
          "malicious_ratio": 0.00,
          "suspicious_ratio": 0.00,
          "score": 20
        },
        "domain_analysis": {
          "domain_age_days": 129,
          "registrar_trustworthiness": "Medium",
          "registrant_email_type": "Paid",
          "registrant_name_authenticity": "Hidden",
          "country_of_registrant": "HK",
          "tld_country_mismatch": null,
          "domain_status": ["restricted"],
          "name_servers": null,
          "safety_score": 2
        },
        "summary": "The domain has a medium trustworthiness registrar and a hidden registrant name, which looks risky, but the threat intel scan shows no malicious activity",
        "score": 30
      },
      "layer3": {
        "feature_analysis": {
          "url_length": "The URL length is slightly long, which could be a sign of obfuscation, but it's not excessively long",
          "num_dots": "The presence of one dot is normal and not indicative of any risk",
          "has_at": "The absence of '@' is normal and not indicative of any risk",
          "num_hyphens": "The absence of hyphens is normal and not indicative of any risk",
          "num_digits": "The absence of digits is normal and not indicative of any risk",
          "is_https": "The presence of HTTPS is a positive indicator, as it ensures a secure connection",
          "has_suspicious_words": "The absence of suspicious words in the URL is a positive indicator, as their presence can be used for phishing",
          "has_suspicious_domain": "The domain is not on known suspicious or free-hosting lists, which is a positive indicator",
          "domain_length": "The domain length is 20, which is not unusually long or short, and is a neutral indicator"
        },
        "score": 45
      },
      "final_result": {
        "final_score": 77,
        "status": "Phishing",
        "reasoning": "Although the final score is 77, which is relatively high, the LLM classification and domain analysis indicate potential risks, and the URL's suspicious top-level domain and lack of indicators of trust lead to the conclusion that the URL is likely phishing"
      }
    }`;

    console.log('🧪 Testing new JSON structure with sample response');
    
    // Parse and display the sample response
    const parsedData = this.parseJSONResponse(sampleResponse);
    if (parsedData) {
      this.displaySecurityResults(parsedData);
      this.addActivityFeedItem('success', '✅ JSON Structure Test', 'Successfully parsed and displayed new API response structure', 'Structure test');
      
      // Also test the website overlay by sending to content script
      console.log('🧪 Testing website overlay with sample data');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'SECURITY_UPDATE',
            data: parsedData
          }).catch(() => {
            console.log('ℹ️ Content script not ready for overlay test');
          });
        }
      });
    } else {
      this.addActivityFeedItem('error', '❌ JSON Structure Test Failed', 'Failed to parse sample JSON response', 'Structure test failed');
    }
  }

  // Initialize chat bot functionality
  initializeChatBot() {
    console.log('💬 Security Scanner: Initializing chat bot...');
    
    // Get chat elements
    const chatContainer = document.getElementById('chat');
    const questionInput = document.getElementById('question');
    const sendButton = document.getElementById('send');
    
    console.log('🔍 Chat elements found:', {
      chatContainer: !!chatContainer,
      questionInput: !!questionInput,
      sendButton: !!sendButton
    });
    
    if (!chatContainer || !questionInput || !sendButton) {
      console.error('❌ Security Scanner: Chat bot elements not found');
      return;
    }
    
    // Initialize RAG service if not already done
    if (this.ragService) {
      console.log('🔍 RAG: Initializing RAG service...');
      this.ragService.init().then(() => {
        console.log('✅ RAG: RAG service initialized successfully');
      }).catch(error => {
        console.error('❌ RAG: Failed to initialize RAG service:', error);
      });
    }
    
    // Add event listeners for chat
    sendButton.addEventListener('click', () => this.handleChatMessage());
    questionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleChatMessage();
      }
    });
    
    // Add welcome message
    this.addChatMessage('bot', 'Hello! I\'m your security assistant. Ask me anything about website security, and I\'ll help you analyze the current page or answer your questions.');
    
    console.log('✅ Security Scanner: Chat bot initialized successfully');
  }

  // Handle chat message
  async handleChatMessage() {
    const questionInput = document.getElementById('question');
    const question = questionInput.value.trim();
    
    if (!question) return;
    
    // Add user message to chat
    this.addChatMessage('user', question);
    
    // Clear input
    questionInput.value = '';
    
    // Show loading state
    this.setChatLoading(true);
    
    try {
      console.log('🔍 Chat: Getting current page data...');
      
      // Get current page data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('🔍 Chat: Active tab:', tab?.url);
      
      if (tab && tab.url && tab.url.startsWith('http')) {
        // Try to get page data from content script
        try {
          console.log('🔍 Chat: Requesting page data from content script...');
          const pageData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
          console.log('🔍 Chat: Page data received:', {
            hasData: !!pageData,
            hasText: !!pageData?.text,
            textLength: pageData?.text?.length || 0,
            hasChunks: !!pageData?.textChunks,
            chunksCount: pageData?.textChunks?.length || 0
          });
          
          if (pageData && pageData.text && pageData.text.length > 0) {
            // Store page data in RAG service first
            console.log('🔍 Chat: Storing page data in RAG service...');
            try {
              await this.ragService.storeChunks(pageData.url, pageData.textChunks || [], {
                title: pageData.title,
                url: pageData.url,
                text: pageData.text,
                forms: pageData.forms,
                links: pageData.links
              });
              console.log('✅ Chat: Page data stored in RAG service');
            } catch (error) {
              console.log('⚠️ Chat: Failed to store page data in RAG service:', error.message);
            }
            
            // Use RAG-enhanced response with page context
            console.log('🔍 Chat: Using RAG-enhanced response with page context');
            await this.processQuestionWithRAG(question, pageData);
          } else {
            // Fallback to simple response
            console.log('🔍 Chat: No page data, using simple response');
            await this.sendSimpleResponse(question);
          }
        } catch (error) {
          console.log('ℹ️ Chat: Content script not ready, using simple response:', error.message);
          await this.sendSimpleResponse(question);
        }
      } else {
        // No active tab or not a website
        console.log('🔍 Chat: No active website tab, using simple response');
        await this.sendSimpleResponse(question);
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      this.addChatMessage('bot', 'Sorry, I encountered an error. Please try again.');
    } finally {
      this.setChatLoading(false);
    }
  }

  // Process question with RAG
  async processQuestionWithRAG(question, pageData) {
    try {
      console.log('🔍 RAG: Processing question with RAG...');
      console.log('🔍 RAG: Question:', question);
      console.log('🔍 RAG: Page URL:', pageData.url);
      console.log('🔍 RAG: Page text length:', pageData.text?.length || 0);
      
      // Get relevant context using RAG
      console.log('🔍 RAG: Getting context from RAG service...');
      const context = await this.ragService.getContextForQuestion(question, pageData.url);
      console.log('🔍 RAG: Context received:', {
        hasContext: !!context,
        contextLength: context?.context?.length || 0,
        chunksCount: context?.chunks?.length || 0
      });
      
      // Send to Gemini with context
      console.log('🔍 RAG: Sending to Gemini with RAG context...');
      const response = await this.sendToGeminiWithContext(question, context, pageData);
      console.log('🔍 RAG: Gemini response received:', {
        hasResponse: !!response,
        hasAnswer: !!response?.answer,
        answerLength: response?.answer?.length || 0
      });
      
      if (response && response.answer) {
        this.addChatMessage('bot', response.answer);
      } else {
        console.log('⚠️ RAG: No proper response from Gemini, falling back to simple response');
        await this.sendSimpleResponse(question);
      }
    } catch (error) {
      console.error('❌ RAG processing error:', error);
      console.log('🔄 RAG: Falling back to simple response due to error');
      await this.sendSimpleResponse(question);
    }
  }

  // Send simple response without RAG
  async sendSimpleResponse(question) {
    try {
      const response = await this.sendToGeminiLegacy(question);
      if (response && response.answer) {
        this.addChatMessage('bot', response.answer);
      } else if (response && response.error) {
        console.error('❌ Simple response: API error:', response.error);
        this.addChatMessage('bot', `API Error: ${response.error}`);
      } else {
        this.addChatMessage('bot', 'No response received. Check the service worker console for details.');
      }
    } catch (error) {
      console.error('❌ Simple response error:', error);
      this.addChatMessage('bot', `Error: ${error.message}`);
    }
  }

  // Send to Gemini with RAG context
  async sendToGeminiWithContext(question, context, pageData) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ASK_GEMINI_RAG',
        question: question,
        context: context,
        pageData: pageData
      });
      
      return response;
    } catch (error) {
      console.error('❌ Error sending to Gemini with RAG:', error);
      throw error;
    }
  }

  // Send to Gemini without RAG (legacy)
  async sendToGeminiLegacy(question) {
    try {
      // Try to get current page data for context
      let pageData = null;
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.startsWith('http')) {
          pageData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
        }
      } catch (error) {
        console.log('ℹ️ Could not get page data for legacy request:', error.message);
      }
      
      const response = await chrome.runtime.sendMessage({
        type: 'ASK_GEMINI',
        question: question,
        pageData: pageData
      });
      
      return response;
    } catch (error) {
      console.error('❌ Error sending to Gemini legacy:', error);
      throw error;
    }
  }

  // Add chat message
  addChatMessage(sender, text) {
    const chatContainer = document.getElementById('chat');
    if (!chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (sender === 'user') {
      messageContent.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
    } else {
      messageContent.innerHTML = this.formatBotResponse(text);
    }
    
    messageDiv.appendChild(messageContent);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Format bot response
  formatBotResponse(text) {
    // Basic markdown formatting
    let formatted = this.escapeHtml(text);
    
    // Convert **text** to <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *text* to <em>text</em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return `<p>${formatted}</p>`;
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Set chat loading state
  setChatLoading(loading) {
    const loader = document.getElementById('loader');
    const btnText = document.querySelector('.btn-text');
    const sendBtn = document.getElementById('send');
    
    if (loading) {
      loader.style.display = 'block';
      btnText.style.display = 'none';
      sendBtn.disabled = true;
    } else {
      loader.style.display = 'none';
      btnText.style.display = 'block';
      sendBtn.disabled = false;
    }
  }
}

// Navigation functions
function showSecurityScanner() {
  console.log('🔄 Navigation: Switching to Security Scanner');
  document.getElementById('security-scanner').classList.add('active');
  document.getElementById('background-monitor').classList.remove('active');
  document.getElementById('chat-bot').classList.remove('active');
  
  document.getElementById('security-tab').classList.add('active');
  document.getElementById('monitor-tab').classList.remove('active');
  document.getElementById('chat-tab').classList.remove('active');
  console.log('✅ Navigation: Security Scanner screen activated');
}

function showBackgroundMonitor() {
  console.log('🔄 Navigation: Switching to Background Monitor');
  document.getElementById('background-monitor').classList.add('active');
  document.getElementById('security-scanner').classList.remove('active');
  document.getElementById('chat-bot').classList.remove('active');
  
  document.getElementById('monitor-tab').classList.add('active');
  document.getElementById('security-tab').classList.remove('active');
  document.getElementById('chat-tab').classList.remove('active');
  console.log('✅ Navigation: Background Monitor screen activated');
}

function showChatBot() {
  console.log('🔄 Navigation: Switching to Chat Bot');
  document.getElementById('chat-bot').classList.add('active');
  document.getElementById('security-scanner').classList.remove('active');
  document.getElementById('background-monitor').classList.remove('active');
  
  document.getElementById('chat-tab').classList.add('active');
  document.getElementById('security-tab').classList.remove('active');
  document.getElementById('monitor-tab').classList.remove('active');
  console.log('✅ Navigation: Chat Bot screen activated');
}

// Global functions for button onclick
function testAPI() {
  if (window.securityScanner) {
    window.securityScanner.testAPI();
  }
}

function scanURL() {
  if (window.securityScanner) {
    window.securityScanner.scanURL();
  }
}

function retryScan() {
  if (window.securityScanner) {
    window.securityScanner.retryScan();
  }
}

function toggleMonitoring() {
  if (window.securityScanner) {
    window.securityScanner.toggleMonitoring();
  }
}

// Debug panel functions
function clearDebugLogs() {
  if (window.securityScanner) {
    // Clear recent scans
    window.securityScanner.recentScans = [];
    window.securityScanner.updateRecentScansDisplay();
    
    // Clear activity feed
    const feedContainer = document.getElementById('feed-container');
    feedContainer.innerHTML = `
      <div class="feed-item info">
        <div class="feed-icon">ℹ️</div>
        <div class="feed-content">
          <div class="feed-title">Logs Cleared</div>
          <div class="feed-desc">All logs have been cleared</div>
          <div class="feed-time">Cleared at: ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;
    
    // Reset debug values
    document.getElementById('debug-last-call').textContent = 'None';
    document.getElementById('debug-last-response').textContent = 'None';
    document.getElementById('debug-total-scans').textContent = '0';
    
    console.log('🧹 Debug logs cleared');
  }
}

function exportDebugData() {
  if (window.securityScanner) {
    const debugData = {
      timestamp: new Date().toISOString(),
      monitoring: window.securityScanner.isMonitoring,
      recentScans: window.securityScanner.recentScans,
      currentSecurityData: window.securityScanner.currentSecurityData,
      apiBaseURL: window.securityScanner.securityAPI.baseURL
    };
    
    const dataStr = JSON.stringify(debugData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `security-scanner-debug-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    
    console.log('📥 Debug data exported');
  }
}

function testBackgroundAPI() {
  if (window.securityScanner) {
    // Test with a sample URL
    const testUrl = 'https://example.com';
    console.log('🧪 Testing background API with:', testUrl);
    
    // Add to activity feed
    window.securityScanner.addActivityFeedItem('api', '🧪 Test API Call', `Testing background API with ${testUrl}`, 'Test started');
    
    // Update debug panel
    const timestamp = new Date().toLocaleTimeString();
    window.securityScanner.updateLastAPICall(testUrl, timestamp);
    
    // Make the API call
    window.securityScanner.securityAPI.getSecurityPrediction(testUrl)
      .then(result => {
        if (result.success) {
          const score = result.data.prediction?.ml_risk_score !== undefined
            ? Math.round((1 - result.data.prediction.ml_risk_score) * 100)
            : (result.data.final_result?.final_score || 'N/A');
          window.securityScanner.addActivityFeedItem('success', '✅ Test API Success', `Test API call successful - Score: ${score}/100`, 'Test completed');
          window.securityScanner.updateLastResponse(result.data, timestamp);
        } else {
          window.securityScanner.addActivityFeedItem('error', '❌ Test API Failed', `Test API call failed: ${result.error}`, 'Test failed');
        }
      })
      .catch(error => {
        window.securityScanner.addActivityFeedItem('error', '❌ Test API Error', `Test API call error: ${error.message}`, 'Test error');
      });
  }
}

function testNewJSONStructure() {
  if (window.securityScanner) {
    window.securityScanner.testNewJSONStructure();
  }
}

function testRAGService() {
  if (window.securityScanner) {
    window.securityScanner.testRAGService();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Security Scanner: DOM loaded, initializing...');
  
  // Wait a bit to ensure all elements are ready
  setTimeout(() => {
    window.securityScanner = new SecurityScanner();
    
    // Test navigation manually
    console.log('🧪 Manual navigation test...');
    if (typeof showChatBot === 'function') {
      console.log('✅ showChatBot function is available');
    } else {
      console.error('❌ showChatBot function is NOT available');
    }
    
    if (typeof showSecurityScanner === 'function') {
      console.log('✅ showSecurityScanner function is available');
    } else {
      console.error('❌ showSecurityScanner function is NOT available');
    }
    
    if (typeof showBackgroundMonitor === 'function') {
      console.log('✅ showBackgroundMonitor function is available');
    } else {
      console.error('❌ showBackgroundMonitor function is NOT available');
    }
  }, 100);
});

