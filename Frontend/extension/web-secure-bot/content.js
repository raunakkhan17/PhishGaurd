// RAG-enhanced content extraction with comprehensive logging and security overlays
function createTextChunks(text, chunkSize = 300) {
  try {
    console.log('🔧 Content: Creating text chunks, text length:', text?.length || 0);
    console.log('🔧 Content: Chunk size:', chunkSize);
    console.log('🔧 Content: Text preview:', text?.substring(0, 100) + '...');
    
    if (!text || typeof text !== 'string') {
      console.warn('⚠️ Content: Invalid text for chunking:', text);
      return [];
    }
    
    if (text.length === 0) {
      console.warn('⚠️ Content: Empty text, no chunks created');
      return [];
    }
    
    const words = text.split(/\s+/);
    console.log('🔧 Content: Total words found:', words.length);
    console.log('🔧 Content: First few words:', words.slice(0, 10));
    
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push({
          id: `chunk_${i}`,
          text: chunk.trim(),
          startWord: i,
          endWord: Math.min(i + chunkSize, words.length)
        });
      }
    }
    
    console.log('✅ Content: Successfully created chunks:', chunks.length);
    if (chunks.length > 0) {
      console.log('📊 Content: First chunk preview:', chunks[0].text.substring(0, 100) + '...');
    }
    console.log('📊 Content: Chunk details:', chunks.map(c => ({
      id: c.id,
      textLength: c.text.length,
      startWord: c.startWord,
      endWord: c.endWord
    })));
    
    return chunks;
  } catch (error) {
    console.error('❌ Content: Error creating text chunks:', error);
    console.error('❌ Content: Error stack:', error.stack);
    return [];
  }
}

function extractPageData() {
  try {
    console.log('🌐 Content: Starting page data extraction...');
    
    // Get main content areas
    const mainContent = document.querySelector('main') || document.querySelector('#main') || document.querySelector('.main') || document.body;
    console.log('🔍 Content: Main content element found:', mainContent.tagName);
    
    // Extract text more intelligently
    let text = '';
    if (mainContent) {
      console.log('🔍 Content: Extracting text from main content...');
      
      // Get text from headings and paragraphs first
      const headings = Array.from(mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent.trim()).join(' ');
      const paragraphs = Array.from(mainContent.querySelectorAll('p')).map(p => p.textContent.trim()).join(' ');
      const lists = Array.from(mainContent.querySelectorAll('ul, ol')).map(l => Array.from(l.querySelectorAll('li')).map(li => li.textContent.trim()).join(' ')).join(' ');
      const buttons = Array.from(mainContent.querySelectorAll('button, .btn, .button')).map(b => b.textContent.trim()).join(' ');
      
      console.log('📊 Content: Text extraction results:', {
        headings: headings.length,
        paragraphs: paragraphs.length,
        lists: lists.length,
        buttons: buttons.length
      });
      
      text = (headings + ' ' + paragraphs + ' ' + lists + ' ' + buttons).slice(0, 5000); // More comprehensive text
    } else {
      console.log('🔍 Content: Using body text as fallback...');
      text = document.body.innerText.slice(0, 5000);
    }
    
    console.log('📄 Content: Final text length:', text.length);
    
    // Create text chunks for RAG
    console.log('🔧 Content: Creating text chunks...');
    console.log('🔧 Content: About to call createTextChunks with text:', text.substring(0, 200) + '...');
    const textChunks = createTextChunks(text, 300);
    console.log('✅ Content: Text chunks created:', textChunks.length);
    console.log('🔧 Content: TextChunks array:', textChunks);
    
    // Extract form information more usefully
    console.log('🔍 Content: Extracting form information...');
    const forms = Array.from(document.querySelectorAll("form")).map(f => {
      try {
        const inputs = Array.from(f.querySelectorAll('input, select, textarea')).map(input => ({
          type: input.type || 'text',
          name: input.name || 'No name',
          placeholder: input.placeholder || '',
          required: input.required || false,
          value: input.value || ''
        }));
        
        return {
          action: f.action || 'No action specified',
          method: f.method || 'GET',
          inputs: inputs
        };
      } catch (error) {
        console.warn('⚠️ Content: Error processing form:', error);
        return null;
      }
    }).filter(f => f !== null);
    
    console.log('📊 Content: Forms found:', forms.length);

    // Extract links with more context
    console.log('🔍 Content: Extracting link information...');
    const links = Array.from(document.querySelectorAll("a")).map(a => {
      try {
        return {
          href: a.href,
          text: a.textContent.trim().slice(0, 50),
          title: a.title || '',
          rel: a.rel || '',
          target: a.target || ''
        };
      } catch (error) {
        console.warn('⚠️ Content: Error processing link:', error);
        return null;
      }
    }).filter(l => l !== null);
    
    console.log('📊 Content: Links found:', links.length);

    // Enhanced security metadata
    console.log('🔒 Content: Extracting security information...');
    const securityInfo = {
      isHttps: window.location.protocol === 'https:',
      hasSecureContext: window.isSecureContext,
      domain: window.location.hostname,
      path: window.location.pathname,
      hasCookies: document.cookie.length > 0,
      hasLocalStorage: typeof(Storage) !== "undefined",
      hasSessionStorage: typeof(Storage) !== "undefined"
    };
    
    console.log('🔒 Content: Security info:', securityInfo);

    const pageData = {
      title: document.title,
      url: window.location.href,
      text: text,
      textChunks: textChunks, // RAG chunks
      links: links,
      forms: forms,
      metaDescription: document.querySelector('meta[name="description"]')?.content || 'No description',
      hasLoginForm: forms.some(f => f.inputs.some(i => i.type === 'password')),
      hasPaymentForm: forms.some(f => f.inputs.some(i => ['card', 'payment', 'cc', 'credit'].some(term => i.name.toLowerCase().includes(term)))),
      securityInfo: securityInfo,
      timestamp: Date.now()
    };
    
    console.log('✅ Content: Page data extraction completed successfully');
    console.log('📊 Content: Final page data summary:', {
      title: pageData.title,
      url: pageData.url,
      textLength: pageData.text.length,
      chunksCount: pageData.textChunks.length,
      formsCount: pageData.forms.length,
      linksCount: pageData.links.length,
      hasLoginForm: pageData.hasLoginForm,
      hasPaymentForm: pageData.hasPaymentForm,
      isHttps: pageData.securityInfo.isHttps
    });
    
    return pageData;
    
  } catch (error) {
    console.error('❌ Content: Error in page data extraction:', error);
    console.error('❌ Content: Error stack:', error.stack);
    
    // Return minimal data on error
    return {
      title: document.title || 'Error extracting title',
      url: window.location.href,
      text: 'Error extracting page content',
      textChunks: [],
      links: [],
      forms: [],
      metaDescription: 'Error extracting description',
      hasLoginForm: false,
      hasPaymentForm: false,
      securityInfo: {
        isHttps: window.location.protocol === 'https:',
        hasSecureContext: false,
        domain: window.location.hostname,
        path: window.location.pathname,
        hasCookies: false,
        hasLocalStorage: false,
        hasSessionStorage: false
      },
      timestamp: Date.now()
    };
  }
}

// Create comprehensive security overlay with all JSON details
function createSecurityOverlay(securityData) {
  console.log('🛡️ Content Script: Creating security overlay with data:', securityData);
  
  // Remove any existing overlays
  removeSecurityOverlays();
  
  // Create main overlay container
  // Use namespace prefix 'rag-' to avoid conflicts with other extensions
  const overlay = document.createElement('div');
  overlay.className = 'rag-security-overlay';
  overlay.id = 'rag-security-overlay';
  
  // Determine overlay type based on score
  const finalScore = securityData.final_result?.final_score || 0;
  let overlayType = 'safe';
  let overlayClass = '';
  
  if (finalScore < 40) {
    overlayType = 'dangerous';
    overlayClass = 'dangerous-overlay';
  } else if (finalScore < 80) {
    overlayType = 'moderate';
    overlayClass = 'moderate-overlay';
  }
  
  overlay.classList.add(overlayClass);
  
  // Create overlay content with comprehensive details
  overlay.innerHTML = createOverlayContent(securityData, overlayType);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Add event listeners
  setupOverlayEventListeners(overlay);
  
  console.log('✅ Content Script: Security overlay created and displayed');
}

// Create comprehensive overlay content
function createOverlayContent(data, type) {
  const finalScore = data.final_result?.final_score || 0;
  const finalStatus = data.final_result?.status || 'Unknown';
  const finalReason = data.final_result?.reasoning || 'No data available';
  
  let headerIcon = '🟢';
  let headerClass = 'safe-header';
  let actionButtons = '';
  
  if (type === 'dangerous') {
    headerIcon = '🚨';
    headerClass = 'dangerous-header';
    actionButtons = `
      <button class="overlay-btn danger-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
        🚫 STOP - Do Not Continue
      </button>
      <button class="overlay-btn continue-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
        ⚠️ Continue at Your Own Risk
      </button>
    `;
  } else if (type === 'moderate') {
    headerIcon = '⚠️';
    headerClass = 'moderate-header';
    actionButtons = `
      <button class="overlay-btn warning-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
        ⚠️ Proceed with Caution
      </button>
      <button class="overlay-btn back-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
        🔙 Go Back
      </button>
    `;
  } else {
    actionButtons = `
      <button class="overlay-btn safe-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
        ✅ Continue Safely
      </button>
    `;
  }
  
  return `
    <div class="overlay-content ${headerClass}">
      <div class="overlay-header">
        <div class="overlay-icon">${headerIcon}</div>
        <h2>${getOverlayTitle(type, finalStatus)}</h2>
        <div class="overlay-score">
          <span class="score-number">${finalScore}</span>/100
        </div>
      </div>
      
      <div class="overlay-summary">
        <h3>🔍 Security Summary</h3>
        <p><strong>Status:</strong> ${finalStatus}</p>
        <p><strong>Reasoning:</strong> ${finalReason}</p>
      </div>
      
      <div class="overlay-details">
        <h3>📊 Detailed Analysis</h3>
        
        <!-- Layer 1: LLM Classification -->
        <div class="layer-detail">
          <h4>🛡️ Layer 1: LLM Classification</h4>
          <div class="layer-info">
            <div class="layer-score">Score: ${data.layer1?.score || 0}/10</div>
            <div class="layer-status">Status: ${data.layer1?.status || 'Unknown'}</div>
            <div class="layer-reason">${data.layer1?.reason || 'No data'}</div>
          </div>
        </div>
        
        <!-- Layer 2: Threat Intelligence & Domain Analysis -->
        <div class="layer-detail">
          <h4>🔒 Layer 2: Threat Intelligence & Domain Analysis</h4>
          <div class="layer-info">
            <div class="layer-score">Score: ${data.layer2?.score || 0}/50</div>
            <div class="layer-summary">${data.layer2?.summary || 'No data'}</div>
            
            ${createThreatIntelSection(data.layer2)}
            ${createDomainAnalysisSection(data.layer2)}
          </div>
        </div>
        
        <!-- Layer 3: Feature Analysis -->
        <div class="layer-detail">
          <h4>🔍 Layer 3: Feature Analysis</h4>
          <div class="layer-info">
            <div class="layer-score">Score: ${data.layer3?.score || 0}/40</div>
            ${createFeatureAnalysisSection(data.layer3)}
          </div>
        </div>
      </div>
      
      <div class="overlay-actions">
        ${actionButtons}
      </div>
    </div>
  `;
}

// Create threat intelligence section
function createThreatIntelSection(layer2) {
  if (!layer2?.threat_intel_analysis) return '';
  
  const ti = layer2.threat_intel_analysis;
  return `
    <div class="sub-section">
      <h5>🕵️ Threat Intelligence Analysis</h5>
      <div class="threat-stats">
        <div class="stat-item">
          <span class="stat-label">Malicious:</span>
          <span class="stat-value">${ti.malicious || 0} (${ti.malicious_ratio || 0}%)</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Suspicious:</span>
          <span class="stat-value">${ti.suspicious || 0} (${ti.suspicious_ratio || 0}%)</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Harmless:</span>
          <span class="stat-value">${ti.harmless || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Undetected:</span>
          <span class="stat-value">${ti.undetected || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Timeout:</span>
          <span class="stat-value">${ti.timeout || 0}</span>
        </div>
      </div>
    </div>
  `;
}

// Create domain analysis section
function createDomainAnalysisSection(layer2) {
  if (!layer2?.domain_analysis) return '';
  
  const domain = layer2.domain_analysis;
  return `
    <div class="sub-section">
      <h5>🌐 Domain Analysis</h5>
      <div class="domain-stats">
        <div class="stat-item">
          <span class="stat-label">Safety Score:</span>
          <span class="stat-value">${domain.safety_score || 'N/A'}/10</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Domain Age:</span>
          <span class="stat-value">${domain.domain_age_days !== null ? domain.domain_age_days + ' days' : 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Registrar Trust:</span>
          <span class="stat-value">${domain.registrar_trustworthiness || 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Registrant Email:</span>
          <span class="stat-value">${domain.registrant_email_type || 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Registrant Name:</span>
          <span class="stat-value">${domain.registrant_name_authenticity || 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Country:</span>
          <span class="stat-value">${domain.country_of_registrant || 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">TLD Country Mismatch:</span>
          <span class="stat-value">${domain.tld_country_mismatch !== null ? (domain.tld_country_mismatch ? 'Yes' : 'No') : 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Domain Status:</span>
          <span class="stat-value">${domain.domain_status ? domain.domain_status.join(', ') : 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Name Servers:</span>
          <span class="stat-value">${domain.name_servers ? domain.name_servers.join(', ') : 'Unknown'}</span>
        </div>
      </div>
    </div>
  `;
}

// Create feature analysis section
function createFeatureAnalysisSection(layer3) {
  if (!layer3?.feature_analysis) return '';
  
  const features = layer3.feature_analysis;
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
  
  let featureHtml = '<div class="sub-section"><h5>🔧 URL Features Analysis</h5>';
  
  featureItems.forEach(item => {
    if (features[item.key] !== undefined) {
      featureHtml += `
        <div class="stat-item">
          <span class="stat-label">${item.label}:</span>
          <span class="stat-value">${features[item.key]}</span>
        </div>
      `;
    }
  });
  
  featureHtml += '</div>';
  return featureHtml;
}

// Get overlay title based on type and status
function getOverlayTitle(type, status) {
  if (type === 'dangerous') {
    return `⚠️ DANGEROUS WEBSITE DETECTED!`;
  } else if (type === 'moderate') {
    return `⚠️ MODERATE SECURITY RISK`;
  } else {
    return `✅ WEBSITE SECURITY SCANNED`;
  }
}

// Setup overlay event listeners
function setupOverlayEventListeners(overlay) {
  // Close overlay when clicking outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Add escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.parentElement) {
      overlay.remove();
    }
  });
}

function removeSecurityOverlays() {
  // Remove both old and new namespace versions for compatibility
  const existingOverlays = document.querySelectorAll('.web-security-overlay, .rag-security-overlay');
  existingOverlays.forEach(overlay => overlay.remove());
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🛡️ Content Script: Received message:', message);
  
  if (message.type === 'SECURITY_UPDATE') {
    console.log('🛡️ Content Script: Processing security update:', message.data);
    
    // Inject styles first
    injectSecurityStyles();
    
    // Create and show the security overlay
    createSecurityOverlay(message.data);
    
    // Send response
    sendResponse({ success: true, message: 'Security overlay created' });
  } else if (message.type === 'GET_PAGE_DATA') {
    console.log('📨 Content Script: Processing GET_PAGE_DATA request...');
    const pageData = extractPageData();
    console.log('📨 Content Script: Sending page data response');
    sendResponse(pageData);
  }
  
  return true; // Keep the message channel open for async response
});

// Inject comprehensive security overlay styles
function injectSecurityStyles() {
  // Use namespace prefix to avoid conflicts with other extensions
  const existingStyles = document.getElementById('rag-web-security-styles');
  if (existingStyles) {
    existingStyles.remove();
  }

  const styleSheet = document.createElement('style');
  styleSheet.id = 'rag-web-security-styles';
  styleSheet.textContent = `
    .rag-security-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .overlay-content {
      background: white;
      border-radius: 20px;
      padding: 0;
      max-width: 90%;
      max-height: 90%;
      width: 800px;
      overflow-y: auto;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
      animation: overlaySlideIn 0.4s ease-out;
      position: relative;
    }
    
    @keyframes overlaySlideIn {
      from { transform: translateY(-60px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    
    .overlay-header {
      padding: 30px 40px 20px 40px;
      text-align: center;
      border-bottom: 1px solid #e9ecef;
    }
    
    .overlay-header.dangerous-header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
      border-radius: 20px 20px 0 0;
    }
    
    .overlay-header.moderate-header {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #333;
      border-radius: 20px 20px 0 0;
    }
    
    .overlay-header.safe-header {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      border-radius: 20px 20px 0 0;
    }
    
    .overlay-icon {
      font-size: 4rem;
      margin-bottom: 15px;
    }
    
    .overlay-header h2 {
      margin-bottom: 15px;
      font-size: 1.8rem;
      font-weight: 700;
    }
    
    .overlay-score {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .overlay-score .score-number {
      font-size: 2.2rem;
      font-weight: 700;
      display: block;
      margin-bottom: 5px;
    }
    
    .overlay-summary {
      padding: 25px 40px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .overlay-summary h3 {
      margin-bottom: 15px;
      color: #333;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .overlay-summary p {
      margin-bottom: 8px;
      color: #555;
      line-height: 1.5;
    }
    
    .overlay-summary strong {
      color: #333;
      font-weight: 600;
    }
    
    .overlay-details {
      padding: 25px 40px;
    }
    
    .overlay-details h3 {
      margin-bottom: 25px;
      color: #333;
      font-size: 1.4rem;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .layer-detail {
      margin-bottom: 30px;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }
    
    .layer-detail h4 {
      margin-bottom: 15px;
      color: #333;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .layer-info {
      color: #555;
    }
    
    .layer-score {
      font-size: 1.1rem;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 8px;
    }
    
    .layer-status {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .layer-reason {
      line-height: 1.5;
      margin-bottom: 15px;
    }
    
    .sub-section {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      border-left: 3px solid #17a2b8;
    }
    
    .sub-section h5 {
      margin: 0 0 15px 0;
      color: #495057;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .stat-item:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }
    
    .stat-value {
      color: #667eea;
      font-weight: 500;
      font-size: 0.9rem;
      text-align: right;
      max-width: 200px;
      word-break: break-word;
    }
    
    .overlay-actions {
      padding: 25px 40px;
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
      border-radius: 0 0 20px 20px;
    }
    
    .overlay-btn {
      padding: 12px 25px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      min-width: 180px;
    }
    
    .danger-btn {
      background: #dc3545;
      color: white;
    }
    
    .danger-btn:hover {
      background: #c82333;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
    }
    
    .continue-btn {
      background: #ffc107;
      color: #333;
    }
    
    .continue-btn:hover {
      background: #e0a800;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 193, 7, 0.3);
    }
    
    .warning-btn {
      background: #ffc107;
      color: #333;
    }
    
    .warning-btn:hover {
      background: #e0a800;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 193, 7, 0.3);
    }
    
    .back-btn {
      background: #6c757d;
      color: white;
    }
    
    .back-btn:hover {
      background: #5a6268;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(108, 117, 125, 0.3);
    }
    
    .safe-btn {
      background: #28a745;
      color: white;
    }
    
    .safe-btn:hover {
      background: #218838;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .overlay-content {
        max-width: 95%;
        margin: 20px;
        max-height: 95%;
      }
      
      .overlay-header {
        padding: 20px 25px 15px 25px;
      }
      
      .overlay-header h2 {
        font-size: 1.5rem;
      }
      
      .overlay-summary,
      .overlay-details {
        padding: 20px 25px;
      }
      
      .overlay-actions {
        padding: 20px 25px;
        flex-direction: column;
        align-items: center;
      }
      
      .overlay-btn {
        width: 100%;
        max-width: 250px;
      }
      
      .stat-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
      
      .stat-value {
        text-align: left;
        max-width: 100%;
      }
    }
    
    /* Scrollbar Styling */
    .overlay-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .overlay-content::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    .overlay-content::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    .overlay-content::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;
  
  document.head.appendChild(styleSheet);
  console.log('✅ Content Script: Security overlay styles injected');
}

console.log('🚀 Content: Web Security Bot content script loaded successfully');
console.log('🔧 Content: Ready to extract page data and show security overlays');

// Inject security styles immediately
injectSecurityStyles();

// Test chunking function
console.log('🧪 Content: Testing chunking function...');
const testText = "This is a test text to verify that the chunking function works properly. It should create multiple chunks from this text.";
const testChunks = createTextChunks(testText, 10);
console.log('🧪 Content: Test chunks created:', testChunks.length);
console.log('🧪 Content: Test chunks:', testChunks);
