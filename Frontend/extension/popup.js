// Popup JavaScript for Website Security Scanner
class PopupController {
  constructor() {
    this.init();
  }

  init() {
    this.loadStatus();
    this.bindEvents();
  }

  /**
   * Extract only the base origin (protocol + domain) from a URL.
   * Removes paths, query params, fragments, session IDs, and dynamic route IDs.
   *
   * INPUT:  https://chatgpt.com/c/abc123?x=1#section
   * OUTPUT: https://chatgpt.com/
   *
   * @param {string} url - Full URL
   * @returns {string} Base origin with trailing slash
   */
  extractBaseOrigin(url) {
    try {
      // Use URL API to safely parse and extract origin
      const parsed = new URL(url);
      // Return origin (protocol + hostname + port) with trailing slash
      return parsed.origin + '/';
    } catch (error) {
      console.warn('⚠️ Failed to parse URL:', url, error);
      // Fallback: return original URL if parsing fails
      return url;
    }
  }

  // Load current status from background script
  async loadStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      this.updateUI(response);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }

  // Bind event listeners
  bindEvents() {
    // Scanner toggle
    document.getElementById('scanner-toggle').addEventListener('click', async () => {
      const currentState = document.getElementById('scanner-toggle').classList.contains('active');
      const newState = !currentState;

      try {
        await chrome.runtime.sendMessage({
          type: 'TOGGLE_ENABLED',
          enabled: newState
        });

        this.updateToggleState('scanner-toggle', newState);
        this.showNotification(newState ? 'Scanner enabled' : 'Scanner disabled');
      } catch (error) {
        console.error('Error toggling scanner:', error);
      }
    });

    // Test Data toggle
    document.getElementById('test-data-toggle').addEventListener('click', async () => {
      const currentState = document.getElementById('test-data-toggle').classList.contains('active');
      const newState = !currentState;

      try {
        await chrome.runtime.sendMessage({
          type: 'TOGGLE_TEST_DATA',
          useTestData: newState
        });

        this.updateToggleState('test-data-toggle', newState);
        this.showNotification(newState ? 'Test data mode enabled' : 'Test data mode disabled');
      } catch (error) {
        console.error('Error toggling test data mode:', error);
      }
    });

    // Clear scanned history
    document.getElementById('clear-scanned').addEventListener('click', async () => {
      try {
        await chrome.runtime.sendMessage({ type: 'CLEAR_SCANNED' });
        document.getElementById('scanned-count').textContent = '0';
        this.showNotification('History cleared');
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    });

    // Test API connection
    document.getElementById('test-api').addEventListener('click', async () => {
      this.showScanningIndicator();

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url && tab.url.startsWith('http')) {
          // Extract only base origin - strip paths, query params, fragments
          const baseOrigin = this.extractBaseOrigin(tab.url);
          console.log('🔒 Popup: Original URL:', tab.url);
          console.log('🔒 Popup: Sending base origin:', baseOrigin);

          // Send test message to background script with cleaned URL
          await chrome.runtime.sendMessage({
            type: 'TEST_API',
            url: baseOrigin
          });

          setTimeout(() => {
            this.hideScanningIndicator();
            this.showNotification('API test completed');
          }, 2000);
        } else {
          this.hideScanningIndicator();
          this.showNotification('Cannot test on this page');
        }
      } catch (error) {
        this.hideScanningIndicator();
        this.showNotification('Test failed');
        console.error('Error testing API:', error);
      }
    });

    // Manual scan current page
    document.getElementById('manual-scan').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url && tab.url.startsWith('http')) {
          this.showScanningIndicator();

          // Extract only base origin - strip paths, query params, fragments
          const baseOrigin = this.extractBaseOrigin(tab.url);
          console.log('🔒 Popup: Original URL:', tab.url);
          console.log('🔒 Popup: Sending base origin:', baseOrigin);

          // Send manual scan message to background script with cleaned URL
          await chrome.runtime.sendMessage({
            type: 'MANUAL_SCAN',
            url: baseOrigin,
            tabId: tab.id
          });

          setTimeout(() => {
            this.hideScanningIndicator();
            this.showNotification('Manual scan completed');
          }, 3000);
        } else {
          this.showNotification('Cannot scan this page');
        }
      } catch (error) {
        this.hideScanningIndicator();
        this.showNotification('Scan failed');
        console.error('Error manual scanning:', error);
      }
    });

    // Debug data button
    document.getElementById('debug-data').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url && tab.url.startsWith('http')) {
          this.showScanningIndicator();

          // Extract only base origin - strip paths, query params, fragments
          const baseOrigin = this.extractBaseOrigin(tab.url);
          console.log('🔒 Popup: Original URL:', tab.url);
          console.log('🔒 Popup: Sending base origin:', baseOrigin);

          // Send debug message to background script with cleaned URL
          await chrome.runtime.sendMessage({
            type: 'DEBUG_DATA',
            url: baseOrigin,
            tabId: tab.id
          });

          setTimeout(() => {
            this.hideScanningIndicator();
            this.showNotification('Debug data sent to console');
          }, 1000);
        } else {
          this.showNotification('Cannot debug this page');
        }
      } catch (error) {
        this.hideScanningIndicator();
        this.showNotification('Debug failed');
        console.error('Error debugging:', error);
      }
    });
  }

  // Update UI with status data
  updateUI(status) {
    this.updateToggleState('scanner-toggle', status.enabled);
    this.updateToggleState('test-data-toggle', status.useTestData);
    document.getElementById('scanned-count').textContent = status.scannedCount || 0;
    
    // Update last scan time if available
    if (status.lastScan) {
      document.getElementById('last-scan').textContent = new Date(status.lastScan).toLocaleTimeString();
    }
  }

  // Update toggle switch state
  updateToggleState(elementId, isActive) {
    const toggle = document.getElementById(elementId);
    if (isActive) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }

  // Show scanning indicator
  showScanningIndicator() {
    document.getElementById('scanning-indicator').classList.add('show');
  }

  // Hide scanning indicator
  hideScanningIndicator() {
    document.getElementById('scanning-indicator').classList.remove('show');
  }

  // Show notification
  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Listen for status updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'STATUS_UPDATE') {
    // Update UI with new status
    const popup = document.querySelector('body').popupController;
    if (popup) {
      popup.updateUI(request.data);
    }
  }
});
