/**
 * KeyClick - Popup Script
 */

(function() {
  'use strict';

  // Load and display current activation key
  function loadActivationKey() {
    browser.storage.sync.get({ activationKey: '/' }).then(settings => {
      const keyDisplay = document.getElementById('activationKey');
      if (keyDisplay) {
        const keyNames = {
          ' ': 'Space',
          'Escape': 'Esc'
        };
        keyDisplay.textContent = keyNames[settings.activationKey] || settings.activationKey;
      }
    }).catch(() => {
      // Use default
    });
  }

  // Show hints in current tab
  function showHints() {
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { action: 'toggle-hints' }).then(() => {
          window.close();
        }).catch(err => {
          console.log('Could not show hints:', err);
          // Try to close popup anyway
          window.close();
        });
      }
    });
  }

  // Open options page
  function openOptions() {
    browser.runtime.openOptionsPage().then(() => {
      window.close();
    }).catch(err => {
      // Fallback: open options in new tab
      browser.tabs.create({ url: browser.runtime.getURL('options/options.html') }).then(() => {
        window.close();
      });
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    loadActivationKey();

    document.getElementById('showHintsBtn').addEventListener('click', showHints);
    document.getElementById('optionsBtn').addEventListener('click', openOptions);
  });

})();
