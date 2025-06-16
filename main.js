// Grab Tauri APIs
const { LogicalSize, LogicalPosition } = window.__TAURI__.window;
const appWindow = window.__TAURI__.webviewWindow.getCurrentWebviewWindow();

// DOM refs
const app = document.getElementById('app');
const grid = document.getElementById('grid');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const settingsPanel = document.getElementById('settings-panel');
const themeToggle = document.getElementById('theme-toggle');
const closeSettings = document.getElementById('close-settings');
const body = document.body;

// State management
let origSize, origPos;
let isExpanded = false;
let hoverTimeout;
let currentTheme = 'light';

// Capture original geometry once
async function ensureOriginal() {
  if (!origSize) {
    origSize = await appWindow.outerSize();
    origPos = await appWindow.outerPosition();
  }
}

// Theme management
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  body.className = `theme-${currentTheme} ${isExpanded ? 'mode-expanded' : 'mode-compact'}`;
  themeToggle.classList.toggle('active', currentTheme === 'dark');
  
  // Save theme preference (you can add localStorage here if needed)
  console.log(`Theme switched to: ${currentTheme}`);
}

// Initialize theme
function initTheme() {
  // You can load saved theme from localStorage here
  body.className = `theme-${currentTheme} mode-compact`;
  themeToggle.classList.toggle('active', currentTheme === 'dark');
}

// Update app mode class
function updateAppMode() {
  const modeClass = isExpanded ? 'mode-expanded' : 'mode-compact';
  body.className = `theme-${currentTheme} ${modeClass}`;
}

// Show chat on hover with smooth delay (only in compact mode)
app.addEventListener('mouseenter', () => {
  clearTimeout(hoverTimeout);
  if (!isExpanded) {
    chatContainer.classList.add('visible');
    grid.style.transform = 'translateY(-8px)';
  }
});

// Hide chat when leaving with delay (only in compact mode)
app.addEventListener('mouseleave', () => {
  if (!isExpanded) {
    hoverTimeout = setTimeout(() => {
      chatContainer.classList.remove('visible');
      grid.style.transform = 'translateY(0)';
    }, 200);
  }
});

// Expand chat window - responsive resize and reposition
async function expandChat(e) {
  e?.stopPropagation();
  if (isExpanded) return;

  await ensureOriginal();
  isExpanded = true;
  updateAppMode();

  // Clear any hover states
  clearTimeout(hoverTimeout);
  chatContainer.classList.add('visible');
  grid.classList.add('hidden');

  // Calculate responsive dimensions
  const minWidth = 500;
  const maxWidth = 700;
  const availWidth = screen.availWidth;
  const newWidth = Math.min(maxWidth, Math.max(minWidth, availWidth * 0.4));
  const newHeight = 140;
  
  // Center horizontally, position from top
  const x = Math.round((availWidth - newWidth) / 2);
  const y = Math.round(screen.availHeight * 0.1); // 10% from top

  // Resize and reposition window smoothly
  await Promise.all([
    appWindow.setSize(new LogicalSize(newWidth, newHeight)),
    appWindow.setPosition(new LogicalPosition(x, y))
  ]);

  // Focus input after animations complete
  setTimeout(() => chatInput.focus(), 150);
}

// Collapse chat window - restore original state
async function collapseChat() {
  if (!isExpanded) return;
  
  isExpanded = false;
  updateAppMode();

  // Update UI state
  chatContainer.classList.remove('visible');
  grid.classList.remove('hidden');

  // Restore original size and position
  if (origSize && origPos) {
    await Promise.all([
      appWindow.setSize(new LogicalSize(origSize.width, origSize.height)),
      appWindow.setPosition(new LogicalPosition(origPos.x, origPos.y))
    ]);
  }

  chatInput.blur();
}

// Settings panel management
function showSettings() {
  settingsPanel.classList.add('visible');
}

function hideSettings() {
  settingsPanel.classList.remove('visible');
}

// Event listeners for chat expansion
chatContainer.addEventListener('click', expandChat);
chatInput.addEventListener('focus', expandChat);

// Settings event listeners
themeToggle.addEventListener('click', toggleTheme);
closeSettings.addEventListener('click', hideSettings);

// Click outside to collapse (improved detection)
document.addEventListener('click', (e) => {
  // Handle settings panel
  if (settingsPanel.classList.contains('visible') && 
      !settingsPanel.contains(e.target)) {
    hideSettings();
    return;
  }
  
  // Handle chat expansion
  if (isExpanded && !chatContainer.contains(e.target)) {
    collapseChat();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (settingsPanel.classList.contains('visible')) {
      hideSettings();
    } else if (isExpanded) {
      collapseChat();
    }
  }
  
  // Ctrl/Cmd + K to quick open chat
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (!isExpanded && !settingsPanel.classList.contains('visible')) {
      expandChat();
    }
  }
  
  // Ctrl/Cmd + , to open settings
  if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault();
    if (!settingsPanel.classList.contains('visible')) {
      showSettings();
    }
  }
});

// Enhanced shortcut interactions
document.querySelectorAll('.shortcut').forEach(shortcut => {
  shortcut.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = shortcut.dataset.action;
    
    // Visual feedback animation
    shortcut.style.transform = 'translateY(-2px) scale(0.95)';
    shortcut.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      shortcut.style.transform = '';
      shortcut.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 100);

    // Handle different actions
    switch(action) {
      case 'chat':
        expandChat();
        break;
      case 'settings':
        showSettings();
        break;
      case 'focus':
        console.log('Focus mode clicked');
        // Add your focus mode logic here
        break;
      case 'navigate':
        console.log('Navigate clicked');
        // Add your navigation logic here
        break;
    }
  });

  // Enhanced hover effects for shortcuts (only in compact mode)
  shortcut.addEventListener('mouseenter', () => {
    if (!isExpanded) {
      shortcut.style.transform = 'translateY(-2px) scale(1.02)';
    }
  });

  shortcut.addEventListener('mouseleave', () => {
    if (!isExpanded) {
      shortcut.style.transform = '';
    }
  });
});

// Handle input submission
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
      console.log('Message sent:', message);
      // Add your message handling logic here
      
      // Create a simple message display (you can enhance this)
      const messageDisplay = document.createElement('div');
      messageDisplay.textContent = `Sent: ${message}`;
      messageDisplay.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 12px;
        color: ${currentTheme === 'dark' ? '#9CA3AF' : '#6B7280'};
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
      `;
      
      chatContainer.appendChild(messageDisplay);
      setTimeout(() => messageDisplay.style.opacity = '1', 10);
      setTimeout(() => {
        messageDisplay.style.opacity = '0';
        setTimeout(() => messageDisplay.remove(), 300);
      }, 2000);
      
      chatInput.value = '';
    }
  }
});

// Window resize handler to maintain responsiveness
window.addEventListener('resize', () => {
  if (isExpanded) {
    // Recalculate positioning if needed
    const newWidth = Math.min(700, Math.max(500, window.innerWidth * 0.8));
    const newHeight = 140;
    const x = Math.round((screen.availWidth - newWidth) / 2);
    const y = Math.round(screen.availHeight * 0.1);
    
    // Only reposition if significantly different
    appWindow.setSize(new LogicalSize(newWidth, newHeight));
    appWindow.setPosition(new LogicalPosition(x, y));
  }
});

// Initialize the app
async function init() {
  await ensureOriginal();
  initTheme();
  
  // Add some nice startup animation
  setTimeout(() => {
    app.style.transition = 'all 0.5s ease';
    app.style.opacity = '1';
  }, 100);
}

// Start the app
init();