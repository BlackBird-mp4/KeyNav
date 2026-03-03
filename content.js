/**
 * KeyNav - Content Script
 * Handles hint generation, display, and interaction
 */

(function() {
  'use strict';

  // Default settings
  const DEFAULT_SETTINGS = {
    hintChars: 'asdfghjkl',
    activationKey: '/',
    backgroundColor: '#666666',
    textColor: '#2dcfff',
    borderColor: '#2dcfff',
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 3,
    opacity: 0.95,
    padding: 2,
    uppercase: true,
    showInputIndicator: true,
    persistentMode: false
  };

  let settings = { ...DEFAULT_SETTINGS };
  let hintsActive = false;
  let hints = [];
  let currentInput = '';
  let openInNewTab = false;
  let hintContainer = null;

  // Load settings from storage
  function loadSettings() {
    return browser.storage.local.get(DEFAULT_SETTINGS).then(stored => {
      settings = { ...DEFAULT_SETTINGS, ...stored };
    }).catch(() => {
      settings = { ...DEFAULT_SETTINGS };
    });
  }

  // Generate hint labels from characters
  function generateHintStrings(count) {
    const chars = settings.hintChars.toLowerCase();
    const labels = [];
    
    if (count <= chars.length) {
      // Single character hints
      for (let i = 0; i < count; i++) {
        labels.push(chars[i]);
      }
    } else {
      // Two character hints needed
      const firstChars = Math.ceil(count / chars.length);
      for (let i = 0; i < count; i++) {
        const first = chars[Math.floor(i / chars.length) % chars.length];
        const second = chars[i % chars.length];
        labels.push(first + second);
      }
    }
    
    return labels;
  }

  // Find all clickable elements on the page
  function getClickableElements() {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[onclick]',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[tabindex]:not([tabindex="-1"])',
      'summary',
      '[contenteditable="true"]',
      'video',
      'audio'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    const visible = [];

    elements.forEach(el => {
      if (isElementVisible(el)) {
        visible.push(el);
      }
    });

    return visible;
  }

  // Check if element is visible and in viewport
  function isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    // Check basic visibility
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0' ||
        rect.width === 0 || 
        rect.height === 0) {
      return false;
    }

    // Check if in viewport (with some margin)
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    if (rect.bottom < 0 || 
        rect.top > viewportHeight || 
        rect.right < 0 || 
        rect.left > viewportWidth) {
      return false;
    }

    return true;
  }

  // Create hint overlay container
  function createHintContainer() {
    if (hintContainer) {
      hintContainer.remove();
    }

    hintContainer = document.createElement('div');
    hintContainer.id = 'keyclick-container';
    hintContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.body.appendChild(hintContainer);
  }

  // Create a single hint element
  function createHintElement(label, targetRect) {
    const hint = document.createElement('div');
    hint.className = 'keyclick-hint';
    hint.textContent = settings.uppercase ? label.toUpperCase() : label;
    hint.dataset.label = label.toLowerCase();

    // Calculate position
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    // Position hint at top-left of element, slightly offset
    let left = targetRect.left + scrollX - 2;
    let top = targetRect.top + scrollY - 2;

    // Ensure hint stays in viewport
    if (left < scrollX + 5) left = scrollX + 5;
    if (top < scrollY + 5) top = scrollY + 5;

    hint.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      background-color: ${settings.backgroundColor};
      color: ${settings.textColor};
      border: 1px solid ${settings.borderColor};
      border-radius: ${settings.borderRadius}px;
      font-size: ${settings.fontSize}px;
      font-weight: ${settings.fontWeight};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: ${settings.padding}px ${settings.padding + 2}px;
      opacity: ${settings.opacity};
      line-height: 1.2;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      z-index: 2147483647;
      transition: transform 0.1s ease, opacity 0.1s ease;
    `;

    return hint;
  }

  // Show hints for all clickable elements
  function showHints(newTab = false) {
    if (hintsActive) {
      hideHints();
      return;
    }

    loadSettings().then(() => {
      openInNewTab = newTab;
      const elements = getClickableElements();
      
      if (elements.length === 0) {
        return;
      }

      const labels = generateHintStrings(elements.length);
      createHintContainer();

      hints = [];
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const hintEl = createHintElement(labels[index], rect);
        hintContainer.appendChild(hintEl);
        hints.push({
          element: el,
          hintElement: hintEl,
          label: labels[index].toLowerCase()
        });
      });

      hintsActive = true;
      currentInput = '';
      document.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('scroll', updateHintPositions, true);
      window.addEventListener('resize', updateHintPositions);
      
      // Show input indicator
      showInputIndicator();
    });
  }

  // Update hint positions on scroll/resize
  function updateHintPositions() {
    if (!hintsActive) return;
    
    hints.forEach(hint => {
      const rect = hint.element.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      let left = rect.left + scrollX - 2;
      let top = rect.top + scrollY - 2;
      
      if (left < scrollX + 5) left = scrollX + 5;
      if (top < scrollY + 5) top = scrollY + 5;
      
      hint.hintElement.style.left = left + 'px';
      hint.hintElement.style.top = top + 'px';
      
      // Hide hints for elements scrolled out of view
      const inView = rect.top >= 0 && rect.bottom <= window.innerHeight &&
                     rect.left >= 0 && rect.right <= window.innerWidth;
      hint.hintElement.style.opacity = inView ? settings.opacity : '0.3';
    });
  }

  // Hide all hints
  function hideHints() {
    hintsActive = false;
    currentInput = '';
    hints = [];
    openInNewTab = false;

    if (hintContainer) {
      hintContainer.remove();
      hintContainer = null;
    }

    hideInputIndicator();
    document.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('scroll', updateHintPositions, true);
    window.removeEventListener('resize', updateHintPositions);
  }

  // Input indicator for showing typed characters
  let inputIndicator = null;

  function showInputIndicator() {
    // Skip if disabled in settings
    if (!settings.showInputIndicator) return;
    
    if (inputIndicator) {
      inputIndicator.remove();
    }

    inputIndicator = document.createElement('div');
    inputIndicator.id = 'keyclick-input-indicator';
    inputIndicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: ${settings.backgroundColor};
      color: ${settings.textColor};
      border: 2px solid ${settings.borderColor};
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 10px 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 2147483647;
      min-width: 60px;
      text-align: center;
      transition: all 0.15s ease;
    `;
    updateInputIndicator();
    document.body.appendChild(inputIndicator);
  }

  function updateInputIndicator() {
    if (!inputIndicator) return;
    
    const mode = openInNewTab ? '[Ctrl: new tab] ' : '';
    const typed = settings.uppercase ? currentInput.toUpperCase() : currentInput;
    inputIndicator.textContent = mode + (typed || 'Type hint...');
    inputIndicator.style.opacity = currentInput ? '1' : '0.8';
    
    // Visual feedback for Ctrl held
    if (openInNewTab) {
      inputIndicator.style.borderColor = '#2196f3';
      inputIndicator.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
    } else {
      inputIndicator.style.borderColor = settings.borderColor;
      inputIndicator.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    }
  }

  function hideInputIndicator() {
    if (inputIndicator) {
      inputIndicator.remove();
      inputIndicator = null;
    }
  }

  // Handle keyboard input
  function handleKeyDown(e) {
    if (!hintsActive) return;

    // Track Ctrl state for new tab
    openInNewTab = e.ctrlKey;
    updateInputIndicator();

    // Escape to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      hideHints();
      return;
    }

    // Backspace to delete last character
    if (e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      currentInput = currentInput.slice(0, -1);
      updateInputIndicator();
      filterHints();
      return;
    }

    // Only accept hint characters
    const char = e.key.toLowerCase();
    if (!settings.hintChars.toLowerCase().includes(char)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    currentInput += char;
    updateInputIndicator();

    // Check for match
    const match = hints.find(h => h.label === currentInput);
    if (match) {
      activateElement(match.element);
      if (settings.persistentMode) {
        // In persistent mode, refresh hints after click
        currentInput = '';
        updateInputIndicator();
        filterHints();
        // Refresh hints after a short delay for DOM updates
        setTimeout(refreshHints, 100);
      } else {
        hideHints();
      }
      return;
    }

    // Filter visible hints
    filterHints();

    // If no hints match anymore, reset
    const possibleMatches = hints.filter(h => h.label.startsWith(currentInput));
    if (possibleMatches.length === 0) {
      currentInput = '';
      updateInputIndicator();
      filterHints();
    }
  }

  // Filter hints based on current input
  function filterHints() {
    hints.forEach(hint => {
      if (hint.label.startsWith(currentInput)) {
        hint.hintElement.style.display = 'block';
        hint.hintElement.style.transform = currentInput ? 'scale(1.1)' : 'scale(1)';
        
        // Highlight matched portion
        const matchedPart = currentInput.toUpperCase();
        const remainingPart = hint.label.slice(currentInput.length);
        const displayRemaining = settings.uppercase ? remainingPart.toUpperCase() : remainingPart;
        
        if (currentInput) {
          hint.hintElement.innerHTML = `<span style="opacity: 0.5">${matchedPart}</span>${displayRemaining}`;
        } else {
          hint.hintElement.textContent = settings.uppercase ? hint.label.toUpperCase() : hint.label;
        }
      } else {
        hint.hintElement.style.display = 'none';
      }
    });
  }

  // Activate (click) the target element
  function activateElement(el) {
    // Handle links
    if (el.tagName === 'A' && el.href) {
      if (openInNewTab) {
        window.open(el.href, '_blank');
      } else {
        el.click();
      }
      return;
    }

    // Handle inputs - focus them
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.focus();
      if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || el.type === 'email' || el.type === 'url')) {
        el.select();
      }
      return;
    }

    // Handle contenteditable
    if (el.contentEditable === 'true') {
      el.focus();
      return;
    }

    // Default: simulate click
    if (openInNewTab && el.tagName === 'A') {
      window.open(el.href, '_blank');
    } else {
      el.click();
    }
  }

  // Refresh hints (for persistent mode)
  function refreshHints() {
    if (!hintsActive) return;
    
    // Clear existing hints
    if (hintContainer) {
      hintContainer.innerHTML = '';
    }
    
    const elements = getClickableElements();
    const labels = generateHintStrings(elements.length);
    
    hints = [];
    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const hintEl = createHintElement(labels[index], rect);
      hintContainer.appendChild(hintEl);
      hints.push({
        element: el,
        hintElement: hintEl,
        label: labels[index].toLowerCase()
      });
    });
  }

  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'toggle-hints' || message.action === 'browser-action') {
      showHints(false);
    } else if (message.action === 'toggle-hints-newtab') {
      showHints(true);
    } else if (message.action === 'settings-updated') {
      loadSettings();
    }
  });

  // Global keyboard listener for activation key
  document.addEventListener('keydown', (e) => {
    // Don't activate if typing in an input field (unless hints are active)
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.isContentEditable
    );

    // Activation key toggles hints on/off
    if (e.key === settings.activationKey) {
      if (hintsActive) {
        e.preventDefault();
        e.stopPropagation();
        hideHints();
        return;
      }
      if (!isTyping) {
        e.preventDefault();
        e.stopPropagation();
        showHints(false);
      }
    }
  }, true);

  // Initial settings load
  loadSettings();

  // Expose for testing
  window.__keynav = {
    show: showHints,
    hide: hideHints,
    isActive: () => hintsActive
  };

})();
