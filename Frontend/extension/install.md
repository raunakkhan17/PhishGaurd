# 🚀 Quick Installation Guide

## Step 1: Prepare Your Extension Files

Make sure you have all these files in your extension folder:
- ✅ `manifest.json`
- ✅ `background.js`
- ✅ `content.js`
- ✅ `popup.html`
- ✅ `popup.js`
- ✅ `README.md`

## Step 2: Generate Icons (Optional)

1. Open `create_icons.html` in your browser
2. Click the download buttons for each icon size
3. Save the PNG files in your extension folder
4. Rename them to: `icon16.png`, `icon48.png`, `icon128.png`

## Step 3: Install in Chrome

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle switch in top right)
3. **Click "Load unpacked"**
4. **Select your extension folder**
5. **Pin the extension** to your toolbar

## Step 4: Test the Extension

1. **Visit any website** (e.g., youtube.com)
2. **Wait for automatic scan** (check console for logs)
3. **Results appear after 10 seconds** in full-screen overlay
4. **Click "Proceed with Your Own Risk"** to close the overlay
5. **Use Ctrl+Shift+S** to show overlay again (only when not visible)

## Step 5: Verify API Connection

1. **Click the extension icon** to open popup
2. **Click "Test API Connection"**
3. **Check console logs** for API responses
4. **Ensure your ngrok endpoint is running**

## 🔧 Troubleshooting

### Extension Not Loading?
- Check all files are present
- Verify `manifest.json` syntax
- Reload the extension

### API Not Working?
- Ensure ngrok tunnel is active
- Check endpoint URL in `background.js`
- Test API manually in browser

### Overlay Not Showing?
- Check content script injection
- Use keyboard shortcut Ctrl+Shift+S
- Verify message passing in console

## 📱 Features to Test

- ✅ Automatic website detection
- ✅ API calls to your endpoint
- ✅ 10-second delay before results
- ✅ Beautiful overlay display
- ✅ Popup controls
- ✅ Keyboard shortcuts
- ✅ Background monitoring

## 🎯 Next Steps

1. **Customize the overlay** styling in `content.js`
2. **Modify API response handling** for your data format
3. **Add your own branding** and colors
4. **Test on various websites**
5. **Share with users** or publish to Chrome Web Store

---

**Your security scanner extension is ready! 🔒✨**
