document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.getElementById("send");
  const questionInput = document.getElementById("question");
  const chatBox = document.getElementById("chat");
  const status = document.getElementById("status");
  const loader = document.getElementById("loader");

  // Initialize RAG service
  const ragService = new RAGService();
  let currentPageData = null;

  // Wait for RAG service to initialize before allowing use
  ragService.waitForReady().then(() => {
    console.log('✅ RAG Service is ready for use');
    status.textContent = "RAG Ready";
  }).catch(err => {
    console.error('❌ RAG Service failed to initialize:', err);
    status.textContent = "RAG Error";
  });

  // Add Enter key support
  questionInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendQuestion();
    }
  });

  sendBtn.addEventListener("click", sendQuestion);

  function sendQuestion() {
    const question = questionInput.value.trim();
    if (!question) return;

    console.log('🚀 Starting question processing:', question);

    // Show loading state
    setLoading(true);
    status.textContent = "Analyzing website...";
    
    // Add user question to chat
    addMessage("You", question, "user");
    
    // Clear input
    questionInput.value = "";

    // Use RAG to get relevant context
    processQuestionWithRAG(question);
  }

  async function processQuestionWithRAG(question) {
    try {
      console.log('📋 Stage 1: Starting RAG processing for question:', question);
      
      if (!currentPageData) {
        console.log('📄 Stage 1a: No page data found, getting page data and storing chunks...');
        await getPageDataAndStore();
      } else {
        console.log('📄 Stage 1a: Using existing page data:', currentPageData.url);
      }

      // Check if we have chunks for RAG
      if (currentPageData.textChunks && currentPageData.textChunks.length > 0) {
        console.log('🔍 Stage 2: Getting relevant context using RAG...');
        const context = await ragService.getContextForQuestion(question, currentPageData.url);
        console.log('📊 Stage 2a: RAG context retrieved:', context);
        
        // Send to Gemini with focused context
        console.log('🤖 Stage 3: Sending to Gemini with RAG context...');
        await sendToGeminiWithContext(question, context);
      } else {
        console.log('⚠️ Stage 2: No chunks available, falling back to legacy mode...');
        console.log('🤖 Stage 3: Sending to Gemini with legacy prompt (no RAG)...');
        await sendToGeminiLegacy(question);
      }
      
    } catch (error) {
      console.error('❌ RAG processing error:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Fallback to legacy mode on error
      console.log('🔄 Falling back to legacy mode due to RAG error...');
      try {
        await sendToGeminiLegacy(question);
      } catch (legacyError) {
        console.error('❌ Legacy mode also failed:', legacyError);
        addMessage("Bot", `❌ Error: Could not process your question. RAG failed: ${error.message}. Legacy also failed: ${legacyError.message}`, "bot");
        setLoading(false);
        status.textContent = "Error processing question";
      }
    }
  }

  async function getPageDataAndStore() {
    return new Promise((resolve, reject) => {
      console.log('🌐 Stage 1a-1: Querying active tab...');
      
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (!tabs || tabs.length === 0) {
          const error = new Error("No active tab found");
          console.error('❌ No active tab:', error);
          reject(error);
          return;
        }
        
        console.log('🌐 Stage 1a-2: Active tab found:', tabs[0].url);
        console.log('🌐 Stage 1a-2a: Tab ID:', tabs[0].id);
        console.log('🌐 Stage 1a-2b: Tab status:', tabs[0].status);
        
        // Try to inject content script if it's not already loaded
        try {
          console.log('🔧 Stage 1a-2c: Attempting to inject content script...');
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          });
          console.log('✅ Stage 1a-2c: Content script injected successfully');
        } catch (injectError) {
          console.log('ℹ️ Stage 1a-2c: Content script already loaded or injection failed:', injectError.message);
        }
        
        // Wait a moment for the script to initialize
        setTimeout(async () => {
          try {
            console.log('📨 Stage 1a-2d: Sending message to content script...');
            chrome.tabs.sendMessage(tabs[0].id, { type: "GET_PAGE_DATA" }, async (pageData) => {
              if (chrome.runtime.lastError) {
                const error = new Error(`Chrome runtime error: ${chrome.runtime.lastError.message}`);
                console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
                console.error('❌ This usually means the content script is not loaded on this page');
                console.error('❌ Try refreshing the page or checking if the extension has permission');
                reject(error);
                return;
              }

              if (!pageData) {
                const error = new Error("No page data received from content script");
                console.error('❌ No page data received');
                reject(error);
                return;
              }

              console.log('📄 Stage 1a-3: Page data received:', {
                title: pageData.title,
                url: pageData.url,
                textLength: pageData.text?.length || 0,
                chunksCount: pageData.textChunks?.length || 0,
                formsCount: pageData.forms?.length || 0,
                linksCount: pageData.links?.length || 0
              });
              
              // Log extracted content details
              console.log('📄 Stage 1a-3a: Extracted text preview:', pageData.text?.substring(0, 300) + '...');
              console.log('📄 Stage 1a-3b: Meta description:', pageData.metaDescription);
              console.log('📄 Stage 1a-3c: Security info:', pageData.securityInfo);
              
              // Log chunk details
              if (pageData.textChunks && pageData.textChunks.length > 0) {
                console.log('📄 Stage 1a-3d: Text chunks details:');
                pageData.textChunks.forEach((chunk, index) => {
                  console.log(`  Chunk ${index + 1}:`, {
                    id: chunk.id,
                    textLength: chunk.text?.length || 0,
                    textPreview: chunk.text?.substring(0, 100) + '...',
                    startWord: chunk.startWord,
                    endWord: chunk.endWord
                  });
                });
              } else {
                console.warn('⚠️ Stage 1a-3d: NO TEXT CHUNKS FOUND! This means the content script failed to create chunks.');
                console.warn('⚠️ This could be due to:');
                console.warn('⚠️ 1. Content script not loading properly');
                console.warn('⚠️ 2. Text extraction failing');
                console.warn('⚠️ 3. Chunking function error');
              }

              try {
                currentPageData = pageData;

                // Wait for RAG service to be ready
                await ragService.waitForReady();

                // Store chunks in RAG system
                if (pageData.textChunks && pageData.textChunks.length > 0) {
                  console.log('💾 Stage 1a-4: Storing chunks in RAG system...');
                  console.log('💾 Chunks to store:', pageData.textChunks.length);

                  await ragService.storeChunks(pageData.url, pageData.textChunks, {
                    title: pageData.title,
                    securityInfo: pageData.securityInfo,
                    forms: pageData.forms,
                    links: pageData.links
                  });

                  console.log('✅ Stage 1a-5: Chunks stored successfully');

                  // Cleanup old data
                  console.log('🧹 Stage 1a-6: Cleaning up old data...');
                  const cleanedCount = await ragService.cleanupOldData();
                  console.log('🧹 Cleaned up chunks:', cleanedCount);
                } else {
                  console.warn('⚠️ No text chunks found in page data');
                  console.warn('⚠️ RAG system will not work without chunks');
                  console.warn('⚠️ Falling back to legacy mode (no RAG)');
                }

                resolve(pageData);
              } catch (error) {
                console.error('❌ Error in page data processing:', error);
                reject(error);
              }
            });
          } catch (error) {
            console.error('❌ Error in message handling:', error);
            reject(error);
          }
        }, 1000); // Wait 1 second for script to initialize
      });
    });
  }

  async function sendToGeminiWithContext(question, context) {
    try {
      console.log('🤖 Stage 3-1: Preparing Gemini request...');
      console.log('🤖 Question:', question);
      console.log('🤖 Context:', context);
      console.log('🤖 Page data URL:', currentPageData?.url);
      
      const requestData = {
        type: "ASK_GEMINI_RAG",
        question: question,
        context: context,
        pageData: currentPageData
      };
      
      console.log('🤖 Stage 3-2: Sending request to background script:', requestData);
      
      // Add timeout to the request
      const response = await Promise.race([
        chrome.runtime.sendMessage(requestData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        )
      ]);
      
      console.log('🤖 Stage 3-3: Raw response received:', response);

      if (chrome.runtime.lastError) {
        throw new Error(`Chrome runtime error: ${chrome.runtime.lastError.message}`);
      }
      
      if (!response) {
        throw new Error("No response received from background script");
      }
      
      if (!response.answer) {
        console.error('❌ Response missing answer property:', response);
        throw new Error("Response missing answer property");
      }
      
      console.log('✅ Stage 3-4: Valid response received, adding to chat');
      addMessage("Bot", response.answer, "bot");
      setLoading(false);
      status.textContent = "Ready";
      
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Current page data:', currentPageData);
      console.error('❌ Context data:', context);
      
      addMessage("Bot", `❌ Error: Could not get response from AI. Details: ${error.message}`, "bot");
      setLoading(false);
      status.textContent = "API Error";
    }
  }

  async function sendToGeminiLegacy(question) {
    try {
      console.log('🤖 Legacy: Sending to Gemini without RAG...');
      console.log('🤖 Legacy: Question:', question);
      console.log('🤖 Legacy: Page data URL:', currentPageData?.url);
      
      const requestData = {
        type: "ASK_GEMINI", // Use legacy type
        question: question,
        pageData: currentPageData
      };
      
      console.log('🤖 Legacy: Sending request to background script:', requestData);
      
      // Add timeout to the request
      const response = await Promise.race([
        chrome.runtime.sendMessage(requestData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        )
      ]);
      
      console.log('🤖 Legacy: Raw response received:', response);

      if (chrome.runtime.lastError) {
        throw new Error(`Chrome runtime error: ${chrome.runtime.lastError.message}`);
      }
      
      if (!response) {
        throw new Error("No response received from background script");
      }
      
      if (!response.answer) {
        console.error('❌ Legacy: Response missing answer property:', response);
        throw new Error("Response missing answer property");
      }
      
      console.log('✅ Legacy: Valid response received, adding to chat');
      addMessage("Bot", response.answer, "bot");
      setLoading(false);
      status.textContent = "Ready";
      
    } catch (error) {
      console.error('❌ Legacy Gemini API error:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Current page data:', currentPageData);
      
      addMessage("Bot", `❌ Error: Could not get response from AI (Legacy mode). Details: ${error.message}`, "bot");
      setLoading(false);
      status.textContent = "API Error";
    }
  }

  function addMessage(sender, text, type) {
    console.log(`💬 Adding message - Sender: ${sender}, Type: ${type}, Text length: ${text?.length || 0}`);
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;
    
    if (type === "bot") {
      // Format bot responses with better structure
      const formattedText = formatBotResponse(text);
      messageDiv.innerHTML = formattedText;
      console.log('🤖 Bot message formatted and added');
    } else {
      messageDiv.innerHTML = `<p>${text}</p>`;
      console.log('👤 User message added');
    }
    
    chatBox.appendChild(messageDiv);
    
    // Smooth scroll to bottom
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
  }

  function formatBotResponse(text) {
    if (!text) return '<p class="bot-p">No response content</p>';

    const lines = text.split('\n');
    let html = '';
    let listBuffer  = [];   // pending bullet/numbered list items
    let tableRows   = [];   // pending table rows (arrays of cell strings)
    let tableIsOpen = false;

    /* ---- helpers ---- */
    function fmt(t) {                         // inline markdown → HTML
      return t
        .replace(/✅/g,  '<span class="badge badge-safe">✅ Safe</span>')
        .replace(/⚠️/g,  '<span class="badge badge-warn">⚠️ Warning</span>')
        .replace(/🚨/g,  '<span class="badge badge-danger">🚨 Danger</span>')
        .replace(/⚪/g,  '<span class="badge badge-neutral">⚪ Neutral</span>')
        .replace(/❌/g,  '<span class="badge badge-danger">❌ Risk</span>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g,    '<em>$1</em>')
        .replace(/`([^`]+)`/g,    '<code class="inline-code">$1</code>');
    }

    function flushList() {
      if (!listBuffer.length) return;
      html += '<ul class="bot-list">' + listBuffer.map(li => `<li>${li}</li>`).join('') + '</ul>';
      listBuffer = [];
    }

    function flushTable() {
      if (!tableRows.length) return;
      const [head, ...body] = tableRows;
      const thHtml = head.map(h => `<th>${fmt(h)}</th>`).join('');
      const tbHtml = body.map(row =>
        '<tr>' + row.map(c => `<td>${fmt(c)}</td>`).join('') + '</tr>'
      ).join('');
      html += `<div class="bot-table-wrap"><table class="bot-table"><thead><tr>${thHtml}</tr></thead><tbody>${tbHtml}</tbody></table></div>`;
      tableRows   = [];
      tableIsOpen = false;
    }

    function flushAll() { flushList(); flushTable(); }

    /* ---- main loop ---- */
    for (const raw of lines) {
      const line = raw.trim();

      /* — pipe table row — */
      if (line.startsWith('|') && line.endsWith('|')) {
        const isSep = /^\|[\s\-|:]+\|$/.test(line);  // separator row (|---|---|)
        if (isSep) { tableIsOpen = true; continue; }  // skip separator, mark table open
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        flushList();                   // close any open list before table
        tableRows.push(cells);
        tableIsOpen = true;
        continue;
      }

      /* non-table line — flush pending table */
      if (tableIsOpen) flushTable();

      /* — empty line — */
      if (line === '') {
        flushAll();
        html += '<div class="bot-spacer"></div>';
        continue;
      }

      /* — headings — */
      if (line.startsWith('### ')) { flushList(); html += `<h4 class="bot-h3">${fmt(line.slice(4))}</h4>`; continue; }
      if (line.startsWith('## '))  { flushList(); html += `<h3 class="bot-h2">${fmt(line.slice(3))}</h3>`; continue; }
      if (line.startsWith('# '))   { flushList(); html += `<h2 class="bot-h1">${fmt(line.slice(2))}</h2>`; continue; }

      /* — horizontal rule — */
      if (/^---+$/.test(line)) { flushList(); html += '<hr class="bot-hr">'; continue; }

      /* — unordered list — */
      if (/^[-*•]\s/.test(line)) { listBuffer.push(fmt(line.replace(/^[-*•]\s+/, ''))); continue; }

      /* — ordered list — */
      if (/^\d+\.\s/.test(line)) { listBuffer.push(fmt(line.replace(/^\d+\.\s+/, ''))); continue; }

      /* — normal paragraph — */
      flushList();
      html += `<p class="bot-p">${fmt(line)}</p>`;
    }

    flushAll();
    return html;
  }



  function setLoading(loading) {


    console.log(`⏳ Setting loading state: ${loading}`);
    
    if (loading) {
      sendBtn.classList.add("loading");
      sendBtn.disabled = true;
      loader.style.display = "block";
    } else {
      sendBtn.classList.remove("loading");
      sendBtn.disabled = false;
      loader.style.display = "none";
    }
  }
  
  // Initialize RAG service and log status
  console.log('🚀 Web Security Bot RAG system initialized');
  console.log('🔧 RAG Service:', ragService);
});
