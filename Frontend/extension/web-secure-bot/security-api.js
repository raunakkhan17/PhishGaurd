// Security API Service for Website Security Screening
class SecurityAPIService {
  constructor() {
    this.baseURL = 'https://27f9-2405-201-3032-8ea-5e5-4cf8-2d6f-96ce.ngrok-free.app';
    this.testEndpoint = '/';
    this.predictEndpoint = '/predict';
    this.currentSecurityData = null;
    this.isMonitoring = false;
  }

  // Test API connection
  async testAPI() {
    try {
      console.log(`🔍 Security API: Testing connection... ${this.baseURL + this.testEndpoint}`);
      
      const response = await fetch(this.baseURL + this.testEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Security API: Test successful:', data);
      return { success: true, data: data };
      
    } catch (error) {
      console.error('❌ Security API: Test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get security prediction for a URL
  async getSecurityPrediction(url) {
    try {
      console.log('🔍 Security API: Getting security prediction for:', url);
      console.log('⏰ Security API: Request started at:', new Date().toLocaleTimeString());
      
      const requestBody = {
        url: url
      };

      console.log('📤 Security API: Sending request body:', requestBody);
      console.log('🌐 Security API: Full URL:', this.baseURL + this.predictEndpoint);

      const response = await fetch(this.baseURL + this.predictEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Security API: Response received at:', new Date().toLocaleTimeString());
      console.log('📊 Security API: Response status:', response.status);
      console.log('📋 Security API: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Security API: Prediction received:', data);
      console.log('⏱️ Security API: Total request time:', new Date().toLocaleTimeString());
      
      // Store current security data
      this.currentSecurityData = data;
      
      return { success: true, data: data };
      
    } catch (error) {
      console.error('❌ Security API: Prediction failed:', error);
      console.error('🔍 Security API: Error details:', {
        message: error.message,
        stack: error.stack,
        url: url,
        timestamp: new Date().toLocaleTimeString()
      });
      return { success: false, error: error.message };
    }
  }

  // Get security score and status
  getSecurityStatus() {
    if (!this.currentSecurityData) {
      return { score: 0, status: 'Unknown', level: 'unknown' };
    }

    // Support Flask format: { prediction: { ml_risk_score, prediction } }
    const pred = this.currentSecurityData.prediction;
    let finalScore, status;

    if (pred && pred.ml_risk_score !== undefined) {
      finalScore = Math.round((1 - pred.ml_risk_score) * 100);
      status = pred.prediction || 'Unknown';
    } else {
      // Legacy fallback
      finalScore = this.currentSecurityData.final_result?.final_score || 0;
      status = this.currentSecurityData.final_result?.status || 'Unknown';
    }

    let level = 'safe';
    if (finalScore < 40) {
      level = 'dangerous';
    } else if (finalScore < 80) {
      level = 'moderate';
    }

    return {
      score: finalScore,
      status: status,
      level: level,
      data: this.currentSecurityData
    };
  }

  // Get detailed layer scores
  getLayerScores() {
    if (!this.currentSecurityData) return null;

    const pred = this.currentSecurityData.prediction;

    // Flask format: { prediction: { ml_risk_score, inteligence_system, behaviour_analysis } }
    if (pred && pred.ml_risk_score !== undefined) {
      const intel = pred.inteligence_system || {};
      const behaviour = pred.behaviour_analysis || {};
      const mlScore = Math.round((1 - pred.ml_risk_score) * 100);

      return {
        layer1: {
          status: pred.prediction || 'Unknown',
          reason: `ML risk score: ${(pred.ml_risk_score * 100).toFixed(1)}%`,
          score: mlScore
        },
        layer2: {
          status: intel.virustotal_status || 'No data',
          score: intel.trustworthiness !== undefined ? Math.round(intel.trustworthiness * 100) : mlScore,
          malware: { malicious: intel.malicious_count || 0, suspicious: intel.suspicious_count || 0 },
          domain: { age_days: intel.domain_age_days || 0, registrar: intel.registrar || 'Unknown' }
        },
        layer3: {
          status: 'Behaviour Analysis',
          score: mlScore,
          features: {
            has_password_field: behaviour.has_password_field || false,
            has_external_form: behaviour.has_external_form_action || false,
            has_hidden_iframe: behaviour.has_hidden_iframe || false,
            suspicious_js: behaviour.suspicious_js_functions || false,
            has_redirects: behaviour.has_redirects || false
          }
        }
      };
    }

    // Legacy fallback
    return {
      layer1: {
        status: this.currentSecurityData.layer1?.status || 'Unknown',
        reason: this.currentSecurityData.layer1?.reason || 'No data',
        score: this.currentSecurityData.layer1?.score || 0
      },
      layer2: {
        status: this.currentSecurityData.layer2?.summary || 'No data',
        score: this.currentSecurityData.layer2?.score || 0,
        malware: this.currentSecurityData.layer2?.malware_scan || {},
        domain: this.currentSecurityData.layer2?.domain_info || {}
      },
      layer3: {
        status: 'Feature Analysis',
        score: this.currentSecurityData.layer3?.score || 0,
        features: this.currentSecurityData.layer3?.feature_analysis || {}
      }
    };
  }

  // Start background monitoring
  startMonitoring() {
    this.isMonitoring = true;
    console.log('🔍 Security API: Background monitoring started');
    
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
  }

  // Stop background monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('🔍 Security API: Background monitoring stopped');
    
    // Remove listeners
    chrome.tabs.onUpdated.removeListener(this.handleTabUpdate.bind(this));
    chrome.tabs.onActivated.removeListener(this.handleTabActivated.bind(this));
  }

  // Handle tab updates
  async handleTabUpdate(tabId, changeInfo, tab) {
    if (!this.isMonitoring || changeInfo.status !== 'complete') return;
    
    console.log('🔍 Security API: Tab updated, checking security:', tab.url);
    
    if (tab.url && tab.url.startsWith('http')) {
      try {
        const result = await this.getSecurityPrediction(tab.url);
        if (result.success) {
          // Send security data to content script for overlay
          chrome.tabs.sendMessage(tabId, {
            type: 'SECURITY_UPDATE',
            data: result.data
          }).catch(() => {
            console.log('ℹ️ Security API: Content script not ready yet');
          });
        }
      } catch (error) {
        console.error('❌ Security API: Error checking tab security:', error);
      }
    }
  }

  // Handle tab activation
  async handleTabActivated(activeInfo) {
    if (!this.isMonitoring) return;
    
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.url.startsWith('http')) {
        console.log('🔍 Security API: Tab activated, checking security:', tab.url);
        
        const result = await this.getSecurityPrediction(tab.url);
        if (result.success) {
          // Send security data to content script for overlay
          chrome.tabs.sendMessage(tab.id, {
            type: 'SECURITY_UPDATE',
            data: result.data
          }).catch(() => {
            console.log('ℹ️ Security API: Content script not ready yet');
          });
        }
      }
    } catch (error) {
      console.error('❌ Security API: Error checking activated tab:', error);
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityAPIService;
} else {
  window.SecurityAPIService = SecurityAPIService;
}
