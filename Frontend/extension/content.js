// Content Script for Website Security Scanner
class SecurityOverlay {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
    this.currentData = null;
    this.useDummyData = false; // Toggle for dummy data
    
    this.init();
  }

  init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Create overlay container
    this.createOverlay();
    
    console.log('🔒 Security Overlay: Content script initialized');
  }

  // Handle messages from background script
  handleMessage(request, sender, sendResponse) {
    // Respond to ping messages to confirm content script is active
    if (request.type === 'PING') {
      console.log('👋 Security Overlay: Received ping, responding with pong');
      sendResponse({ type: 'PONG' });
      return true; // Keep the message channel open for async response
    }
    
    if (request.type === 'SHOW_SECURITY_RESULTS') {
      console.log('📊 Security Overlay: Received security data:', request.data);
      
      // Validate the data before displaying
      if (!request.data || typeof request.data !== 'object') {
        console.error('❌ Security Overlay: Invalid data received:', request.data);
        this.showErrorOverlay('Invalid data received from security API');
        return;
      }
      
      this.currentData = request.data;
      this.showSecurityResults(request.data);
      
      // Confirm receipt
      sendResponse({ success: true });
      return true; // Keep the message channel open
    }
  }

  // Create the overlay container
  createOverlay() {
    // Remove existing overlay if any
    if (this.overlay) {
      this.overlay.remove();
    }

    // Create overlay container - first a backdrop
    this.overlayBackdrop = document.createElement('div');
    this.overlayBackdrop.id = 'security-scanner-backdrop';
    this.overlayBackdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      z-index: 999998;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      pointer-events: auto;
    `;
    
    // Then the actual overlay box
    this.overlay = document.createElement('div');
    this.overlay.id = 'security-scanner-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      height: 80%;
      max-width: 1400px;
      max-height: 800px;
      background: white;
      color: #333;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: auto;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      pointer-events: auto;
    `;
    
    // Prevent right-click context menu
    this.overlay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    // Prevent any drag operations
    this.overlay.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    // Add to page
    document.body.appendChild(this.overlayBackdrop);
    document.body.appendChild(this.overlay);
  }

  // Show error overlay when something goes wrong
  showErrorOverlay(errorMessage) {
    if (!this.overlay || !this.overlayBackdrop) return;

    // Update overlay content with error message
    this.overlay.innerHTML = `
      <div style="width: 100%; height: 100%; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: white;">
        <div style="font-size: 120px; margin-bottom: 25px;">⚠️</div>
        <div style="font-size: 28px; font-weight: 700; margin-bottom: 20px; color: #e74c3c;">Security Scan Error</div>
        <div style="font-size: 18px; color: #34495e; line-height: 1.7; margin-bottom: 35px; max-width: 550px; background: #f8f9fa; padding: 25px; border-radius: 16px; border-left: 5px solid #e74c3c;">
          ${errorMessage}
        </div>
        <div style="font-size: 16px; color: #7f8c8d; margin-bottom: 35px; font-weight: 500;">
          Please try refreshing the page or contact support if the issue persists.
        </div>
        <button id="close-error-btn" style="
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
          border: none;
          padding: 18px 35px;
          font-size: 18px;
          font-weight: 700;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 35px rgba(231, 76, 60, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(231, 76, 60, 0.4)'">Close</button>
      </div>
    `;
    
    // Add event listener for close button
    setTimeout(() => {
      const closeBtn = document.getElementById('close-error-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.hideOverlay();
        });
      }
    }, 0);
    
    // Show overlay with animation
    setTimeout(() => {
      this.overlayBackdrop.style.opacity = '1';
      this.overlay.style.opacity = '1';
      this.isVisible = true;
    }, 100);
  }

  // Show security results
  showSecurityResults(securityData) {
    if (!this.overlay || !this.overlayBackdrop) return;

    // Store the current data
    this.currentData = securityData;
    console.log('📊 Security Overlay: Displaying data:', this.currentData);
    
    // Extract and check response type
    const extractedData = this.extractSecurityData(securityData);
    console.log('🔍 Security Overlay: Extracted data:', extractedData);
    
    // Select the right overlay based on response type
    if (extractedData.responseType === 'whitelist' || extractedData.isWhitelisted) {
      console.log('✅ Security Overlay: Using whitelist overlay');
      this.overlay.innerHTML = this.generateWhitelistOverlay(extractedData);
    } 
    else if (extractedData.responseType === 'blacklist' || extractedData.isBlacklisted) {
      console.log('⚠️ Security Overlay: Using blacklist overlay');
      this.overlay.innerHTML = this.generateBlacklistOverlay(extractedData);
    }
    else {
      console.log('🔍 Security Overlay: Using 3-layer analysis overlay');
      this.overlay.innerHTML = this.generateOverlayContent(securityData);
    }
    
    // Add event listeners for the various buttons
    setTimeout(() => {
      // For all overlay types - dummy data toggle
      const dummyDataToggle = document.getElementById('dummy-data-toggle');
      if (dummyDataToggle) {
        dummyDataToggle.addEventListener('click', () => {
          this.toggleDummyData();
        });
      }
      
      // For all overlay types - proceed button
      const proceedButton = document.getElementById('proceed-button');
      if (proceedButton) {
        proceedButton.addEventListener('click', () => {
          this.hideOverlay();
        });
      }
      
      // For blacklist overlay - back button
      const backButton = document.getElementById('back-button');
      if (backButton) {
        backButton.addEventListener('click', () => {
          history.back();
        });
      }
      
      // For 3-layer analysis overlay - view details buttons
      const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
      viewDetailsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const layerNum = e.target.getAttribute('data-layer');
          this.showLayerDetails(layerNum);
        });
      });
      
      // For 3-layer analysis overlay - close modal button
      const closeModalBtn = document.getElementById('close-modal-btn');
      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
          this.hideLayerDetails();
        });
      }
    }, 0);
    
    // Show overlay with animation
    setTimeout(() => {
      this.overlayBackdrop.style.opacity = '1';
      this.overlay.style.opacity = '1';
      this.isVisible = true;
    }, 100);
  }

  /**
   * Extract and normalize security data from API response
   * Supports both new format (prediction object) and legacy format (layer objects)
   * @param {Object} rawData - Raw API response data
   * @returns {Object} Normalized security data
   */
  extractSecurityData(rawData) {
    console.log('🔍 Extracting security data from:', rawData);

    if (!rawData || typeof rawData !== 'object') {
      console.warn('⚠️ Invalid data structure received:', rawData);
      return this.getDefaultSecurityData('Invalid data structure received from API');
    }

    try {
      // ============================================================
      // NEW FORMAT: Backend returns { url, prediction: { ... } }
      // ============================================================
      if (rawData.prediction && typeof rawData.prediction === 'object') {
        console.log('📦 Detected new prediction format from backend');
        return this.extractNewPredictionFormat(rawData);
      }

      // ============================================================
      // LEGACY FORMAT: Check for final_result structure
      // ============================================================
      const finalResult = rawData.final_result || {};
      const detectionMethod = finalResult.detection_method || 'unknown';

      let extractedData = {
        responseType: detectionMethod,
        final: {
          score: finalResult.final_score || 0,
          status: finalResult.status || 'Unknown',
          reasoning: finalResult.reasoning || 'No analysis available',
          confidence: finalResult.confidence || 'Unknown',
          detectionMethod: detectionMethod
        }
      };

      // Handle different response types
      if (detectionMethod === 'whitelist') {
        extractedData.isWhitelisted = true;
        extractedData.whitelistReason = finalResult.reasoning || 'Domain matches trusted whitelist entry';
      }
      else if (detectionMethod === 'blacklist') {
        extractedData.isBlacklisted = true;
        extractedData.blacklistReason = finalResult.reasoning || 'Domain matches known malicious entry';
      }
      else if (detectionMethod === '3_layer_analysis') {
        const layerBreakdown = finalResult.layer_breakdown || {};
        extractedData.layer1 = this.extractLayer1FromNewFormat(layerBreakdown.layer1_llm || {});
        extractedData.layer2 = this.extractLayer2FromNewFormat(layerBreakdown.layer2_threat || {});
        extractedData.layer3 = this.extractLayer3FromNewFormat(layerBreakdown.layer3_ml || {});
      }
      else {
        // Legacy format - try layer1, layer2, layer3
        console.warn('⚠️ Unknown or legacy response format, using fallback extraction');
        extractedData.layer1 = this.extractLayer1Data(rawData.layer1 || {});
        extractedData.layer2 = this.extractLayer2Data(rawData.layer2 || {});
        extractedData.layer3 = this.extractLayer3Data(rawData.layer3 || {});
      }

      console.log('✅ Successfully extracted security data:', extractedData);
      return extractedData;

    } catch (error) {
      console.error('❌ Error extracting security data:', error);
      return this.getDefaultSecurityData(`Error processing data: ${error.message}`);
    }
  }

  /**
   * Extract data from new prediction format
   * Backend returns: { url, prediction: { ml_risk_score, prediction, features, intelligence system, behaviour_analysis } }
   */
  extractNewPredictionFormat(rawData) {
    console.log('🔍 Processing new prediction format...');

    const prediction = rawData.prediction;
    const url = rawData.url || '';

    // Extract main prediction values
    const isLegitimate = prediction.prediction?.toLowerCase() === 'legitimate';
    const mlRiskScore = prediction.ml_risk_score !== undefined ? prediction.ml_risk_score : 0;

    // Convert ml_risk_score (0-1) to percentage score (0-100)
    // High risk = low safe score, Low risk = high safe score
    const safeScore = Math.round((1 - mlRiskScore) * 100);
    const riskPercentage = Math.round(mlRiskScore * 100);

    // Determine status
    const status = prediction.prediction || 'Unknown';

    // Build reasoning from available data
    let reasoning = '';

    // Add intelligence system info if available
    if (prediction['inteligence system']) {
      const intel = prediction['inteligence system'];
      if (intel.malicious_ratio !== undefined) {
        reasoning += `VirusTotal malicious ratio: ${(intel.malicious_ratio * 100).toFixed(1)}%. `;
      }
      if (intel.registrar_trustworthiness) {
        reasoning += `Registrar trustworthiness: ${intel.registrar_trustworthiness}. `;
      }
    }

    // Add behaviour analysis if available
    if (prediction.behaviour_analysis) {
      const behaviour = prediction.behaviour_analysis;
      if (behaviour.has_password_field) {
        reasoning += 'Contains password field. ';
      }
      if (behaviour.has_external_form_action) {
        reasoning += 'Has external form action. ';
      }
    }

    // Add features if available
    if (prediction.features) {
      const features = prediction.features;
      if (features.url_length) {
        reasoning += `URL length: ${features.url_length}. `;
      }
      if (features.is_https !== undefined) {
        reasoning += features.is_https ? 'HTTPS enabled. ' : 'Not HTTPS. ';
      }
    }

    if (!reasoning) {
      reasoning = `ML Risk Score: ${riskPercentage}%. Analysis based on URL features, threat intelligence, and behavior.`;
    }

    // Extract layer data from intelligence system
    const intelSystem = prediction['inteligence system'] || {};
    const behaviour = prediction.behaviour_analysis || {};
    const features = prediction.features || {};

    // Build the extracted data structure
    const extractedData = {
      responseType: 'new_prediction_format',
      final: {
        score: safeScore,
        status: status,
        reasoning: reasoning,
        confidence: mlRiskScore >= 0.5 ? 'High' : 'Medium',
        detectionMethod: 'ml_risk_analysis'
      },
      isLegitimate: isLegitimate,
      mlRiskScore: mlRiskScore,

      // Layer 1: LLM Analysis (from prediction.prediction)
      layer1: {
        score: isLegitimate ? 85 : 25,
        status: prediction.prediction || 'Unknown',
        reason: isLegitimate
          ? 'URL analyzed and determined to be legitimate'
          : 'URL analysis indicates potential phishing indicators'
      },

      // Layer 2: Threat Intelligence (from inteligence system)
      layer2: {
        score: this.calculateThreatScore(intelSystem),
        summary: 'Threat intelligence analysis',
        threatIntel: {
          malicious: intelSystem.malicious || 0,
          suspicious: intelSystem.suspicious || 0,
          harmless: intelSystem.harmless || 0,
          undetected: intelSystem.undetected || 0,
          malicious_ratio: intelSystem.malicious_ratio || 0
        },
        registration: {
          domain_age_days: intelSystem.domain_age_days || 0,
          registrar_trustworthiness: intelSystem.registrar_trustworthiness || 'Unknown',
          registrant_email_type: intelSystem.registrant_email_type || 'Unknown'
        }
      },

      // Layer 3: ML Features (from features and behaviour)
      layer3: {
        score: this.calculateMLScore(features, behaviour),
        features: features,
        prediction: prediction.prediction || 'Unknown',
        confidence: mlRiskScore
      }
    };

    console.log('✅ Extracted new prediction format data:', extractedData);
    return extractedData;
  }

  /**
   * Calculate threat score from intelligence system data
   */
  calculateThreatScore(intelSystem) {
    if (!intelSystem || Object.keys(intelSystem).length === 0) {
      return 50; // Neutral
    }

    const maliciousRatio = intelSystem.malicious_ratio || 0;
    const suspiciousRatio = intelSystem.suspicious_ratio || 0;

    // Higher malicious ratio = lower score (more dangerous)
    const threatScore = Math.round((1 - maliciousRatio - suspiciousRatio) * 100);
    return Math.max(0, Math.min(100, threatScore));
  }

  /**
   * Calculate ML score from features and behavior
   */
  calculateMLScore(features, behaviour) {
    if (!features || Object.keys(features).length === 0) {
      return 50; // Neutral
    }

    let score = 50;

    // Check for suspicious indicators
    if (behaviour.has_password_field) score -= 20;
    if (behaviour.has_external_form_action) score -= 15;
    if (behaviour.has_hidden_iframe) score -= 25;
    if (behaviour.suspicious_js) score -= 20;

    // Check URL features
    if (features.is_https === 1) score += 10;
    if (features.has_suspicious_tld === 1) score -= 15;
    if (features.num_suspicious_keywords > 0) score -= 10;
    if (features.is_ip === 1) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract Layer 1 (LLM) data from new format
   */
  extractLayer1FromNewFormat(layer1Data) {
    if (!layer1Data || typeof layer1Data !== 'object') {
      return {
        score: 0,
        status: 'Unknown',
        reason: 'No LLM analysis data available'
      };
    }

    const data = layer1Data.data || {};
    
    return {
      score: layer1Data.score || 0,
      weight: layer1Data.weight || 0.25,
      status: data.prediction || 'Unknown',
      reason: data.reason || 'No analysis details available'
    };
  }

  /**
   * Extract Layer 2 (Threat Intel) data from new format
   */
  extractLayer2FromNewFormat(layer2Data) {
    if (!layer2Data || typeof layer2Data !== 'object') {
      return {
        score: 0,
        summary: 'No threat intelligence data available',
        threatIntel: {},
        registration: {}
      };
    }

    const data = layer2Data.data || {};
    
    return {
      score: layer2Data.score || 0,
      weight: layer2Data.weight || 0.4,
      summary: 'Threat intelligence analysis',
      threatIntel: data.virustotal || {},
      registration: data.whois || {}
    };
  }

  /**
   * Extract Layer 3 (ML) data from new format
   */
  extractLayer3FromNewFormat(layer3Data) {
    if (!layer3Data || typeof layer3Data !== 'object') {
      return {
        score: 0,
        features: {}
      };
    }

    const data = layer3Data.data || {};
    
    return {
      score: layer3Data.score || 0,
      weight: layer3Data.weight || 0.35,
      features: data.features || {},
      prediction: data.ml_prediction || 'Unknown',
      confidence: data.ml_confidence || 0,
      riskFactors: data.risk_factors || []
    };
  }

  /**
   * Extract final result data with fallbacks
   */
  extractFinalResult(data) {
    const finalResult = data.final_result || {};
    
    return {
      score: finalResult.final_score || data.final_score || data.score || 0,
      status: finalResult.status || data.status || 'Unknown',
      reasoning: finalResult.reasoning || data.reasoning || data.reason || data.explanation || 'No analysis available'
    };
  }

  /**
   * Extract Layer 1 (URL Analysis) data
   */
  extractLayer1Data(layer1Data) {
    if (!layer1Data || typeof layer1Data !== 'object') {
      return {
        score: 0,
        status: 'Unknown',
        reason: 'No URL analysis data available'
      };
    }

    return {
      score: layer1Data.score || 0,
      status: layer1Data.status || 'Unknown',
      reason: layer1Data.reason || 'No analysis details available'
    };
  }

  /**
   * Extract Layer 2 (Domain Analysis) data
   */
  extractLayer2Data(layer2Data) {
    if (!layer2Data || typeof layer2Data !== 'object') {
      return {
        score: 0,
        summary: 'No domain analysis data available',
        threatIntel: {},
        registration: {}
      };
    }

    return {
      score: layer2Data.score || 0,
      summary: layer2Data.summary || 'No domain analysis summary available',
      threatIntel: layer2Data.threat_intel_analysis || layer2Data.threat_intel || {},
      registration: layer2Data.registration_analysis || layer2Data.registration || {}
    };
  }

  /**
   * Extract Layer 3 (Feature Analysis) data
   */
  extractLayer3Data(layer3Data) {
    if (!layer3Data || typeof layer3Data !== 'object') {
      return {
        score: 0,
        features: {}
      };
    }

    return {
      score: layer3Data.score || 0,
      features: layer3Data.feature_analysis || layer3Data.features || {}
    };
  }

  /**
   * Get default/fallback security data
   */
  getDefaultSecurityData(errorMessage = 'No data available') {
    return {
      final: {
        score: 50,
        status: 'Unknown',
        reasoning: errorMessage
      },
      layer1: {
        score: 50,
        status: 'Unknown',
        reason: errorMessage
      },
      layer2: {
        score: 50,
        summary: 'No domain analysis data available',
        threatIntel: {},
        registration: {}
      },
      layer3: {
        score: 50,
        features: {}
      }
    };
  }

  /**
   * Generate HTML for object details (threat intel, registration, features)
   */
  generateDetailsHtml(dataObject, excludeKeys = ['explanation']) {
    if (!dataObject || typeof dataObject !== 'object' || Object.keys(dataObject).length === 0) {
      return '<div style="font-size: 15px; color: #95a5a6; background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">No data available</div>';
    }

    let html = '';
    
    // Generate details for each key-value pair
    for (const [key, value] of Object.entries(dataObject)) {
      if (!excludeKeys.includes(key)) {
        html += `
          <div style="margin-bottom: 12px; padding: 15px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #3498db;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #2c3e50; text-transform: uppercase; letter-spacing: 0.5px;">${this.formatKey(key)}</div>
            <div style="font-size: 14px; color: #34495e; line-height: 1.5;">${value}</div>
          </div>
        `;
      }
    }

    // Add explanation if it exists
    if (dataObject.explanation) {
      html += `
        <div style="margin-top: 20px; font-size: 15px; color: #27ae60; line-height: 1.6; background: #e8f5e8; padding: 18px; border-radius: 10px; border-left: 4px solid #27ae60;">
          <strong>💡 Explanation:</strong> ${dataObject.explanation}
        </div>
      `;
    }

    return html;
  }

  /**
   * Format object keys for display (snake_case to Title Case)
   */
  formatKey(key) {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get security level info based on score
   */
  getSecurityLevel(score) {
    if (score < 60) {
      return {
        level: 'unsafe',
        color: '#f44336',
        icon: '🔴'
      };
    } else if (score < 80) {
      return {
        level: 'moderate',
        color: '#ff9800',
        icon: '🟡'
      };
    } else {
      return {
        level: 'safe',
        color: '#4CAF50',
        icon: '🟢'
      };
    }
  }

  /**
   * Get color based on score
   */
  getScoreColor(score) {
    if (score >= 80) return '#4CAF50';
    if (score >= 50) return '#ff9800';
    return '#f44336';
  }

  /**
   * Toggle between real data and dummy data for testing
   */
  toggleDummyData() {
    this.useDummyData = !this.useDummyData;
    
    if (this.useDummyData) {
      // Parse and display dummy data
      const dummyData = this.parseDummyData();
      this.showSecurityResults(dummyData);
      console.log('🧪 Switched to dummy data mode');
    } else {
      // Switch back to real data
      if (this.currentData) {
        this.showSecurityResults(this.currentData);
        console.log('🔍 Switched back to real data mode');
      }
    }
  }

  /**
   * Parse the dummy data string and return structured data
   */
  parseDummyData() {
    const dummyDataString = `{
      "layer1": {
        "status": "Phishing",
        "reason": "The URL is too short and lacks a clear domain or organization name",
        "score": 0
      },
      "layer2": {
        "threat_intel_analysis": {
          "malicious": 0,
          "suspicious": 0,
          "harmless": 0,
          "undetected": 0,
          "redirects": "null",
          "explanation": "No threats detected in threat intelligence analysis"
        },
        "registration_analysis": {
          "domain_age_days": 322,
          "registrar_reputation": "High",
          "contact_email_type": "Unknown",
          "name_authenticity": "Unknown",
          "name_servers_reputation": "High",
          "explanation": "Domain is relatively new, but registrar and name servers have good reputation"
        },
        "summary": "No threats detected, but domain is relatively new",
        "score": 20
      },
      "layer3": {
        "feature_analysis": {
          "url_length": "Short URL, may indicate phishing",
          "num_dots": "One dot, may indicate legitimate domain",
          "has_at": "No at symbol, may indicate legitimate URL",
          "num_hyphens": "No hyphens, may indicate legitimate URL",
          "num_digits": "No digits, may indicate legitimate URL",
          "is_https": "Yes, may indicate legitimate URL",
          "has_suspicious_words": "No suspicious words, may indicate legitimate URL",
          "has_suspicious_domain": "No suspicious domain, may indicate legitimate URL",
          "domain_length": "Short domain, may indicate phishing"
        },
        "score": 20
      },
      "final_result": {
        "final_score": 40,
        "status": "Phishing",
        "reasoning": "The URL is classified as phishing due to its short length, lack of clear domain or organization name, and relatively new domain age. Although no threats were detected in threat intelligence analysis, the domain's short length and new age raise suspicions."
      }
    }`;

    try {
      const parsedData = JSON.parse(dummyDataString);
      console.log('🧪 Parsed dummy data successfully:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('❌ Error parsing dummy data:', error);
      return this.getDefaultSecurityData('Error parsing dummy data');
    }
  }

  // Updated generateOverlayContent method using the new functions
  generateOverlayContent(rawData) {
    console.log('🔍 Generating ultra-simplified overlay content with raw data:', rawData);
    
    // Extract and normalize the data
    const data = this.extractSecurityData(rawData);
    
    // Get security level info
    const securityLevel = this.getSecurityLevel(data.final.score);
    
    // Format reasoning text as bullet points
    const formatReasoning = (text) => {
      if (!text) return '';
      
      // Split by sentences and create bullet points
      const sentences = text.split(/(?<=[.!?])\s+/);
      return sentences
        .filter(sentence => sentence.trim().length > 0)
        .map(sentence => `• ${sentence.trim()}`)
        .join('<br>');
    };
    
    return `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 10px;">
        <div style="background: white; border-radius: 16px; padding: 25px; text-align: center; max-width: 700px; box-shadow: 0 10px 30px ${securityLevel.color}30; border: 2px solid ${securityLevel.color};">
          
          <!-- Final Score (Large) -->
          <div style="font-size: 72px; font-weight: bold; color: ${securityLevel.color}; margin-bottom: 5px;">
            ${securityLevel.icon} ${data.final.score}%
          </div>
          <div style="font-size: 24px; font-weight: 700; color: ${securityLevel.color}; margin-bottom: 20px; text-transform: uppercase;">${data.final.status}</div>
          
          <!-- Three Layer Scores (Small, Horizontal) -->
          <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
            <div style="flex: 1; background: ${this.getScoreColor(data.layer1.score)}15; border-radius: 8px; padding: 10px; border: 1px solid ${this.getScoreColor(data.layer1.score)};">
              <div style="font-size: 12px; font-weight: 700; color: ${this.getScoreColor(data.layer1.score)};">LLM Analysis</div>
              <div style="font-size: 20px; font-weight: bold; color: ${this.getScoreColor(data.layer1.score)};">${data.layer1.score}%</div>
            </div>
            <div style="flex: 1; background: ${this.getScoreColor(data.layer2.score)}15; border-radius: 8px; padding: 10px; border: 1px solid ${this.getScoreColor(data.layer2.score)};">
              <div style="font-size: 12px; font-weight: 700; color: ${this.getScoreColor(data.layer2.score)};">Threat Intel</div>
              <div style="font-size: 20px; font-weight: bold; color: ${this.getScoreColor(data.layer2.score)};">${data.layer2.score}%</div>
            </div>  
            <div style="flex: 1; background: ${this.getScoreColor(data.layer3.score)}15; border-radius: 8px; padding: 10px; border: 1px solid ${this.getScoreColor(data.layer3.score)};">
              <div style="font-size: 12px; font-weight: 700; color: ${this.getScoreColor(data.layer3.score)};">ML Features</div>
              <div style="font-size: 20px; font-weight: bold; color: ${this.getScoreColor(data.layer3.score)};">${data.layer3.score}%</div>
            </div>
          </div>
          
          <!-- Reasoning as Bullet Points -->
          <div style="
            font-size: 14px; 
            margin-bottom: 20px; 
            color: #333; 
            text-align: left; 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            max-height: 120px; 
            overflow-y: auto;
            line-height: 1.6;
          ">
            <div style="font-weight: 600; margin-bottom: 8px; color: ${securityLevel.color};">Key Findings:</div>
            ${formatReasoning(data.final.reasoning)}
          </div>
          
          <!-- Action Buttons -->
          <div style="display: flex; justify-content: center; gap: 15px;">
            ${data.final.score < 50 ? `
            <button id="back-button" style="
              background: #e74c3c;
              border: none;
              color: white;
              padding: 8px 20px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
            ">
              ⬅️ Back
            </button>
            ` : ''}
            
            <button id="proceed-button" style="
              background: ${data.final.score >= 80 ? '#4CAF50' : (data.final.score >= 50 ? '#ff9800' : '#7f8c8d')};
              border: none;
              color: white;
              padding: 8px 20px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
            ">
              ${data.final.score >= 80 ? '✅ Proceed' : (data.final.score >= 50 ? '⚠️ Proceed' : '⚠️ Risk')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate specialized overlay for blacklisted sites with red background
   * Displays the blacklist detection information prominently
   */
  generateBlacklistOverlay(data) {
    console.log('⚠️ Generating blacklist overlay with data:', data);
    
    // Extract blacklist specific data
    const blacklistData = data.final_result || data;
    const domainName = window.location.hostname;
    const reasonText = blacklistData.reasoning || 'This website is blacklisted for security concerns';
    
    // Format reasoning as bullet points if it contains multiple sentences
    const formatReasoning = (text) => {
      if (!text) return '';
      
      // Split by sentences and create bullet points
      const sentences = text.split(/(?<=[.!?])\s+/);
      return sentences
        .filter(sentence => sentence.trim().length > 0)
        .map(sentence => `• ${sentence.trim()}`)
        .join('<br>');
    };
    
    return `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; padding: 0; background-color: rgba(244, 67, 54, 0.97);">
        <div style="background: white; border-radius: 16px; padding: 25px; text-align: center; max-width: 700px; box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5); border: 3px solid #f44336;">
          
          <!-- Warning Icon and Header -->
          <div style="font-size: 80px; margin-bottom: 10px;">⚠️</div>
          <div style="font-size: 28px; font-weight: 700; color: #f44336; margin-bottom: 5px; text-transform: uppercase;">
            SECURITY ALERT
          </div>
          <div style="font-size: 20px; font-weight: 600; color: #f44336; margin-bottom: 20px;">
            Blacklisted Website Detected
          </div>
          
          <!-- Domain Info -->
          <div style="
            background: #fef0f0; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 20px;
            border: 1px solid #f44336;
            text-align: center;
          ">
            <div style="font-size: 16px; font-weight: 600; color: #f44336; margin-bottom: 5px;">Dangerous Domain</div>
            <div style="font-size: 22px; color: #333; word-break: break-all;">${domainName}</div>
          </div>
          
          <!-- Blacklist Details -->
          <div style="
            background: #f8f9fa; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 20px;
            border-left: 4px solid #f44336;
            text-align: left;
          ">
            <div style="font-size: 16px; font-weight: 600; color: #f44336; margin-bottom: 10px;">Threat Details</div>
            
            <div style="font-size: 14px; color: #333; margin-bottom: 10px;">
              <span style="font-weight: 600;">Status:</span> ${blacklistData.status || 'Dangerous'}
            </div>
            
            <div style="font-size: 14px; color: #333; margin-bottom: 10px;">
              <span style="font-weight: 600;">Confidence:</span> ${blacklistData.confidence || 'High'}
            </div>
            
            <div style="font-size: 14px; color: #333; line-height: 1.5;">
              <span style="font-weight: 600;">Reason:</span><br>
              <div style="margin-top: 5px;">${formatReasoning(reasonText)}</div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="display: flex; justify-content: center; gap: 15px;">
            <button id="back-button" style="
              background: #f44336;
              border: none;
              color: white;
              padding: 12px 25px;
              font-size: 16px;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
            ">
              ⬅️ Back to Safety
            </button>
            
            <button id="proceed-button" style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 12px 25px;
              font-size: 16px;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
            ">
              ⚠️ Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Hide overlay
  hideOverlay() {
    if ((this.overlay || this.overlayBackdrop) && this.isVisible) {
      if (this.overlay) this.overlay.style.opacity = '0';
      if (this.overlayBackdrop) this.overlayBackdrop.style.opacity = '0';
      this.isVisible = false;
      
      // Remove overlay after animation
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.remove();
          this.overlay = null;
        }
        if (this.overlayBackdrop) {
          this.overlayBackdrop.remove();
          this.overlayBackdrop = null;
        }
      }, 300);
    }
  }

  // Toggle overlay visibility
  toggleOverlay() {
    if (this.isVisible) {
      // Don't allow hiding when overlay is visible - user must click proceed button
      console.log('⚠️ Overlay cannot be closed. Please click "Proceed with Your Own Risk" button.');
      return;
    } else if (this.currentData) {
      this.showSecurityResults(this.currentData);
    }
  }
  
  // Show layer details modal
  showLayerDetails(layerNum) {
    const modal = document.getElementById('layer-details-modal');
    if (!modal) return;
    
    // Hide all layer details
    const layerDetails = document.querySelectorAll('.layer-details');
    layerDetails.forEach(detail => {
      detail.style.display = 'none';
    });
    
    // Show the selected layer details
    const selectedLayer = document.getElementById(`layer-${layerNum}-details`);
    if (selectedLayer) {
      selectedLayer.style.display = 'block';
    }
    
    // Set the modal title
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
      modalTitle.textContent = `Layer ${layerNum} Details`;
    }
    
    // Show the modal
    modal.style.display = 'flex';
  }
  
  // Hide layer details modal
  hideLayerDetails() {
    const modal = document.getElementById('layer-details-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

// Initialize the security overlay
const securityOverlay = new SecurityOverlay();

// Add click event listeners for buttons
document.addEventListener('click', (e) => {
  // Proceed button
  if (e.target.id === 'proceed-button') {
    securityOverlay.hideOverlay();
  }
  
  // View Details buttons
  if (e.target.classList.contains('view-details-btn')) {
    const layerNum = e.target.getAttribute('data-layer');
    securityOverlay.showLayerDetails(layerNum);
  }
  
  // Close modal button
  if (e.target.id === 'close-modal-btn') {
    securityOverlay.hideLayerDetails();
  }
});

// Prevent escape key and other shortcuts from closing the overlay
document.addEventListener('keydown', (e) => {
  // Prevent escape key
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Prevent Ctrl+W (close tab)
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Prevent Ctrl+Shift+S toggle when overlay is visible
  if (e.ctrlKey && e.shiftKey && e.key === 'S' && securityOverlay.isVisible) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Allow Ctrl+Shift+S only when overlay is not visible
  if (e.ctrlKey && e.shiftKey && e.key === 'S' && !securityOverlay.isVisible) {
    e.preventDefault();
    securityOverlay.toggleOverlay();
  }
});
