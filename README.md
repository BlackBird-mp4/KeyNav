# KeyNav

A Firefox extension for keyboard-based web navigation using letter hints. Click any link, button, or interactive element without touching your mouse.

## Features

- **Letter-based hints**: Press your trigger key (default `/`) to show letter hints on all clickable elements
- **Fast navigation**: Type one or two letters to click any link
- **Fully customizable**: Change trigger key, colors, font size, hint characters, and more
- **New tab support**: Hold `Ctrl` while typing a hint to open in a new tab
- **Lightweight**: No bloat, just the essentials

## Installation

### From Firefox Add-ons (Recommended)

*Coming soon - will submit to Firefox Add-ons store*

### Manual Installation (Development)

1. Clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the `keynav` folder

## Usage

| Shortcut | Action |
| -------- | ------ |
| `/` (customizable) | Show link hints |
| `Ctrl` + hint | Open in new tab (hold Ctrl while typing) |
| `Escape` | Cancel / hide hints |
| `Backspace` | Delete last typed character |

### How it works

1. Press `/` (or your custom key) to activate hints
2. Letter labels appear next to all clickable elements
3. Type the letters to click that element
4. Hold `Ctrl` while typing to open links in a new tab

## Customization

Click the extension icon → Options, or go to `about:addons` and find KeyNav settings.

### Available Options

- **Activation Key**: Set your preferred trigger key (default: `/`)
- **Hint Characters**: Which letters to use (default: `asdfghjkl` - home row for easy typing)
- **Colors**: Background, text, and border colors with preset themes
- **Appearance**: Font size, border radius, opacity, padding
- **Display**: Uppercase or lowercase hints

### Color Presets

- Yellow (Default)
- Blue
- Green
- Orange  
- Purple
- Dark

## Development

```bash
# Clone the repo
git clone https://github.com/yourusername/keynav.git
cd keynav

# Load in Firefox for testing
# 1. Open about:debugging
# 2. Load Temporary Add-on
# 3. Select manifest.json
```

### Project Structure

```
keynav/
├── manifest.json       # Extension manifest
├── background.js       # Background script for shortcuts
├── content.js          # Main hint logic (injected into pages)
├── content.css         # Hint animations and styles
├── icons/              # Extension icons
│   ├── icon-48.svg
│   └── icon-96.svg
├── popup/              # Popup settings
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── options/            # Full settings page
    ├── options.html
    ├── options.css
    └── options.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Inspired by:
- [Link Hints](https://addons.mozilla.org/en-US/firefox/addon/linkhints/)
- [Key Jump](https://addons.mozilla.org/en-US/firefox/addon/key-jump-keyboard-navigation/)
- [Vimium](https://addons.mozilla.org/en-US/firefox/addon/vimium-ff/)

---

Made with ⌨️ for keyboard enthusiasts
