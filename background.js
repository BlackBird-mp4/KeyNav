/**
 * KeyClick - Background Script
 * Handles keyboard shortcuts and browser action
 */

// Handle keyboard commands
browser.commands.onCommand.addListener((command) => {
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, { action: command });
    }
  }).catch(err => {
    console.log('KeyClick: Could not send message to tab', err);
  });
});

// Handle browser action (toolbar button) click
browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, { action: 'toggle-hints' }).catch(err => {
    console.log('KeyClick: Could not send message to tab', err);
  });
});

// Notify content scripts when settings change
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
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
    console.log('KeyClick installed! Press Alt+J to show hints.');
  }
});
