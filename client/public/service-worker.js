// Arcade Soundboard Service Worker - Manifest V3

chrome.runtime.onInstalled.addListener(async () => {
  // Configure side panel to open on action click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (err) {
      console.warn('Failed to set side panel behavior:', err);
    }
  }

  // Create Context Menus
  if (chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'sb-open-sidepanel',
        title: '🔊 Abrir Soundboard no Painel Lateral',
        contexts: ['action', 'page']
      });

      chrome.contextMenus.create({
        id: 'sb-open-full',
        title: '🎮 Abrir Soundboard em Tela Cheia (Nova Aba)',
        contexts: ['action', 'page']
      });

      chrome.contextMenus.create({
        id: 'sb-add-link',
        title: '➕ Adicionar este link de áudio ao Soundboard',
        contexts: ['link', 'audio', 'selection']
      });
    });
  }
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sb-open-sidepanel' && tab?.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (e) {
      console.error('Error opening side panel:', e);
    }
  } else if (info.menuItemId === 'sb-open-full') {
    await chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  } else if (info.menuItemId === 'sb-add-link') {
    const targetUrl = info.srcUrl || info.linkUrl || info.selectionText;
    if (targetUrl) {
      // Store pending import
      await chrome.storage.local.set({ pending_sound_import: targetUrl.trim() });
      if (tab?.windowId) {
        try {
          await chrome.sidePanel.open({ windowId: tab.windowId });
        } catch {}
      }
      // Broadcast message to any active soundboard page
      try {
        await chrome.runtime.sendMessage({
          type: 'IMPORT_SOUND_URL',
          url: targetUrl.trim()
        });
      } catch {}
    }
  }
});

// Handle global keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'stop-all-sounds') {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_ALL_AUDIO' });
    } catch {}
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ status: 'PONG', version: '1.0.0' });
    return true;
  }
  return true;
});
