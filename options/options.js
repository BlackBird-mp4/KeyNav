/**
 * KeyNav - Options Page Script
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

  // Color presets
  const PRESETS = {
    yellow: { backgroundColor: '#ffeb3b', textColor: '#000000', borderColor: '#f9a825' },
    blue: { backgroundColor: '#2196f3', textColor: '#ffffff', borderColor: '#1565c0' },
    green: { backgroundColor: '#4caf50', textColor: '#ffffff', borderColor: '#2e7d32' },
    orange: { backgroundColor: '#ff9800', textColor: '#000000', borderColor: '#e65100' },
    purple: { backgroundColor: '#9c27b0', textColor: '#ffffff', borderColor: '#6a1b9a' },
    dark: { backgroundColor: '#424242', textColor: '#ffffff', borderColor: '#212121' }
  };

  // State for key capture
  let isCapturingKey = false;

  // DOM Elements
  const elements = {
    hintChars: document.getElementById('hintChars'),
    uppercase: document.getElementById('uppercase'),
    activationKey: document.getElementById('activationKey'),
    activationKeyDisplay: document.getElementById('activationKeyDisplay'),
    captureKeyBtn: document.getElementById('captureKeyBtn'),
    backgroundColor: document.getElementById('backgroundColor'),
    backgroundColorText: document.getElementById('backgroundColorText'),
    textColor: document.getElementById('textColor'),
    textColorText: document.getElementById('textColorText'),
    borderColor: document.getElementById('borderColor'),
    borderColorText: document.getElementById('borderColorText'),
    fontSize: document.getElementById('fontSize'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    borderRadius: document.getElementById('borderRadius'),
    borderRadiusValue: document.getElementById('borderRadiusValue'),
    opacity: document.getElementById('opacity'),
    opacityValue: document.getElementById('opacityValue'),
    padding: document.getElementById('padding'),
    paddingValue: document.getElementById('paddingValue'),
    fontWeight: document.getElementById('fontWeight'),
    showInputIndicator: document.getElementById('showInputIndicator'),
    persistentMode: document.getElementById('persistentMode'),
    previewHint: document.getElementById('preview-hint'),
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    status: document.getElementById('status')
  };

  // Format key for display
  function formatKeyDisplay(key) {
    const keyNames = {
      ' ': 'Space',
      'Escape': 'Esc',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→'
    };
    return keyNames[key] || key;
  }

  // Load settings from storage
  function loadSettings() {
    browser.storage.local.get(DEFAULT_SETTINGS).then(settings => {
      // Populate form
      elements.hintChars.value = settings.hintChars;
      elements.uppercase.checked = settings.uppercase;
      
      // Activation key
      elements.activationKey.value = formatKeyDisplay(settings.activationKey);
      elements.activationKey.dataset.key = settings.activationKey;
      if (elements.activationKeyDisplay) {
        elements.activationKeyDisplay.textContent = formatKeyDisplay(settings.activationKey);
      }
      
      // Colors
      elements.backgroundColor.value = settings.backgroundColor;
      elements.backgroundColorText.value = settings.backgroundColor;
      elements.textColor.value = settings.textColor;
      elements.textColorText.value = settings.textColor;
      elements.borderColor.value = settings.borderColor;
      elements.borderColorText.value = settings.borderColor;
      
      // Appearance
      elements.fontSize.value = settings.fontSize;
      elements.fontSizeValue.textContent = settings.fontSize + 'px';
      elements.borderRadius.value = settings.borderRadius;
      elements.borderRadiusValue.textContent = settings.borderRadius + 'px';
      elements.opacity.value = Math.round(settings.opacity * 100);
      elements.opacityValue.textContent = Math.round(settings.opacity * 100) + '%';
      elements.padding.value = settings.padding;
      elements.paddingValue.textContent = settings.padding + 'px';
      elements.fontWeight.value = settings.fontWeight;
      
      // Behavior options
      elements.showInputIndicator.checked = settings.showInputIndicator;
      elements.persistentMode.checked = settings.persistentMode;
      
      updatePreview();
    }).catch(err => {
      console.error('Failed to load settings:', err);
      showStatus('Failed to load settings', 'error');
    });
  }

  // Save settings to storage
  function saveSettings() {
    const settings = {
      hintChars: elements.hintChars.value || DEFAULT_SETTINGS.hintChars,
      activationKey: elements.activationKey.dataset.key || DEFAULT_SETTINGS.activationKey,
      uppercase: elements.uppercase.checked,
      backgroundColor: elements.backgroundColor.value,
      textColor: elements.textColor.value,
      borderColor: elements.borderColor.value,
      fontSize: parseInt(elements.fontSize.value, 10),
      fontWeight: elements.fontWeight.value,
      borderRadius: parseInt(elements.borderRadius.value, 10),
      opacity: parseInt(elements.opacity.value, 10) / 100,
      padding: parseInt(elements.padding.value, 10),
      showInputIndicator: elements.showInputIndicator.checked,
      persistentMode: elements.persistentMode.checked
    };

    // Validate hint chars
    if (settings.hintChars.length < 2) {
      showStatus('Please enter at least 2 hint characters', 'error');
      elements.hintChars.classList.add('shake');
      setTimeout(() => elements.hintChars.classList.remove('shake'), 300);
      return;
    }

    // Warn if activation key is in hint chars
    if (settings.hintChars.includes(settings.activationKey)) {
      showStatus('Warning: Activation key should not be in hint characters', 'error');
      return;
    }

    browser.storage.local.set(settings).then(() => {
      showStatus('Settings saved!', 'success');
    }).catch(err => {
      console.error('Failed to save settings:', err);
      showStatus('Failed to save settings', 'error');
    });
  }

  // Reset to defaults
  function resetSettings() {
    browser.storage.local.set(DEFAULT_SETTINGS).then(() => {
      loadSettings();
      showStatus('Settings reset to defaults', 'success');
    }).catch(err => {
      console.error('Failed to reset settings:', err);
      showStatus('Failed to reset settings', 'error');
    });
  }

  // Key capture functionality
  function startKeyCapture() {
    isCapturingKey = true;
    elements.activationKey.value = 'Press a key...';
    elements.activationKey.classList.add('capturing');
    elements.captureKeyBtn.textContent = 'Cancel';
    elements.captureKeyBtn.classList.add('capturing');
  }

  function stopKeyCapture() {
    isCapturingKey = false;
    elements.activationKey.classList.remove('capturing');
    elements.captureKeyBtn.textContent = 'Change';
    elements.captureKeyBtn.classList.remove('capturing');
    // Restore displayed value
    elements.activationKey.value = formatKeyDisplay(elements.activationKey.dataset.key || '/');
  }

  function handleKeyCaptured(e) {
    if (!isCapturingKey) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Ignore modifier-only keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }

    const key = e.key;
    elements.activationKey.dataset.key = key;
    elements.activationKey.value = formatKeyDisplay(key);
    
    // Update the display in shortcuts section
    if (elements.activationKeyDisplay) {
      elements.activationKeyDisplay.textContent = formatKeyDisplay(key);
    }
    
    stopKeyCapture();
  }

  // Update preview hint
  function updatePreview() {
    const hint = elements.previewHint;
    const chars = elements.hintChars.value || 'as';
    const text = chars.substring(0, 2);
    
    hint.textContent = elements.uppercase.checked ? text.toUpperCase() : text.toLowerCase();
    hint.style.backgroundColor = elements.backgroundColor.value;
    hint.style.color = elements.textColor.value;
    hint.style.borderColor = elements.borderColor.value;
    hint.style.border = `1px solid ${elements.borderColor.value}`;
    hint.style.fontSize = elements.fontSize.value + 'px';
    hint.style.fontWeight = elements.fontWeight.value;
    hint.style.borderRadius = elements.borderRadius.value + 'px';
    hint.style.opacity = parseInt(elements.opacity.value, 10) / 100;
    hint.style.padding = `${elements.padding.value}px ${parseInt(elements.padding.value, 10) + 2}px`;
  }

  // Show status message
  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.className = `status show ${type}`;
    
    setTimeout(() => {
      elements.status.classList.remove('show');
    }, 3000);
  }

  // Apply color preset
  function applyPreset(presetName) {
    const preset = PRESETS[presetName];
    if (!preset) return;

    elements.backgroundColor.value = preset.backgroundColor;
    elements.backgroundColorText.value = preset.backgroundColor;
    elements.textColor.value = preset.textColor;
    elements.textColorText.value = preset.textColor;
    elements.borderColor.value = preset.borderColor;
    elements.borderColorText.value = preset.borderColor;
    
    updatePreview();
  }

  // Sync color picker with text input
  function syncColorInputs(colorInput, textInput) {
    colorInput.addEventListener('input', () => {
      textInput.value = colorInput.value;
      updatePreview();
    });

    textInput.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(textInput.value)) {
        colorInput.value = textInput.value;
        updatePreview();
      }
    });

    textInput.addEventListener('blur', () => {
      if (!/^#[0-9a-fA-F]{6}$/.test(textInput.value)) {
        textInput.value = colorInput.value;
      }
    });
  }

  // Sync range input with value display
  function syncRangeInput(rangeInput, valueDisplay, suffix = 'px') {
    rangeInput.addEventListener('input', () => {
      valueDisplay.textContent = rangeInput.value + suffix;
      updatePreview();
    });
  }

  // Initialize event listeners
  function init() {
    // Load saved settings
    loadSettings();

    // Color inputs sync
    syncColorInputs(elements.backgroundColor, elements.backgroundColorText);
    syncColorInputs(elements.textColor, elements.textColorText);
    syncColorInputs(elements.borderColor, elements.borderColorText);

    // Range inputs sync
    syncRangeInput(elements.fontSize, elements.fontSizeValue);
    syncRangeInput(elements.borderRadius, elements.borderRadiusValue);
    syncRangeInput(elements.opacity, elements.opacityValue, '%');
    syncRangeInput(elements.padding, elements.paddingValue);

    // Other inputs
    elements.hintChars.addEventListener('input', updatePreview);
    elements.uppercase.addEventListener('change', updatePreview);
    elements.fontWeight.addEventListener('change', updatePreview);

    // Key capture for activation key
    elements.captureKeyBtn.addEventListener('click', () => {
      if (isCapturingKey) {
        stopKeyCapture();
      } else {
        startKeyCapture();
      }
    });

    document.addEventListener('keydown', handleKeyCaptured);
    
    // Cancel capture on click outside
    document.addEventListener('click', (e) => {
      if (isCapturingKey && 
          e.target !== elements.activationKey && 
          e.target !== elements.captureKeyBtn) {
        stopKeyCapture();
      }
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyPreset(btn.dataset.preset);
      });
    });

    // Save button
    elements.saveBtn.addEventListener('click', saveSettings);

    // Reset button
    elements.resetBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to defaults?')) {
        resetSettings();
      }
    });

    // Save on Enter key in text inputs
    elements.hintChars.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !isCapturingKey) {
        saveSettings();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
