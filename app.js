/* ============================================
   DAILY STUDY & SKILL TRACKER - MAIN APPLICATION
   Handles localStorage, dynamic updates, and UI interactions
   Includes: Pomodoro Timer, XP System, Search/Filter, Streak Counter, Admin Panel, Theme Manager
   ============================================ */

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================
const STORAGE_KEY = 'studyTrackerData';
const POMODORO_STORAGE_KEY = 'pomodoroTimerState';
const ADMIN_SETTINGS_KEY = 'adminSettings';
const ADMIN_SESSION_KEY = 'adminAuthenticated';
const ADMIN_PASSWORD = 'chulubulu2026'; // Secure admin password
const HABITS_STORAGE_KEY = 'habitsData';
const HABIT_STREAK_STORAGE_KEY = 'habitStreakData';
const CONFIG_STORAGE_KEY = 'userConfig';
const FOCUS_TARGETS_STORAGE_KEY = 'focusTargetsData';
const THEME_STORAGE_KEY = 'themePreference';

const CATEGORY_LIMITS = {
    coding: 10,      // hours
    marketing: 8,    // hours
    school: 12       // hours
};
const CATEGORY_NAMES = {
    coding: 'Coding',
    marketing: 'Marketing',
    school: 'School Subjects'
};
const CATEGORY_ICONS = {
    coding: '💻',
    marketing: '📈',
    school: '📚'
};
const XP_PER_MINUTE = 1; // 1 XP per minute studied

// ============================================
// STATE MANAGEMENT
// ============================================
let appState = {
    logs: [],
    totalHours: 0,
    totalSessions: 0,
    streak: 0,
    totalXP: 0,
    lastActiveDate: null
};

let adminSettings = {
    sidebarAdScript: '',
    bannerAdScript: '',
    noticeText: '',
    noticeEnabled: false
};

// Habit Tracking State
let habitsState = {
    sleep: { completed: false, hours: 0 },
    water: { completed: false, glasses: 0 },
    reading: { completed: false, minutes: 0 },
    exercise: { completed: false, minutes: 0 },
    corework: { completed: false, minutes: 0 },
    food: { completed: false, quality: '' },
    pray: { completed: false, minutes: 0 },
    date: new Date().toDateString()
};

// Habit Streak State (Gamification Engine)
let habitStreakState = {
    currentStreak: 0,
    lastCompletionDate: null,
    completionHistory: [] // Array of date strings
};

// User Configuration State
let userConfig = {
    customSkillName: 'Coding',
    dailyTargetHours: 4,
    dailyTargetMinutes: 0
};

// Focus Targets State (NEW: Per-category daily targets)
let focusTargets = {
    coding: { hours: 2, minutes: 0, enabled: true },
    marketing: { hours: 1, minutes: 0, enabled: true },
    school: { hours: 2, minutes: 0, enabled: true }
};

// Pomodoro Timer State
let pomodoroState = {
    timeLeft: 25 * 60, // 25 minutes in seconds
    isRunning: false,
    intervalId: null,
    totalTime: 25 * 60,
    currentCategory: null // Track which focus target is active
};

// ============================================
// THEME MANAGEMENT (Worker B: Multi-Theme Architecture)
// ============================================
const THEMES = {
    cyberpunk: {
        name: 'Cyberpunk Neon',
        icon: '🌌',
        description: 'Dark teal/purple with neon glow'
    },
    sakura: {
        name: 'Sakura Minimal',
        icon: '🌸',
        description: 'White-and-pink elegant aesthetic'
    },
    lofi: {
        name: 'Cozy Lofi Coffee',
        icon: '☕',
        description: 'Warm brown/amber vintage glow'
    },
    stealth: {
        name: 'Absolute Stealth',
        icon: '🕶️',
        description: 'Pure AMOLED black for late-night coding'
    }
};

let currentTheme = 'cyberpunk';

/**
 * Load theme preference from localStorage
 */
function loadThemePreference() {
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme && THEMES[storedTheme]) {
            currentTheme = storedTheme;
            applyTheme(currentTheme);
        }
    } catch (error) {
        console.error('Error loading theme preference:', error);
    }
}

/**
 * Save theme preference to localStorage
 */
function saveThemePreference(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.error('Error saving theme preference:', error);
    }
}

/**
 * Apply theme to document
 * @param {string} theme - Theme name
 */
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    currentTheme = theme;
    saveThemePreference(theme);
    
    // Update theme toggle button - always show "✨ Theme" label
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        const themeData = THEMES[theme];
        themeBtn.innerHTML = `<span>✨ Theme</span>`;
        themeBtn.title = `${themeData.icon} ${themeData.name}`;
    }
}

/**
 * Cycle to next theme
 */
function cycleTheme() {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    const nextTheme = themeKeys[nextIndex];
    
    applyTheme(nextTheme);
    showToast(`Theme changed to ${THEMES[nextTheme].name}`, 'success', '🎨');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    updateUI();
    initializePomodoro();
    loadAdminSettings();
    checkAdminSession();
    loadAndDisplayAds();
    loadAndDisplayNotice();
    loadHabitsData();
    loadHabitStreakData(); // NEW: Load habit streak data
    loadUserConfig();
    loadFocusTargets(); // NEW: Load focus targets
    loadThemePreference(); // NEW: Load theme preference
    updateHabitsUI();
    updateConfigUI();
    updateFocusTargetsUI(); // NEW: Update focus targets UI
    updateHabitsGraph();
    recalculateStreak(); // NEW: Recalculate streak on load
    createThemeToggleButton(); // NEW: Create theme toggle button
    initializeBackgroundAnimation(); // NEW: Enhanced background animation
});

/**
 * Initialize the application by loading data from localStorage
 */
function initializeApp() {
    loadFromStorage();
    updateDateDisplay();
    calculateStreak();
    renderHistoryTable();
    updateProgressBars();
    updateStatsSummary();
}

/**
 * Setup all event listeners for interactive elements
 */
function setupEventListeners() {
    // Form submission
    const studyForm = document.getElementById('studyLogForm');
    if (studyForm) {
        studyForm.addEventListener('submit', handleFormSubmit);
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', showResetModal);
    }

    // Modal buttons
    const confirmReset = document.getElementById('confirmReset');
    const cancelReset = document.getElementById('cancelReset');
    
    if (confirmReset) {
        confirmReset.addEventListener('click', handleResetConfirm);
    }
    
    if (cancelReset) {
        cancelReset.addEventListener('click', hideResetModal);
    }

    // Close modal on overlay click
    const modalOverlay = document.getElementById('resetModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideResetModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideResetModal();
            hideAdminLoginModal();
        }
    });

    // Pomodoro Timer Controls
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtnTimer = document.getElementById('resetTimer');
    
    if (startBtn) {
        startBtn.addEventListener('click', startPomodoro);
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pausePomodoro);
    }
    
    if (resetBtnTimer) {
        resetBtnTimer.addEventListener('click', resetPomodoro);
    }

    // Search and Filter
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterHistory);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterHistory);
    }

    // Admin Login
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const cancelAdminLogin = document.getElementById('cancelAdminLogin');
    
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', showAdminLoginModal);
    }
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    if (cancelAdminLogin) {
        cancelAdminLogin.addEventListener('click', hideAdminLoginModal);
    }

    // Admin Panel Controls
    const logoutBtn = document.getElementById('logoutBtn');
    const saveAdsBtn = document.getElementById('saveAdsBtn');
    const saveNoticeBtn = document.getElementById('saveNoticeBtn');
    const clearAllDataBtn = document.getElementById('clearAllDataBtn');
    const clearSettingsBtn = document.getElementById('clearSettingsBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    if (saveAdsBtn) {
        saveAdsBtn.addEventListener('click', saveAdvertisements);
    }
    
    if (saveNoticeBtn) {
        saveNoticeBtn.addEventListener('click', saveNotice);
    }
    
    if (clearAllDataBtn) {
        clearAllDataBtn.addEventListener('click', handleClearAllData);
    }
    
    if (clearSettingsBtn) {
        clearSettingsBtn.addEventListener('click', handleResetSettings);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N to focus on topic input
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const topicInput = document.getElementById('topic');
            if (topicInput) {
                topicInput.focus();
            }
        }
    });

    // Setup habit tracking
    setupHabitListeners();
    
    // Setup configuration panel
    setupConfigListeners();
    
    // Setup focus targets panel (FIXED: No cloneNode, proper event binding)
    setupFocusTargetsListeners();
    
    // Initial sync of skill card visibility and target labels
    syncSkillCardVisibility();
    updateSkillCardTargetLabels();
}

// ============================================
// LOCAL STORAGE OPERATIONS
// ============================================

/**
 * Load data from localStorage
 */
function loadFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsed = JSON.parse(storedData);
            appState = {
                logs: parsed.logs || [],
                totalHours: parsed.totalHours || 0,
                totalSessions: parsed.totalSessions || 0,
                streak: parsed.streak || 0,
                totalXP: parsed.totalXP || 0,
                lastActiveDate: parsed.lastActiveDate || null
            };
        }
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        appState = {
            logs: [],
            totalHours: 0,
            totalSessions: 0,
            streak: 0,
            totalXP: 0,
            lastActiveDate: null
        };
    }
}

/**
 * Save data to localStorage
 */
function saveToStorage() {
    try {
        const dataToStore = {
            logs: appState.logs,
            totalHours: appState.totalHours,
            totalSessions: appState.totalSessions,
            streak: appState.streak,
            totalXP: appState.totalXP,
            lastActiveDate: appState.lastActiveDate
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
        alert('Unable to save data. Please check your browser storage settings.');
    }
}

/**
 * Save Pomodoro timer state
 */
function savePomodoroState() {
    try {
        const stateToStore = {
            timeLeft: pomodoroState.timeLeft,
            isRunning: pomodoroState.isRunning,
            totalTime: pomodoroState.totalTime,
            currentCategory: pomodoroState.currentCategory
        };
        localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
        console.error('Error saving Pomodoro state:', error);
    }
}

/**
 * Load Pomodoro timer state
 */
function loadPomodoroState() {
    try {
        const storedState = localStorage.getItem(POMODORO_STORAGE_KEY);
        if (storedState) {
            const parsed = JSON.parse(storedState);
            pomodoroState.timeLeft = parsed.timeLeft || 25 * 60;
            pomodoroState.isRunning = false; // Don't auto-resume
            pomodoroState.totalTime = parsed.totalTime || 25 * 60;
            pomodoroState.currentCategory = parsed.currentCategory || null;
        }
    } catch (error) {
        console.error('Error loading Pomodoro state:', error);
    }
}

// ============================================
// TOAST NOTIFICATION SYSTEM (Worker A: Glassmorphic Toast)
// ============================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'warning', 'error'
 * @param {string} icon - Emoji icon
 */
function showToast(message, type = 'success', icon = '✓') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove toast after animation completes
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// FOCUS TARGETS MANAGEMENT (Worker A & B: Per-Category Targets)
// ============================================

/**
 * Load focus targets from localStorage
 */
function loadFocusTargets() {
    try {
        const storedTargets = localStorage.getItem(FOCUS_TARGETS_STORAGE_KEY);
        if (storedTargets) {
            const parsed = JSON.parse(storedTargets);
            focusTargets = {
                coding: parsed.coding || { hours: 2, minutes: 0, enabled: true },
                marketing: parsed.marketing || { hours: 1, minutes: 0, enabled: true },
                school: parsed.school || { hours: 2, minutes: 0, enabled: true }
            };
        }
    } catch (error) {
        console.error('Error loading focus targets:', error);
    }
}

/**
 * Save focus targets to localStorage
 */
function saveFocusTargets() {
    try {
        localStorage.setItem(FOCUS_TARGETS_STORAGE_KEY, JSON.stringify(focusTargets));
    } catch (error) {
        console.error('Error saving focus targets:', error);
        alert('Unable to save focus targets. Please check your browser storage.');
    }
}

/**
 * Sync DOM input values into focusTargets state
 * Called before save to ensure latest DOM values are captured
 */
function syncFocusTargetsFromDOM() {
    ['coding', 'marketing', 'school'].forEach(category => {
        const hoursInput = document.getElementById(`${category}TargetHours`);
        const minutesInput = document.getElementById(`${category}TargetMinutes`);
        const enabledCheckbox = document.getElementById(`${category}TargetEnabled`);

        if (hoursInput) {
            focusTargets[category].hours = parseFloat(hoursInput.value) || 0;
        }
        if (minutesInput) {
            focusTargets[category].minutes = parseInt(minutesInput.value) || 0;
        }
        if (enabledCheckbox) {
            focusTargets[category].enabled = enabledCheckbox.checked;
        }
    });
}

/**
 * Setup focus targets event listeners - FIXED BINDING
 * 
 * CRITICAL FIX: No cloneNode() usage - that destroys DOM state (checked/unchecked, values).
 * Instead, we use direct event delegation pattern on live elements.
 */
function setupFocusTargetsListeners() {
    // Save button - use direct binding, no clone
    const saveBtn = document.getElementById('saveFocusTargetsBtn');
    if (saveBtn) {
        // Remove any existing listeners by replacing with clone only for save button
        // (Save button doesn't hold visual state so clone is safe here)
        const newBtn = saveBtn.cloneNode(true);
        if (saveBtn.parentNode) {
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        }
        newBtn.addEventListener('click', handleSaveFocusTargets);
    }

    // Setup input listeners for each category - NO cloneNode!
    // We use live event listeners that read the DOM directly on save
    // For live feedback during input, we update state but never clone
    ['coding', 'marketing', 'school'].forEach(category => {
        const hoursInput = document.getElementById(`${category}TargetHours`);
        const minutesInput = document.getElementById(`${category}TargetMinutes`);
        const enabledCheckbox = document.getElementById(`${category}TargetEnabled`);

        // For hours input - update state on change without cloning
        if (hoursInput) {
            // Remove old listener by replacing handler
            hoursInput._listener = function(e) {
                const value = parseFloat(e.target.value) || 0;
                focusTargets[category].hours = value;
            };
            hoursInput.removeEventListener('input', hoursInput._boundListener);
            hoursInput._boundListener = hoursInput._listener;
            hoursInput.addEventListener('input', hoursInput._boundListener);
        }

        // For minutes input - update state on change without cloning
        if (minutesInput) {
            minutesInput._listener = function(e) {
                const value = parseInt(e.target.value) || 0;
                focusTargets[category].minutes = value;
            };
            minutesInput.removeEventListener('input', minutesInput._boundListener);
            minutesInput._boundListener = minutesInput._listener;
            minutesInput.addEventListener('input', minutesInput._boundListener);
        }

        // For enabled checkbox - update state on change without cloning
        if (enabledCheckbox) {
            enabledCheckbox._listener = function(e) {
                focusTargets[category].enabled = e.target.checked;
            };
            enabledCheckbox.removeEventListener('change', enabledCheckbox._boundListener);
            enabledCheckbox._boundListener = enabledCheckbox._listener;
            enabledCheckbox.addEventListener('change', enabledCheckbox._boundListener);
        }
    });
}

/**
 * Handle save focus targets with 1-hour minimum validation
 * FIXED: Now re-syncs from DOM before validation, updates UI after auto-correction,
 * and instantly updates Pomodoro timer
 */
function handleSaveFocusTargets() {
    const MINIMUM_MINUTES = 60; // 1 hour minimum
    let hasValidationError = false;

    // Step 1: Sync latest DOM values into state
    syncFocusTargetsFromDOM();

    // Step 2: Validate and auto-correct
    ['coding', 'marketing', 'school'].forEach(category => {
        const target = focusTargets[category];
        
        // Only validate if the target is enabled
        if (target.enabled) {
            const totalMinutes = (target.hours * 60) + target.minutes;
            
            // Check if less than 1 hour
            if (totalMinutes < MINIMUM_MINUTES) {
                hasValidationError = true;
                
                // Reset to 1 hour minimum
                focusTargets[category].hours = 1;
                focusTargets[category].minutes = 0;
            }
        }
    });

    // Step 3: Re-sync UI with corrected state values
    updateFocusTargetsUI();

    // Step 4: Save to localStorage
    saveFocusTargets();
    
    // Step 5: Update Pomodoro timer with first active category's target
    updatePomodoroFromFocusTargets();
    
    // Step 6: Sync skill card visibility and target labels
    syncSkillCardVisibility();
    updateSkillCardTargetLabels();
    
    // Step 7: Show feedback
    if (hasValidationError) {
        showToast(
            'Each active target requires a minimum of 1 hour. Values have been corrected.',
            'warning',
            '⚠️'
        );
    } else {
        showToast('Focus targets saved successfully!', 'success', '✓');
    }
}

/**
 * Update Pomodoro timer based on active focus targets
 * FIXED: Now ALWAYS syncs the current category and updates display,
 * but only resets timeLeft if the timer is not currently running
 */
function updatePomodoroFromFocusTargets() {
    // Find first active category
    let activeCategory = null;
    ['coding', 'marketing', 'school'].forEach(category => {
        if (focusTargets[category].enabled && !activeCategory) {
            activeCategory = category;
        }
    });

    if (activeCategory) {
        const target = focusTargets[activeCategory];
        const totalMinutes = (target.hours * 60) + target.minutes;
        
        // Update Pomodoro state
        pomodoroState.totalTime = totalMinutes * 60; // Convert to seconds
        pomodoroState.currentCategory = activeCategory;
        
        // Only reset timeLeft if timer is not running
        if (!pomodoroState.isRunning) {
            pomodoroState.timeLeft = pomodoroState.totalTime;
        }
        
        // Update display
        updateTimerDisplay();
        updateTimerProgress();
        updateTimerButtons();
        
        // Save updated state
        savePomodoroState();
        
        // Update status message (only if not running)
        if (!pomodoroState.isRunning) {
            const categoryName = CATEGORY_NAMES[activeCategory];
            updateTimerStatus(`Ready to focus on ${categoryName}? Start your ${target.hours}h ${target.minutes}m session!`);
        }
    }
}

/**
 * Update focus targets UI from state
 */
function updateFocusTargetsUI() {
    ['coding', 'marketing', 'school'].forEach(category => {
        const hoursInput = document.getElementById(`${category}TargetHours`);
        const minutesInput = document.getElementById(`${category}TargetMinutes`);
        const enabledCheckbox = document.getElementById(`${category}TargetEnabled`);

        if (hoursInput) hoursInput.value = focusTargets[category].hours;
        if (minutesInput) minutesInput.value = focusTargets[category].minutes;
        if (enabledCheckbox) enabledCheckbox.checked = focusTargets[category].enabled;
    });
}

// ============================================
// REACTIVE SKILL CARD SYNC (Worker A: Active/Inactive Visibility + Target Labels)
// ============================================

/**
 * Sync skill card visibility based on focus target enabled state
 * INACTIVE → adds .hidden class (display: none)
 * ACTIVE → removes .hidden class (restores view)
 */
function syncSkillCardVisibility() {
    ['coding', 'marketing', 'school'].forEach(category => {
        const skillCard = document.querySelector(`.skill-card[data-category="${category}"]`);
        if (skillCard) {
            if (focusTargets[category].enabled) {
                skillCard.classList.remove('hidden');
            } else {
                skillCard.classList.add('hidden');
            }
        }
    });
}

/**
 * Update skill card target labels to reflect current focus target hours
 * e.g., "0.0h / 10h" → "0.0h / 2h" when target is set to 2 hours
 */
function updateSkillCardTargetLabels() {
    ['coding', 'marketing', 'school'].forEach(category => {
        const target = focusTargets[category];
        const totalHours = target.hours + (target.minutes / 60);
        const targetDisplay = totalHours.toFixed(2).replace(/\.?0+$/, '') + 'h';
        
        const hoursDisplay = document.getElementById(`${category}Hours`);
        if (hoursDisplay) {
            // Parse the current progress (e.g., "0.0h / 10h")
            const currentText = hoursDisplay.textContent;
            const progressMatch = currentText.match(/^([\d.]+h)\s*\/\s*/);
            const progressPart = progressMatch ? progressMatch[1] : '0.0h';
            hoursDisplay.textContent = `${progressPart} / ${targetDisplay}`;
        }
    });
}

// ============================================
// THEME TOGGLE BUTTON (Worker B: Floating Theme Switcher)
// ============================================

/**
 * Create floating theme toggle button
 */
function createThemeToggleButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('themeToggleBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Create button element
    const themeBtn = document.createElement('button');
    themeBtn.id = 'themeToggleBtn';
    themeBtn.className = 'theme-toggle-btn';
    themeBtn.innerHTML = `<span>✨ Theme</span>`;
    themeBtn.title = `${THEMES[currentTheme].icon} ${THEMES[currentTheme].name}`;
    
    // Add click handler
    themeBtn.addEventListener('click', cycleTheme);
    
    // Append to body
    document.body.appendChild(themeBtn);
}

// ============================================
// ADMIN AUTHENTICATION
// ============================================

/**
 * Show admin login modal
 */
function showAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('adminPassword').focus();
    }
}

/**
 * Hide admin login modal
 */
function hideAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('adminPassword').value = '';
    }
}

/**
 * Handle admin login
 * @param {Event} e - Form submit event
 */
function handleAdminLogin(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('adminPassword');
    const enteredPassword = passwordInput ? passwordInput.value : '';
    
    if (enteredPassword === ADMIN_PASSWORD) {
        // Authentication successful
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        hideAdminLoginModal();
        showAdminPanel();
        loadAdminSettingsToForm();
        updateStorageStats();
    } else {
        alert('Invalid admin password! Access denied.');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

/**
 * Check if admin session is active
 */
function checkAdminSession() {
    const isAuthenticated = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (isAuthenticated === 'true') {
        showAdminPanel();
    } else {
        hideAdminPanel();
    }
}

/**
 * Show admin panel
 */
function showAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'block';
    }
}

/**
 * Hide admin panel
 */
function hideAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
}

/**
 * Handle admin logout
 */
function handleAdminLogout() {
    if (confirm('Are you sure you want to logout from admin panel?')) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        hideAdminPanel();
        alert('Logged out successfully!');
    }
}

// ============================================
// ADMIN SETTINGS MANAGEMENT
// ============================================

/**
 * Load admin settings from localStorage
 */
function loadAdminSettings() {
    try {
        const storedSettings = localStorage.getItem(ADMIN_SETTINGS_KEY);
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            adminSettings = {
                sidebarAdScript: parsed.sidebarAdScript || '',
                bannerAdScript: parsed.bannerAdScript || '',
                noticeText: parsed.noticeText || '',
                noticeEnabled: parsed.noticeEnabled || false
            };
        }
    } catch (error) {
        console.error('Error loading admin settings:', error);
    }
}

/**
 * Save admin settings to localStorage
 */
function saveAdminSettings() {
    try {
        localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(adminSettings));
    } catch (error) {
        console.error('Error saving admin settings:', error);
        alert('Unable to save settings. Please check your browser storage.');
    }
}

/**
 * Load admin settings to form fields
 */
function loadAdminSettingsToForm() {
    const sidebarAdScript = document.getElementById('sidebarAdScript');
    const bannerAdScript = document.getElementById('bannerAdScript');
    const noticeText = document.getElementById('noticeText');
    const noticeEnabled = document.getElementById('noticeEnabled');
    
    if (sidebarAdScript) sidebarAdScript.value = adminSettings.sidebarAdScript;
    if (bannerAdScript) bannerAdScript.value = adminSettings.bannerAdScript;
    if (noticeText) noticeText.value = adminSettings.noticeText;
    if (noticeEnabled) noticeEnabled.checked = adminSettings.noticeEnabled;
}

/**
 * Save advertisements
 */
function saveAdvertisements() {
    const sidebarAdScript = document.getElementById('sidebarAdScript');
    const bannerAdScript = document.getElementById('bannerAdScript');
    
    adminSettings.sidebarAdScript = sidebarAdScript ? sidebarAdScript.value : '';
    adminSettings.bannerAdScript = bannerAdScript ? bannerAdScript.value : '';
    
    saveAdminSettings();
    loadAndDisplayAds();
    
    alert('Advertisements saved successfully!');
}

/**
 * Load and display ads
 */
function loadAndDisplayAds() {
    // Display sidebar ad
    const sidebarAdContent = document.getElementById('sidebarAdContent');
    if (sidebarAdContent) {
        if (adminSettings.sidebarAdScript) {
            sidebarAdContent.innerHTML = adminSettings.sidebarAdScript;
        } else {
            sidebarAdContent.innerHTML = `
                <span class="ad-label">Advertisement</span>
                <p>Your ad will appear here</p>
                <small>Paste your Google AdSense or Adsterra script</small>
            `;
        }
    }

    // Display banner ad
    const bannerAdContent = document.getElementById('bannerAdContent');
    if (bannerAdContent) {
        if (adminSettings.bannerAdScript) {
            bannerAdContent.innerHTML = adminSettings.bannerAdScript;
        } else {
            bannerAdContent.innerHTML = `
                <span class="ad-label">Advertisement</span>
                <p>Your ad will appear here</p>
                <small>Paste your Google AdSense or Adsterra script</small>
            `;
        }
    }
}

/**
 * Save notice board
 */
function saveNotice() {
    const noticeText = document.getElementById('noticeText');
    const noticeEnabled = document.getElementById('noticeEnabled');
    
    adminSettings.noticeText = noticeText ? noticeText.value : '';
    adminSettings.noticeEnabled = noticeEnabled ? noticeEnabled.checked : false;
    
    saveAdminSettings();
    loadAndDisplayNotice();
    
    alert('Notice saved successfully!');
}

/**
 * Load and display notice board
 */
function loadAndDisplayNotice() {
    const noticeBoard = document.getElementById('noticeBoard');
    const noticeText = document.getElementById('noticeText');
    
    if (noticeBoard && noticeText) {
        if (adminSettings.noticeEnabled && adminSettings.noticeText) {
            noticeBoard.style.display = 'block';
            noticeText.textContent = adminSettings.noticeText;
        } else {
            noticeBoard.style.display = 'none';
        }
    }
}

/**
 * Update storage statistics
 */
function updateStorageStats() {
    const storageUsed = document.getElementById('storageUsed');
    if (storageUsed) {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length * 2; // UTF-16
            }
        }
        const sizeInKB = (totalSize / 1024).toFixed(2);
        storageUsed.textContent = `${sizeInKB} KB`;
    }
}

/**
 * Handle clear all data
 */
function handleClearAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL user study data including logs, XP, and streak. This action cannot be undone. Are you sure?')) {
        // Clear all localStorage
        localStorage.clear();
        
        // Reset app state
        appState = {
            logs: [],
            totalHours: 0,
            totalSessions: 0,
            streak: 0,
            totalXP: 0,
            lastActiveDate: null
        };
        
        // Reset Pomodoro
        resetPomodoro();
        
        // Update UI
        updateUI();
        updateStorageStats();
        
        alert('All user data has been cleared successfully!');
    }
}

/**
 * Handle reset admin settings only
 */
function handleResetSettings() {
    if (confirm('This will reset all admin settings (ads, notices) to default. Continue?')) {
        adminSettings = {
            sidebarAdScript: '',
            bannerAdScript: '',
            noticeText: '',
            noticeEnabled: false
        };
        
        saveAdminSettings();
        loadAdminSettingsToForm();
        loadAndDisplayAds();
        loadAndDisplayNotice();
        updateStorageStats();
        
        alert('Admin settings reset successfully!');
    }
}

// ============================================
// FORM HANDLING
// ============================================

/**
 * Handle study log form submission
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();

    // Get form values
    const category = document.getElementById('category').value;
    const topic = document.getElementById('topic').value.trim();
    const duration = parseInt(document.getElementById('duration').value);
    const durationUnit = document.getElementById('durationUnit').value;
    const notes = document.getElementById('notes').value.trim();

    // Validate inputs
    if (!category || !topic || !duration || duration <= 0) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    if (duration > 480) {
        alert('Duration cannot exceed 8 hours (480 minutes).');
        return;
    }

    // Convert duration to hours
    const durationInHours = durationUnit === 'hours' ? duration : duration / 60;
    const durationInMinutes = durationUnit === 'hours' ? duration * 60 : duration;

    // Calculate XP (1 XP per minute)
    const xpEarned = Math.round(durationInMinutes * XP_PER_MINUTE);

    // Create log entry
    const logEntry = {
        id: generateUniqueId(),
        category: category,
        topic: topic,
        duration: durationInHours,
        durationDisplay: durationUnit === 'hours' ? `${duration}h` : `${duration}min`,
        notes: notes,
        timestamp: new Date().toISOString(),
        date: formatDate(new Date())
    };

    // Add to state
    appState.logs.unshift(logEntry);
    appState.totalHours += durationInHours;
    appState.totalSessions += 1;
    appState.totalXP += xpEarned;
    appState.lastActiveDate = new Date().toDateString();

    // Save and update UI
    saveToStorage();
    updateUI();
    updateStreak();

    // Show XP floating animation
    showXPFloating(xpEarned);

    // Reset form
    document.getElementById('studyLogForm').reset();

    // Show success feedback
    showSuccessMessage();
}

/**
 * Generate a unique ID for log entries
 * @returns {string} Unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Show success message after adding a log
 */
function showSuccessMessage() {
    const btn = document.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<span>✓ Added Successfully!</span>';
    btn.style.background = 'linear-gradient(135deg, #00ff88, #00cc66)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 2000);
}

/**
 * Show floating XP animation
 * @param {number} xp - XP amount earned
 */
function showXPFloating(xp) {
    const container = document.getElementById('xpFloatingContainer');
    if (!container) return;

    const xpElement = document.createElement('div');
    xpElement.className = 'xp-float';
    xpElement.textContent = `+${xp} XP`;
    
    // Random position near the submit button
    const btn = document.querySelector('.btn-submit');
    const rect = btn.getBoundingClientRect();
    xpElement.style.left = `${rect.left + rect.width / 2}px`;
    xpElement.style.top = `${rect.top}px`;
    
    container.appendChild(xpElement);

    // Remove after animation completes
    setTimeout(() => {
        xpElement.remove();
    }, 2000);
}

// ============================================
// UI UPDATES
// ============================================

/**
 * Update all UI components
 */
function updateUI() {
    updateDateDisplay();
    updateProgressBars();
    updateStatsSummary();
    renderHistoryTable();
}

/**
 * Update the date display in the header
 */
function updateDateDisplay() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

/**
 * Update progress bars for each category
 */
function updateProgressBars() {
    const categoryHours = calculateCategoryHours();

    // Update Coding progress
    updateSingleProgressBar('coding', categoryHours.coding);

    // Update Marketing progress
    updateSingleProgressBar('marketing', categoryHours.marketing);

    // Update School progress
    updateSingleProgressBar('school', categoryHours.school);
}

/**
 * Calculate total hours for each category
 * @returns {Object} Hours per category
 */
function calculateCategoryHours() {
    const hours = {
        coding: 0,
        marketing: 0,
        school: 0
    };

    appState.logs.forEach(log => {
        if (hours.hasOwnProperty(log.category)) {
            hours[log.category] += log.duration;
        }
    });

    return hours;
}

/**
 * Update a single progress bar
 * @param {string} category - Category name
 * @param {number} hours - Hours spent
 */
function updateSingleProgressBar(category, hours) {
    const progressBar = document.getElementById(`${category}Progress`);
    const hoursDisplay = document.getElementById(`${category}Hours`);
    const limit = CATEGORY_LIMITS[category];

    if (progressBar && hoursDisplay) {
        const percentage = Math.min((hours / limit) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        hoursDisplay.textContent = `${hours.toFixed(1)}h / ${limit}h`;
    }
}

/**
 * Update the stats summary in the header
 */
function updateStatsSummary() {
    const totalHoursEl = document.getElementById('totalHours');
    const totalSessionsEl = document.getElementById('totalSessions');
    const currentStreakEl = document.getElementById('currentStreak');
    const totalXPEl = document.getElementById('totalXP');

    if (totalHoursEl) {
        totalHoursEl.textContent = appState.totalHours.toFixed(1);
    }

    if (totalSessionsEl) {
        totalSessionsEl.textContent = appState.totalSessions;
    }

    if (currentStreakEl) {
        currentStreakEl.textContent = appState.streak;
    }

    if (totalXPEl) {
        totalXPEl.textContent = appState.totalXP.toLocaleString();
    }
}

/**
 * Render the history table with all log entries
 */
function renderHistoryTable(logsToRender = null) {
    const tableBody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('emptyState');

    if (!tableBody) return;

    // Clear existing content
    tableBody.innerHTML = '';

    // Use provided logs or default to all logs
    const logs = logsToRender || appState.logs;

    // Show/hide empty state
    if (logs.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }

    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // Render each log entry
    logs.forEach((log, index) => {
        const row = createTableRow(log, index);
        tableBody.appendChild(row);
    });
}

/**
 * Create a table row element for a log entry
 * @param {Object} log - Log entry object
 * @param {number} index - Index for animation delay
 * @returns {HTMLElement} Table row element
 */
function createTableRow(log, index) {
    const row = document.createElement('tr');
    row.style.animationDelay = `${index * 0.05}s`;
    
    const formattedTime = formatTimestamp(log.timestamp);
    const categoryBadge = createCategoryBadge(log.category);
    const notesDisplay = log.notes ? log.notes : '-';

    row.innerHTML = `
        <td>${formattedTime}</td>
        <td>${categoryBadge.outerHTML}</td>
        <td>${escapeHtml(log.topic)}</td>
        <td>${log.durationDisplay}</td>
        <td>${escapeHtml(notesDisplay)}</td>
    `;

    return row;
}

/**
 * Create a category badge element
 * @param {string} category - Category name
 * @returns {HTMLElement} Badge element
 */
function createCategoryBadge(category) {
    const badge = document.createElement('span');
    badge.className = `category-badge ${category}`;
    badge.textContent = `${CATEGORY_ICONS[category]} ${CATEGORY_NAMES[category]}`;
    return badge;
}

/**
 * Format timestamp for display
 * @param {string} isoString - ISO timestamp string
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} min ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(date);
    }
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const options = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// SEARCH & FILTER FUNCTIONALITY
// ============================================

/**
 * Filter history based on search input and category filter
 */
function filterHistory() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const category = categoryFilter ? categoryFilter.value : 'all';

    let filteredLogs = appState.logs;

    // Filter by category
    if (category !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    // Filter by search term
    if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
            log.topic.toLowerCase().includes(searchTerm) ||
            log.notes.toLowerCase().includes(searchTerm) ||
            CATEGORY_NAMES[log.category].toLowerCase().includes(searchTerm)
        );
    }

    renderHistoryTable(filteredLogs);
}

// ============================================
// STREAK CALCULATION
// ============================================

/**
 * Calculate and update study streak
 */
function updateStreak() {
    const today = new Date().toDateString();
    
    if (appState.lastActiveDate === today) {
        // Already active today, streak remains the same
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (appState.lastActiveDate === yesterday.toDateString()) {
        // Active yesterday, increment streak
        appState.streak += 1;
    } else if (appState.lastActiveDate !== today) {
        // Streak broken
        appState.streak = 1;
    }

    appState.lastActiveDate = today;
    saveToStorage();
    updateStatsSummary();
}

/**
 * Calculate streak on app initialization
 */
function calculateStreak() {
    if (!appState.lastActiveDate) {
        appState.streak = 0;
        return;
    }

    const today = new Date().toDateString();
    const lastActive = new Date(appState.lastActiveDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (appState.lastActiveDate === today) {
        // Already active today, keep existing streak
        return;
    } else if (lastActive.toDateString() === yesterday.toDateString()) {
        // Last active was yesterday, keep streak
        return;
    } else {
        // Streak broken
        appState.streak = 0;
    }
}

// ============================================
// POMODORO TIMER FUNCTIONALITY
// ============================================

/**
 * Initialize Pomodoro timer
 * Always starts at 25:00 default baseline on load.
 * Focus target times are only applied when user explicitly clicks "SAVE FOCUS TARGETS".
 */
function initializePomodoro() {
    // Reset to 25-minute default baseline (ignore any previously saved large timer values)
    pomodoroState.timeLeft = 25 * 60;
    pomodoroState.totalTime = 25 * 60;
    pomodoroState.isRunning = false;
    pomodoroState.currentCategory = null;
    if (pomodoroState.intervalId) {
        clearInterval(pomodoroState.intervalId);
        pomodoroState.intervalId = null;
    }
    updateTimerDisplay();
    updateTimerProgress();
    updateTimerButtons();
    updateTimerStatus('Ready to focus? Start your 25-minute session!');
    savePomodoroState();
}

/**
 * Start the Pomodoro timer
 */
function startPomodoro() {
    if (pomodoroState.isRunning) return;

    pomodoroState.isRunning = true;
    updateTimerButtons();
    
    // Update status based on current category
    if (pomodoroState.currentCategory) {
        const target = focusTargets[pomodoroState.currentCategory];
        const categoryName = CATEGORY_NAMES[pomodoroState.currentCategory];
        updateTimerStatus(`Focus time on ${categoryName}! Stay productive! 🎯`);
    } else {
        updateTimerStatus('Focus time! Stay productive! 🎯');
    }

    pomodoroState.intervalId = setInterval(() => {
        pomodoroState.timeLeft--;
        updateTimerDisplay();
        updateTimerProgress();
        savePomodoroState();

        if (pomodoroState.timeLeft <= 0) {
            completePomodoro();
        }
    }, 1000);
}

/**
 * Pause the Pomodoro timer
 */
function pausePomodoro() {
    if (!pomodoroState.isRunning) return;

    pomodoroState.isRunning = false;
    clearInterval(pomodoroState.intervalId);
    updateTimerButtons();
    updateTimerStatus('Timer paused. Take a breath! 😌');
    savePomodoroState();
}

/**
 * Reset the Pomodoro timer
 * ALWAYS resets to the standard 25-minute baseline.
 * Does NOT restore focus target times — those are only applied on explicit "SAVE FOCUS TARGETS".
 */
function resetPomodoro() {
    pomodoroState.isRunning = false;
    clearInterval(pomodoroState.intervalId);
    pomodoroState.intervalId = null;
    
    // Hard reset to 25-minute default baseline
    pomodoroState.timeLeft = 25 * 60;   // 1500 seconds
    pomodoroState.totalTime = 25 * 60;  // 1500 seconds
    pomodoroState.currentCategory = null;
    
    updateTimerDisplay();
    updateTimerProgress();
    updateTimerButtons();
    updateTimerStatus('Ready to focus? Start your 25-minute session!');
    savePomodoroState();
}

/**
 * Complete the Pomodoro session
 */
function completePomodoro() {
    pomodoroState.isRunning = false;
    clearInterval(pomodoroState.intervalId);
    
    updateTimerButtons();
    
    const categoryName = pomodoroState.currentCategory ? 
        CATEGORY_NAMES[pomodoroState.currentCategory] : 'focus';
    
    document.getElementById('timerStatus').classList.add('completed');
    updateTimerStatus(`🎉 Great job! ${categoryName} session complete! Log your study time below.`);

    // Play audio alert
    playCompletionSound();

    // Show notification
    showCompletionNotification();

    // Reset timer for next session
    updatePomodoroFromFocusTargets();
    updateTimerDisplay();
    updateTimerProgress();
    savePomodoroState();

    // Auto-focus on category selector
    setTimeout(() => {
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.focus();
        }
    }, 1000);
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(pomodoroState.timeLeft / 60);
    const seconds = pomodoroState.timeLeft % 60;

    const minutesEl = document.getElementById('timerMinutes');
    const secondsEl = document.getElementById('timerSeconds');

    if (minutesEl) {
        minutesEl.textContent = minutes.toString().padStart(2, '0');
    }
    
    if (secondsEl) {
        secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
}

/**
 * Update timer progress ring
 */
function updateTimerProgress() {
    const progressRing = document.getElementById('timerProgress');
    if (!progressRing) return;

    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pomodoroState.timeLeft / pomodoroState.totalTime) * circumference;

    progressRing.style.strokeDasharray = `${circumference}`;
    progressRing.style.strokeDashoffset = offset;
}

/**
 * Update timer buttons state
 */
function updateTimerButtons() {
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');

    if (startBtn && pauseBtn) {
        startBtn.disabled = pomodoroState.isRunning;
        pauseBtn.disabled = !pomodoroState.isRunning;
    }
}

/**
 * Update timer status message
 * @param {string} message - Status message
 */
function updateTimerStatus(message) {
    const statusEl = document.getElementById('timerStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.classList.remove('completed');
    }
}

/**
 * Play completion sound
 */
function playCompletionSound() {
    try {
        // Create audio context for beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        // Play second beep
        setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            
            oscillator2.frequency.value = 1000;
            oscillator2.type = 'sine';
            
            gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.5);
        }, 200);
    } catch (error) {
        console.log('Audio not supported');
    }
}

/**
 * Show completion notification
 */
function showCompletionNotification() {
    // Check if browser supports notifications
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🍅 Pomodoro Complete!', {
            body: 'Great work! Time to log your study session.',
            icon: '🍅'
        });
    }

    // Also show in-page alert
    setTimeout(() => {
        const logStudy = confirm('🎉 Pomodoro session complete!\n\nWould you like to log your study time now?');
        if (logStudy) {
            const categorySelect = document.getElementById('category');
            const topicInput = document.getElementById('topic');
            const durationInput = document.getElementById('duration');
            
            if (categorySelect && topicInput && durationInput) {
                topicInput.focus();
                // Set duration to the completed focus target time
                if (pomodoroState.currentCategory) {
                    const target = focusTargets[pomodoroState.currentCategory];
                    durationInput.value = (target.hours * 60) + target.minutes;
                } else {
                    durationInput.value = 25;
                }
            }
        }
    }, 500);
}

// ============================================
// RESET FUNCTIONALITY
// ============================================

/**
 * Show the reset confirmation modal
 */
function showResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Hide the reset confirmation modal
 */
function hideResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Handle reset confirmation
 */
function handleResetConfirm() {
    // Clear all data
    appState = {
        logs: [],
        totalHours: 0,
        totalSessions: 0,
        streak: 0,
        totalXP: 0,
        lastActiveDate: null
    };

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(POMODORO_STORAGE_KEY);

    // Reset Pomodoro
    resetPomodoro();

    // Update UI
    updateUI();

    // Hide modal
    hideResetModal();

    // Show confirmation
    alert('All study data has been reset successfully!');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format hours to display string
 * @param {number} hours - Hours value
 * @returns {string} Formatted string
 */
function formatHours(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)}min`;
    } else if (hours === 1) {
        return '1h';
    } else {
        return `${hours.toFixed(1)}h`;
    }
}

/**
 * Get category color based on category name
 * @param {string} category - Category name
 * @returns {string} Color hex code
 */
function getCategoryColor(category) {
    const colors = {
        coding: '#00d4ff',
        marketing: '#ff00ff',
        school: '#00ff88'
    };
    return colors[category] || '#ffffff';
}

// ============================================
// EXPORT FOR TESTING (Optional)
// ============================================

// Expose functions for testing if needed
if (typeof window !== 'undefined') {
    window.StudyTracker = {
        appState,
        adminSettings,
        pomodoroState,
        focusTargets,
        currentTheme,
        THEMES,
        loadFromStorage,
        saveToStorage,
        handleFormSubmit,
        updateUI,
        updateProgressBars,
        renderHistoryTable,
        handleResetConfirm,
        calculateCategoryHours,
        startPomodoro,
        pausePomodoro,
        resetPomodoro,
        filterHistory,
        handleAdminLogin,
        handleAdminLogout,
        saveAdvertisements,
        saveNotice,
        showToast,
        loadFocusTargets,
        saveFocusTargets,
        handleSaveFocusTargets,
        updatePomodoroFromFocusTargets,
        applyTheme,
        cycleTheme,
        loadThemePreference
    };
}

// ============================================
// HABIT TRACKING FUNCTIONALITY (Worker B & D)
// ============================================

/**
 * Load habits data from localStorage
 */
function loadHabitsData() {
    try {
        const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
        if (storedHabits) {
            const parsed = JSON.parse(storedHabits);
            const today = new Date().toDateString();
            
            // Check if habits are from today
            if (parsed.date === today) {
                habitsState = parsed;
            } else {
                // Reset habits for new day
                habitsState.date = today;
                saveHabitsData();
            }
        }
    } catch (error) {
        console.error('Error loading habits data:', error);
    }
}

// ============================================
// HABIT STREAK GAMIFICATION ENGINE (Worker A)
// ============================================

/**
 * Load habit streak data from localStorage
 */
function loadHabitStreakData() {
    try {
        const storedStreak = localStorage.getItem(HABIT_STREAK_STORAGE_KEY);
        if (storedStreak) {
            const parsed = JSON.parse(storedStreak);
            habitStreakState = {
                currentStreak: parsed.currentStreak || 0,
                lastCompletionDate: parsed.lastCompletionDate || null,
                completionHistory: parsed.completionHistory || []
            };
        }
    } catch (error) {
        console.error('Error loading habit streak data:', error);
    }
}

/**
 * Save habit streak data to localStorage
 */
function saveHabitStreakData() {
    try {
        localStorage.setItem(HABIT_STREAK_STORAGE_KEY, JSON.stringify(habitStreakState));
    } catch (error) {
        console.error('Error saving habit streak data:', error);
    }
}

/**
 * Check if today has at least one habit completed
 * @returns {boolean} True if at least one habit is completed today
 */
function isTodaySuccessful() {
    const habits = ['sleep', 'water', 'reading', 'exercise', 'corework', 'food', 'pray'];
    return habits.some(habit => habitsState[habit] && habitsState[habit].completed);
}

/**
 * Check if a specific date has completion recorded
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if date is in completion history
 */
function hasCompletionOnDate(dateString) {
    return habitStreakState.completionHistory.includes(dateString);
}

/**
 * Add today to completion history if not already present
 */
function recordTodayCompletion() {
    const today = new Date().toDateString();
    if (!hasCompletionOnDate(today)) {
        habitStreakState.completionHistory.push(today);
        // Keep only last 365 days to prevent storage bloat
        if (habitStreakState.completionHistory.length > 365) {
            habitStreakState.completionHistory = habitStreakState.completionHistory.slice(-365);
        }
    }
}

/**
 * Recalculate streak based on completion history
 * Uses cron-like logic: checks for gaps > 48 hours
 */
function recalculateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    // If already completed today, ensure it's recorded
    if (isTodaySuccessful()) {
        recordTodayCompletion();
    }

    // If no completion history, streak is 0
    if (habitStreakState.completionHistory.length === 0) {
        habitStreakState.currentStreak = 0;
        habitStreakState.lastCompletionDate = null;
        saveHabitStreakData();
        updateStreakDisplay();
        return;
    }

    // Get the most recent completion date
    const lastCompletion = habitStreakState.completionHistory[habitStreakState.completionHistory.length - 1];
    const lastCompletionDate = new Date(lastCompletion);
    const todayDate = new Date(today);

    // Calculate days since last completion
    const daysSinceLastCompletion = Math.floor((todayDate - lastCompletionDate) / (1000 * 60 * 60 * 24));

    // Streak break check: if gap > 48 hours (2 full days), reset streak
    if (daysSinceLastCompletion > 2) {
        // Streak broken
        habitStreakState.currentStreak = 0;
        habitStreakState.lastCompletionDate = null;
        habitStreakState.completionHistory = habitStreakState.completionHistory.filter(date => {
            const d = new Date(date);
            const diff = Math.floor((todayDate - d) / (1000 * 60 * 60 * 24));
            return diff <= 1; // Keep only today and yesterday
        });
    } else if (daysSinceLastCompletion <= 1) {
        // Completed today or yesterday - calculate current streak
        let streak = 0;
        const sortedHistory = [...habitStreakState.completionHistory].sort().reverse();
        
        // Count consecutive days backwards from today
        const checkDate = new Date(todayDate);
        for (let i = 0; i < sortedHistory.length; i++) {
            const checkDateString = checkDate.toDateString();
            if (hasCompletionOnDate(checkDateString)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Check if yesterday was missed (grace period)
                if (i === 0 && daysSinceLastCompletion === 1) {
                    // Yesterday was completed, continue counting
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        
        habitStreakState.currentStreak = streak;
        habitStreakState.lastCompletionDate = lastCompletion;
    } else {
        // Gap of exactly 2 days - reset streak but keep today if completed
        if (isTodaySuccessful()) {
            habitStreakState.currentStreak = 1;
            habitStreakState.lastCompletionDate = today;
        } else {
            habitStreakState.currentStreak = 0;
            habitStreakState.lastCompletionDate = null;
        }
    }

    saveHabitStreakData();
    updateStreakDisplay();
}

/**
 * Update the streak display in the DOM
 */
function updateStreakDisplay() {
    const streakEl = document.getElementById('currentStreak');
    if (streakEl) {
        streakEl.textContent = habitStreakState.currentStreak;
    }
}

/**
 * Handle habit completion change and update streak
 * @param {Event} e - Change event from checkbox
 */
function handleHabitToggle(e) {
    const checkbox = e.target;
    const habitType = checkbox.id.replace('habit-', '');
    
    habitsState[habitType].completed = checkbox.checked;
    saveHabitsData();
    updateHabitsUI();
    updateHabitsGraph();
    
    // Trigger streak recalculation
    recalculateStreak();
}

/**
 * Save habits data to localStorage
 */
function saveHabitsData() {
    try {
        localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habitsState));
    } catch (error) {
        console.error('Error saving habits data:', error);
    }
}

/**
 * Setup habit checkbox event listeners
 */
function setupHabitListeners() {
    const habitCheckboxes = document.querySelectorAll('.habit-checkbox');
    habitCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleHabitToggle);
    });

    // Habit detail inputs
    const sleepHours = document.getElementById('sleep-hours');
    const waterGlasses = document.getElementById('water-glasses');
    const readingMinutes = document.getElementById('reading-minutes');
    const exerciseMinutes = document.getElementById('exercise-minutes');
    const coreworkMinutes = document.getElementById('corework-minutes');
    const foodQuality = document.getElementById('food-quality');
    const prayMinutes = document.getElementById('pray-minutes');

    if (sleepHours) sleepHours.addEventListener('input', () => updateHabitDetail('sleep', 'hours', sleepHours.value));
    if (waterGlasses) waterGlasses.addEventListener('input', () => updateHabitDetail('water', 'glasses', waterGlasses.value));
    if (readingMinutes) readingMinutes.addEventListener('input', () => updateHabitDetail('reading', 'minutes', readingMinutes.value));
    if (exerciseMinutes) exerciseMinutes.addEventListener('input', () => updateHabitDetail('exercise', 'minutes', exerciseMinutes.value));
    if (coreworkMinutes) coreworkMinutes.addEventListener('input', () => updateHabitDetail('corework', 'minutes', coreworkMinutes.value));
    if (foodQuality) foodQuality.addEventListener('change', () => updateHabitDetail('food', 'quality', foodQuality.value));
    if (prayMinutes) prayMinutes.addEventListener('input', () => updateHabitDetail('pray', 'minutes', prayMinutes.value));
}

/**
 * Handle habit checkbox toggle
 * @param {Event} e - Change event
 */
function handleHabitToggle(e) {
    const checkbox = e.target;
    const habitType = checkbox.id.replace('habit-', '');
    
    habitsState[habitType].completed = checkbox.checked;
    saveHabitsData();
    updateHabitsUI();
    updateHabitsGraph();
    
    // Trigger streak recalculation
    recalculateStreak();
}

/**
 * Update habit detail value
 * @param {string} habit - Habit type
 * @param {string} field - Field name
 * @param {string} value - Input value
 */
function updateHabitDetail(habit, field, value) {
    habitsState[habit][field] = field === 'quality' ? value : parseFloat(value) || 0;
    saveHabitsData();
    updateHabitsUI();
    updateHabitsGraph();
    
    // Trigger streak recalculation when habit details are updated
    recalculateStreak();
}

/**
 * Update habits UI based on state
 */
function updateHabitsUI() {
    // Update checkboxes
    Object.keys(habitsState).forEach(habit => {
        if (habit !== 'date') {
            const checkbox = document.getElementById(`habit-${habit}`);
            if (checkbox && habitsState[habit].completed !== undefined) {
                checkbox.checked = habitsState[habit].completed;
                
                // Update item styling
                const habitItem = checkbox.closest('.habit-item');
                if (habitItem) {
                    if (habitsState[habit].completed) {
                        habitItem.classList.add('completed');
                    } else {
                        habitItem.classList.remove('completed');
                    }
                }
            }
        }
    });

    // Update detail inputs
    const sleepHours = document.getElementById('sleep-hours');
    const waterGlasses = document.getElementById('water-glasses');
    const readingMinutes = document.getElementById('reading-minutes');
    const exerciseMinutes = document.getElementById('exercise-minutes');
    const coreworkMinutes = document.getElementById('corework-minutes');
    const foodQuality = document.getElementById('food-quality');
    const prayMinutes = document.getElementById('pray-minutes');

    if (sleepHours) sleepHours.value = habitsState.sleep.hours || '';
    if (waterGlasses) waterGlasses.value = habitsState.water.glasses || '';
    if (readingMinutes) readingMinutes.value = habitsState.reading.minutes || '';
    if (exerciseMinutes) exerciseMinutes.value = habitsState.exercise.minutes || '';
    if (coreworkMinutes) coreworkMinutes.value = habitsState.corework.minutes || '';
    if (foodQuality) foodQuality.value = habitsState.food.quality || '';
    if (prayMinutes) prayMinutes.value = habitsState.pray.minutes || '';

    // Update summary
    updateHabitsSummary();
}

/**
 * Update habits summary statistics
 */
function updateHabitsSummary() {
    const habits = ['sleep', 'water', 'reading', 'exercise', 'corework', 'food', 'pray'];
    const completed = habits.filter(h => habitsState[h].completed).length;
    const total = habits.length;
    const rate = Math.round((completed / total) * 100);

    const completedEl = document.getElementById('habitsCompleted');
    const rateEl = document.getElementById('habitsRate');

    if (completedEl) completedEl.textContent = `${completed}/${total}`;
    if (rateEl) rateEl.textContent = `${rate}%`;
}

/**
 * Update habits graph with weekly data
 */
function updateHabitsGraph() {
    // Simulate weekly data based on current habits completion
    const habits = ['sleep', 'water', 'reading', 'exercise', 'corework', 'food', 'pray'];
    const completedToday = habits.filter(h => habitsState[h].completed).length;
    const todayRate = (completedToday / habits.length) * 100;
    
    // Generate simulated weekly data (in real app, this would come from stored history)
    const weeklyData = generateWeeklyData(todayRate);
    
    // Update SVG graph
    const dataLine = document.getElementById('habitsDataLine');
    const dataPoints = document.getElementById('habitsDataPoints');
    const dataArea = document.getElementById('habitsDataArea');
    
    if (dataLine && dataPoints && dataArea) {
        const points = weeklyData.map((value, index) => {
            const x = 90 + (index * 90);
            const y = 250 - (value * 2); // Convert percentage to Y coordinate
            return `${x},${y}`;
        }).join(' ');

        // Update line
        dataLine.setAttribute('points', points);

        // Update data points
        const circles = dataPoints.querySelectorAll('circle');
        weeklyData.forEach((value, index) => {
            if (circles[index]) {
                const x = 90 + (index * 90);
                const y = 250 - (value * 2);
                circles[index].setAttribute('cx', x);
                circles[index].setAttribute('cy', y);
                
                // Color based on completion
                if (value >= 80) {
                    circles[index].setAttribute('fill', '#00ff88');
                } else if (value >= 50) {
                    circles[index].setAttribute('fill', '#00d4ff');
                } else {
                    circles[index].setAttribute('fill', '#ff00ff');
                }
            }
        });

        // Update area under curve
        const areaPoints = `${points} 630,250 90,250`;
        dataArea.setAttribute('points', areaPoints);
    }
}

/**
 * Generate simulated weekly data
 * @param {number} todayRate - Today's completion rate
 * @returns {Array} Weekly completion percentages
 */
function generateWeeklyData(todayRate) {
    const data = [];
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    for (let i = 0; i < 7; i++) {
        if (i < today) {
            // Past days - random data
            data.push(Math.floor(Math.random() * 40) + 60); // 60-100%
        } else if (i === today) {
            // Today
            data.push(todayRate);
        } else {
            // Future days - empty
            data.push(0);
        }
    }
    
    return data;
}

// ============================================
// DYNAMIC TARGET CONFIGURATION (Worker A & D)
// ============================================

/**
 * Load user configuration from localStorage
 */
function loadUserConfig() {
    try {
        const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            userConfig = {
                customSkillName: parsed.customSkillName || 'Coding',
                dailyTargetHours: parsed.dailyTargetHours || 4,
                dailyTargetMinutes: parsed.dailyTargetMinutes || 0
            };
        }
    } catch (error) {
        console.error('Error loading user config:', error);
    }
}

/**
 * Save user configuration to localStorage
 */
function saveUserConfig() {
    try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(userConfig));
    } catch (error) {
        console.error('Error saving user config:', error);
        alert('Unable to save configuration. Please check your browser storage.');
    }
}

/**
 * Setup configuration panel listeners
 */
function setupConfigListeners() {
    const customSkillName = document.getElementById('customSkillName');
    const dailyTargetHours = document.getElementById('dailyTargetHours');
    const dailyTargetMinutes = document.getElementById('dailyTargetMinutes');
    const saveConfigBtn = document.getElementById('saveConfigBtn');

    if (customSkillName) {
        customSkillName.addEventListener('input', (e) => {
            userConfig.customSkillName = e.target.value || 'Coding';
        });
    }

    if (dailyTargetHours) {
        dailyTargetHours.addEventListener('input', (e) => {
            userConfig.dailyTargetHours = parseFloat(e.target.value) || 0;
        });
    }

    if (dailyTargetMinutes) {
        dailyTargetMinutes.addEventListener('input', (e) => {
            userConfig.dailyTargetMinutes = parseInt(e.target.value) || 0;
        });
    }

    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', () => {
            saveUserConfig();
            updateConfigUI();
            updateSkillCards();
            showToast('Configuration saved successfully!', 'success', '✓');
        });
    }
}

/**
 * Update configuration UI
 */
function updateConfigUI() {
    const customSkillName = document.getElementById('customSkillName');
    const dailyTargetHours = document.getElementById('dailyTargetHours');
    const dailyTargetMinutes = document.getElementById('dailyTargetMinutes');

    if (customSkillName) customSkillName.value = userConfig.customSkillName;
    if (dailyTargetHours) dailyTargetHours.value = userConfig.dailyTargetHours;
    if (dailyTargetMinutes) dailyTargetMinutes.value = userConfig.dailyTargetMinutes;
}

/**
 * Update skill cards with custom skill name
 */
function updateSkillCards() {
    const coreWorkLabel = document.getElementById('coreWorkLabel');
    if (coreWorkLabel) {
        coreWorkLabel.textContent = userConfig.customSkillName;
    }

    // Update coding card title
    const codingCard = document.querySelector('.coding-card h3');
    if (codingCard && userConfig.customSkillName !== 'Coding') {
        codingCard.textContent = userConfig.customSkillName;
    }
}

// ============================================
// ENHANCED BACKGROUND ANIMATION (Worker B: Interactive Mouse-Follow Glow)
// ============================================

/**
 * Initialize enhanced background animation with mouse-follow glow effect
 */
function initializeBackgroundAnimation() {
    const mouseGlow = document.getElementById('bgMouseGlow');
    if (!mouseGlow) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    const smoothFactor = 0.1; // Lower = smoother/slower follow

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth animation loop for mouse glow
    function animateMouseGlow() {
        // Smooth interpolation towards mouse position
        currentX += (mouseX - currentX) * smoothFactor;
        currentY += (mouseY - currentY) * smoothFactor;

        // Update glow position
        mouseGlow.style.left = `${currentX}px`;
        mouseGlow.style.top = `${currentY}px`;

        // Continue animation loop
        requestAnimationFrame(animateMouseGlow);
    }

    // Start animation
    animateMouseGlow();

    // Add subtle parallax effect to blobs based on mouse position
    const blobs = document.querySelectorAll('.bg-blob');
    
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

        // Apply different parallax intensities to different layers
        blobs.forEach((blob, index) => {
            const layer = blob.classList.contains('layer-back') ? 0 :
                         blob.classList.contains('layer-middle') ? 1 : 2;
            
            // Back layer moves least, front layer moves most
            const intensity = (layer + 1) * 5; // 5, 10, 15 pixels max movement
            const moveX = x * intensity;
            const moveY = y * intensity;

            // Get current animation state and add parallax offset
            const currentTransform = blob.style.transform || '';
            // We use CSS custom properties for parallax to not interfere with animations
            blob.style.setProperty('--parallax-x', `${moveX}px`);
            blob.style.setProperty('--parallax-y', `${moveY}px`);
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        // Reset mouse position on resize to prevent glow from being off-screen
        mouseX = window.innerWidth / 2;
        mouseY = window.innerHeight / 2;
    });

    console.log('✨ Enhanced background animation initialized with mouse-follow glow');
}

// ============================================
// THREE.JS 3D CANVAS (Worker A: Three.js/Core Logic)
// ============================================

/**
 * Initialize Three.js 3D background scene
 * Optimized for performance with mobile GPU/CPU considerations
 */
function initializeThreeJS() {
    const canvas = document.getElementById('threejs-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // Performance optimization: Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowPerfDevice = isMobile || window.innerWidth < 768;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Optimized renderer for performance
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: !isLowPerfDevice, // Disable antialiasing on mobile
        powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    // Limit pixel ratio to 2 for performance (prevents 3x/4x on high-DPI mobile)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create interactive 3D learning object (floating knowledge orb)
    // Reduced geometry complexity on mobile
    const geometry = new THREE.IcosahedronGeometry(isLowPerfDevice ? 1.5 : 2, isLowPerfDevice ? 0 : 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: isLowPerfDevice ? 0.2 : 0.3,
        shininess: isLowPerfDevice ? 50 : 100,
        transparent: true,
        opacity: isLowPerfDevice ? 0.6 : 0.8,
        wireframe: false
    });

    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);

    // Add wireframe overlay (skip on low-perf devices)
    if (!isLowPerfDevice) {
        const wireframeGeometry = new THREE.IcosahedronGeometry(2.1, 1);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        orb.add(wireframe);
    }

    // Add particle system (floating knowledge points)
    // Reduce particle count on mobile for performance
    const particlesCount = isLowPerfDevice ? 100 : 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: isLowPerfDevice ? 0.03 : 0.05,
        color: 0xff00ff,
        transparent: true,
        opacity: isLowPerfDevice ? 0.4 : 0.6
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Lighting (reduced intensity on mobile)
    const ambientLight = new THREE.AmbientLight(0xffffff, isLowPerfDevice ? 0.3 : 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, isLowPerfDevice ? 1 : 2, isLowPerfDevice ? 30 : 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, isLowPerfDevice ? 1 : 2, isLowPerfDevice ? 30 : 50);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    if (!isLowPerfDevice) {
        const pointLight3 = new THREE.PointLight(0x00ff88, 1.5, 50);
        pointLight3.position.set(0, 5, -5);
        scene.add(pointLight3);
    }

    // Camera position
    camera.position.z = isLowPerfDevice ? 5 : 6;

    // Mouse interaction (throttled on mobile)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let lastMouseUpdate = 0;
    const mouseUpdateThrottle = isLowPerfDevice ? 50 : 16; // ~30fps on mobile, ~60fps on desktop

    document.addEventListener('mousemove', (event) => {
        const now = Date.now();
        if (now - lastMouseUpdate > mouseUpdateThrottle) {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            lastMouseUpdate = now;
        }
    });

    // Handle window resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, 250);
    });

    // Animation loop with performance optimizations
    let animationId;
    let lastFrameTime = 0;
    const targetFPS = isLowPerfDevice ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    let isPageVisible = true;

    // Pause animation when page is not visible (saves CPU/GPU)
    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        if (isPageVisible && !animationId) {
            lastFrameTime = performance.now();
            animate(lastFrameTime);
        }
    });

    function animate(currentTime) {
        // Throttle frame rate for performance
        const elapsed = currentTime - lastFrameTime;
        
        if (elapsed > frameInterval) {
            lastFrameTime = currentTime - (elapsed % frameInterval);

            // Smooth rotation (reduced speed on mobile)
            const rotationSpeed = isLowPerfDevice ? 0.002 : 0.005;
            const mouseInfluence = isLowPerfDevice ? 0.3 : 0.5;
            
            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            orb.rotation.x += rotationSpeed;
            orb.rotation.y += rotationSpeed * 2;
            orb.rotation.x += targetY * mouseInfluence;
            orb.rotation.y += targetX * mouseInfluence;

            // Animate particles (slower on mobile)
            const particleSpeed = isLowPerfDevice ? 0.0002 : 0.0005;
            particlesMesh.rotation.y += particleSpeed;
            particlesMesh.rotation.x += particleSpeed * 0.4;

            // Pulsing effect (skip on mobile for performance)
            if (!isLowPerfDevice) {
                const scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
                orb.scale.set(scale, scale, scale);
            }

            // Render scene
            renderer.render(scene, camera);
        }

        // Continue animation loop
        if (isPageVisible) {
            animationId = requestAnimationFrame(animate);
        } else {
            animationId = null;
        }
    }

    // Start animation
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(animate);

    // Store reference for cleanup if needed
    window.threeJSInitialized = true;
    window.threeJSCleanup = () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        if (particlesGeometry) particlesGeometry.dispose();
        if (particlesMaterial) particlesMaterial.dispose();
    };
}

// Initialize Three.js after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThreeJS);
} else {
    initializeThreeJS();
}

console.log('🚀 Daily Study & Skill Tracker initialized successfully!');
console.log('🍅 Pomodoro Timer ready!');
console.log('⚙️ Admin Panel available at footer');
console.log('🎨 Three.js 3D Canvas active');
console.log('🎯 Daily Focus Targets system active');
console.log('🌓 Theme Manager active - Click ✨ Theme button to switch!');