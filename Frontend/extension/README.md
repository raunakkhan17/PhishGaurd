# 🔒 Website Security Scanner - Browser Extension

A Chrome browser extension that automatically scans websites for security threats using AI-powered analysis. The extension calls your security API endpoint and displays results directly on the webpage after a 10-second delay.

## ✨ Features

- **Automatic Scanning**: Automatically detects and scans new websites when you visit them
- **Real-time API Integration**: Connects to your ngrok security API endpoint
- **Rectangular Overlay**: Displays security results in a 90% width, 80% height overlay with rounded corners
- **10-Second Delay**: Results appear exactly 10 seconds after API call completion
- **Force User Action**: User must click "Proceed with Your Own Risk" button to continue
- **Layer Analysis**: Shows detailed security analysis across multiple layers
- **Keyboard Shortcuts**: Use Ctrl+Shift+S to toggle the results overlay
- **Background Monitoring**: Continuously monitors tabs for new websites
- **User Controls**: Enable/disable scanner, clear history, manual scans

## 🚀 Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download/Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the folder containing these files
5. **Pin the extension** to your toolbar for easy access

### Method 2: Package and Install

1. **Zip the extension files** (manifest.json, background.js, content.js, popup.html, popup.js)
2. **Rename the zip file** to have a `.crx` extension
3. **Drag and drop** the `.crx` file onto the extensions page

## 📁 File Structure

```
website-security-scanner/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for webpage overlay
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── README.md             # This file
└── icons/                # Extension icons (optional)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🔧 Configuration

### API Endpoint

The extension is configured to use your ngrok endpoint:
- **Base URL**: `https://fade1e629530.ngrok-free.app`
- **Predict Endpoint**: `/predict`
- **Test Endpoint**: `/`

To change the API endpoint, edit the `baseURL` variable in `background.js`.

### Permissions

The extension requires these permissions:
- `activeTab`: Access to the current active tab
- `tabs`: Monitor tab updates and changes
- `storage`: Store extension settings and data
- `host_permissions`: Access to your API and all websites

## 🎯 Usage

### Automatic Scanning

1. **Install the extension** and ensure it's enabled
2. **Visit any website** (e.g., youtube.com, google.com)
3. **Wait for automatic scan** - the extension detects new websites
4. **Results appear after 10 seconds** in a rectangular overlay (90% width, 80% height) with rounded corners

### Manual Controls

- **Click the extension icon** to open the popup
- **Toggle scanner on/off** using the switch
- **View scan statistics** (websites scanned, last scan time)
- **Test API connection** to verify endpoint is working
- **Manual scan** current page if needed
- **Clear scan history** to reset counters

### Keyboard Shortcuts

- **Ctrl+Shift+S**: Show the security results overlay (only works when overlay is not visible)
- **Note**: The overlay cannot be closed with keyboard shortcuts - user must click "Proceed with Your Own Risk" button

## 🎨 Customization

### Styling the Overlay

Edit the CSS in `content.js` to customize:
- Colors and gradients
- Position and size
- Animations and transitions
- Font styles and sizes

### API Response Handling

Modify the `generateOverlayContent()` method in `content.js` to:
- Display different data fields
- Change the layout structure
- Add new visualization elements
- Customize score thresholds

## 🔍 How It Works

1. **Background Service Worker** (`background.js`)
   - Monitors tab updates and activations
   - Automatically calls your security API when new websites are detected
   - Waits 10 seconds after API response before showing results

2. **Content Script** (`content.js`)
   - Injects into every webpage
   - Receives security data from background script
   - Displays beautiful overlay with results
   - Handles user interactions and keyboard shortcuts

3. **Popup Interface** (`popup.html` + `popup.js`)
   - Provides user controls and settings
   - Shows scan statistics and status
   - Allows manual operations and testing

## 🐛 Troubleshooting

### Extension Not Working

1. **Check Developer Console** for error messages
2. **Verify API endpoint** is accessible and responding
3. **Check permissions** are granted
4. **Reload the extension** from chrome://extensions/

### API Connection Issues

1. **Verify ngrok tunnel** is running and accessible
2. **Check CORS settings** on your API
3. **Test endpoint manually** in browser or Postman
4. **Check network tab** for failed requests

### Overlay Not Displaying

1. **Ensure content script** is injected (check console logs)
2. **Verify message passing** between background and content scripts
3. **Check for CSS conflicts** with the webpage
4. **Try keyboard shortcut** Ctrl+Shift+S (only works when overlay is not visible)

### Overlay Won't Close

1. **The overlay is designed to be uncloseable** until user action
2. **User must click** "Proceed with Your Own Risk" button
3. **No keyboard shortcuts** can close the overlay
4. **This is intentional security behavior** to ensure user acknowledgment

## 🔒 Security Features

- **Automatic scanning** of all visited websites
- **Real-time threat detection** using your AI model
- **Layer-by-layer analysis** (URL, Domain, Features)
- **Score-based risk assessment** (Safe/Moderate/Dangerous)
- **Non-intrusive overlay** that doesn't affect webpage functionality

## 📊 API Response Format

The extension expects your API to return data in this format:

```json
{
  "final_result": {
    "final_score": 85,
    "status": "Safe"
  },
  "layer1": {
    "score": 90,
    "reason": "URL analysis passed"
  },
  "layer2": {
    "score": 80,
    "summary": "Domain scan completed",
    "malware_scan": {},
    "domain_info": {}
  },
  "layer3": {
    "score": 85,
    "feature_analysis": {}
  }
}
```

## 🚀 Future Enhancements

- **Custom scoring thresholds** for different risk levels
- **Export scan results** to CSV/PDF
- **Scan history dashboard** with detailed reports
- **Whitelist/blacklist** for specific domains
- **Real-time notifications** for high-risk websites
- **Integration with security tools** and threat feeds

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify your API endpoint is working correctly
4. Test with a simple website first (e.g., google.com)

---

**Happy Secure Browsing! 🔒✨**
