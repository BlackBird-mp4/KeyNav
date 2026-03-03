/**
 * KeyClick - Popup Settings Script
 */

(function() {
  'use strict';

  // Default settings
  const DEFAULT_SETTINGS = {
    hintChars: 'asdfghjkl',
    activationKey: '/',
    backgroundColor: '#ffeb3b',
    textColor: '#000000',
    borderColor: '#f9a825',
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 3,
    opacity: 0.95,
    padding: 2,
    uppercase: true
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

  // State
  let isCapturingKey = false;
  let currentSettings = { ...DEFAULT_SETTINGS };

  // DOM elements
  const els = {};

  // Export settings to JSON file
  function exportSettings() {
    browser.storage.local.get(DEFAULT_SETTINGS).then(settings => {
      const data = JSON.stringify(settings, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'keyclick-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Exported!', 'success');
    }).catch(err => {
      console.error('Export error:', err);
      showStatus('Export failed', 'error');
    });
  }

  // Import settings from JSON file
  function importSettings(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const settings = JSON.parse(e.target.result);
        
        // Validate required fields exist
        const validKeys = Object.keys(DEFAULT_SETTINGS);
        const imported = {};
        for (const key of validKeys) {
          imported[key] = settings[key] !== undefined ? settings[key] : DEFAULT_SETTINGS[key];
        }
        
        browser.storage.local.set(imported).then(() => {
          loadSettings();
          showStatus('Imported!', 'success');
        }).catch(err => {
          console.error('Import save error:', err);
          showStatus('Import failed', 'error');
        });
      } catch (err) {
        console.error('Import parse error:', err);
        showStatus('Invalid file', 'error');
      }
    };
    reader.onerror = () => showStatus('Read failed', 'error');
    reader.readAsText(file);
  }

  // Initialize DOM references
  function initElements() {
    els.activationKeyDisplay = document.getElementById('activationKeyDisplay');
    els.changeKeyBtn = document.getElementById('changeKeyBtn');
    els.hintChars = document.getElementById('hintChars');
    els.backgroundColor = document.getElementById('backgroundColor');
    els.textColor = document.getElementById('textColor');
    els.borderColor = document.getElementById('borderColor');
    els.bgSwatch = document.getElementById('bgSwatch');
    els.textSwatch = document.getElementById('textSwatch');
    els.borderSwatch = document.getElementById('borderSwatch');
    els.fontSize = document.getElementById('fontSize');
    els.borderRadius = document.getElementById('borderRadius');
    els.uppercase = document.getElementById('uppercase');
    els.preview = document.getElementById('preview');
    els.saveBtn = document.getElementById('saveBtn');
    els.resetBtn = document.getElementById('resetBtn');
    els.status = document.getElementById('status');
  }

  // Validate and normalize hex color
  function normalizeHex(value) {
    let hex = value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    // Validate hex format
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
    if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
      // Expand shorthand #RGB to #RRGGBB
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return null; // Invalid
  }

  // Update swatches
  function updateSwatches() {
    const bg = normalizeHex(els.backgroundColor.value) || '#ffeb3b';
    const text = normalizeHex(els.textColor.value) || '#000000';
    const border = normalizeHex(els.borderColor.value) || '#f9a825';
    els.bgSwatch.style.backgroundColor = bg;
    els.textSwatch.style.backgroundColor = text;
    els.borderSwatch.style.backgroundColor = border;
  }

  // Format key for display
  function formatKey(key) {
    const names = { ' ': 'Space', 'Escape': 'Esc' };
    return names[key] || key;
  }

  // Load settings
  function loadSettings() {
    browser.storage.local.get(DEFAULT_SETTINGS).then(settings => {
      currentSettings = { ...DEFAULT_SETTINGS, ...settings };
      
      // Populate UI
      els.activationKeyDisplay.textContent = formatKey(currentSettings.activationKey);
      els.activationKeyDisplay.dataset.key = currentSettings.activationKey;
      els.hintChars.value = currentSettings.hintChars;
      els.backgroundColor.value = currentSettings.backgroundColor;
      els.textColor.value = currentSettings.textColor;
      els.borderColor.value = currentSettings.borderColor;
      els.fontSize.value = currentSettings.fontSize;
      els.borderRadius.value = currentSettings.borderRadius;
      els.uppercase.checked = currentSettings.uppercase;
      
      updatePreview();
      updateSwatches();
    }).catch(err => {
      console.error('Load error:', err);
      // Use defaults on error
      els.activationKeyDisplay.textContent = '/';
      els.hintChars.value = 'asdfghjkl';
    });
  }

  // Save settings
  function saveSettings() {
    // Normalize hex values
    const bgColor = normalizeHex(els.backgroundColor.value);
    const txtColor = normalizeHex(els.textColor.value);
    const bdrColor = normalizeHex(els.borderColor.value);

    if (!bgColor || !txtColor || !bdrColor) {
      showStatus('Invalid hex color', 'error');
      return;
    }

    const settings = {
      hintChars: els.hintChars.value || DEFAULT_SETTINGS.hintChars,
      activationKey: els.activationKeyDisplay.dataset.key || DEFAULT_SETTINGS.activationKey,
      backgroundColor: bgColor,
      textColor: txtColor,
      borderColor: bdrColor,
      fontSize: parseInt(els.fontSize.value, 10),
      fontWeight: 'bold',
      borderRadius: parseInt(els.borderRadius.value, 10),
      opacity: 0.95,
      padding: 2,
      uppercase: els.uppercase.checked
    };

    // Validate
    if (settings.hintChars.length < 2) {
      showStatus('Need at least 2 characters', 'error');
      return;
    }

    if (settings.hintChars.includes(settings.activationKey)) {
      showStatus('Key can\'t be in hint chars', 'error');
      return;
    }

    browser.storage.local.set(settings).then(() => {
      currentSettings = settings;
      showStatus('Saved!', 'success');
    }).catch(err => {
      console.error('Save error:', err);
      showStatus('Save failed', 'error');
    });
  }

  // Reset to defaults
  function resetSettings() {
    browser.storage.local.set(DEFAULT_SETTINGS).then(() => {
      loadSettings();
      showStatus('Reset!', 'success');
    }).catch(err => {
      console.error('Reset error:', err);
      showStatus('Reset failed', 'error');
    });
  }

  // Show status message
  function showStatus(msg, type) {
    els.status.textContent = msg;
    els.status.className = 'status show ' + type;
    setTimeout(() => {
      els.status.className = 'status';
    }, 2000);
  }

  // Update preview
  function updatePreview() {
    const chars = els.hintChars.value || 'AS';
    const text = chars.substring(0, 2);
    
    const bg = normalizeHex(els.backgroundColor.value) || '#ffeb3b';
    const txt = normalizeHex(els.textColor.value) || '#000000';
    const bdr = normalizeHex(els.borderColor.value) || '#f9a825';
    
    els.preview.textContent = els.uppercase.checked ? text.toUpperCase() : text.toLowerCase();
    els.preview.style.backgroundColor = bg;
    els.preview.style.color = txt;
    els.preview.style.border = '1px solid ' + bdr;
    els.preview.style.fontSize = els.fontSize.value + 'px';
    els.preview.style.borderRadius = els.borderRadius.value + 'px';
    
    updateSwatches();
  }

  // Apply color preset
  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    
    els.backgroundColor.value = preset.backgroundColor;
    els.textColor.value = preset.textColor;
    els.borderColor.value = preset.borderColor;
    updatePreview();
  }

  // Key capture
  function startKeyCapture() {
    isCapturingKey = true;
    els.activationKeyDisplay.textContent = 'Press key...';
    els.activationKeyDisplay.classList.add('capturing');
    els.changeKeyBtn.textContent = 'Cancel';
    els.changeKeyBtn.classList.add('capturing');
  }

  function stopKeyCapture() {
    isCapturingKey = false;
    els.activationKeyDisplay.classList.remove('capturing');
    els.changeKeyBtn.textContent = 'Change';
    els.changeKeyBtn.classList.remove('capturing');
    els.activationKeyDisplay.textContent = formatKey(els.activationKeyDisplay.dataset.key || '/');
  }

  function handleKeyCapture(e) {
    if (!isCapturingKey) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Ignore modifiers alone
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    
    els.activationKeyDisplay.dataset.key = e.key;
    els.activationKeyDisplay.textContent = formatKey(e.key);
    stopKeyCapture();
  }

  // Initialize
  function init() {
    initElements();
    loadSettings();

    // Key capture
    els.changeKeyBtn.addEventListener('click', () => {
      if (isCapturingKey) {
        stopKeyCapture();
      } else {
        startKeyCapture();
      }
    });

    document.addEventListener('keydown', handleKeyCapture, true);

    // Color inputs (hex)
    els.backgroundColor.addEventListener('input', updatePreview);
    els.textColor.addEventListener('input', updatePreview);
    els.borderColor.addEventListener('input', updatePreview);

    // Other inputs
    els.hintChars.addEventListener('input', updatePreview);
    els.fontSize.addEventListener('input', updatePreview);
    els.borderRadius.addEventListener('input', updatePreview);
    els.uppercase.addEventListener('change', updatePreview);

    // Presets
    document.querySelectorAll('.preset').forEach(btn => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // Save/Reset
    els.saveBtn.addEventListener('click', saveSettings);
    els.resetBtn.addEventListener('click', resetSettings);

    // Import/Export
    els.exportBtn = document.getElementById('exportBtn');
    els.importBtn = document.getElementById('importBtn');
    els.importFile = document.getElementById('importFile');
    
    els.exportBtn.addEventListener('click', exportSettings);
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importSettings(e.target.files[0]);
        e.target.value = ''; // Reset for re-import
      }
    });

    // Click outside to cancel key capture
    document.addEventListener('click', (e) => {
      if (isCapturingKey && 
          e.target !== els.activationKeyDisplay && 
          e.target !== els.changeKeyBtn) {
        stopKeyCapture();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
