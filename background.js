/**
 * KeyClick - Background Script
 * Handles keyboard shortcuts and settings sync
 */

// Handle keyboard commands (Alt+J, Alt+K)
browser.commands.onCommand.addListener((command) => {
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, { action: command });
    }
  }).catch(err => {
    console.log('KeyClick: Could not send message to tab', err);
  });
});

// Note: Browser action click is handled by popup/popup.js
// The popup opens automatically when clicking the toolbar icon

// Notify content scripts when settings change
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    browser.tabs.query({}).then(tabs => {
      tabs.forEach(tab => {
        browser.tabs.sendMessage(tab.id, { action: 'settings-updated' }).catch(() => {
          // Tab might not have content script loaded, ignore
        });
      });
    });
  }
});

// Log installation
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('KeyClick installed! Press / to show hints (customizable in options).');
  }
});
