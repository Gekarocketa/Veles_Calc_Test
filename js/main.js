// --- URL Cleaner (Post-Reset) ---
if (window.location.search.includes('v=')) {
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
}

// --- 1. Global State Management (VERY TOP) ---
window.particleOpacity = parseInt(localStorage.getItem('calcParticleOpacity')) || 70;
window.isPotatoMode = JSON.parse(localStorage.getItem('calcPotatoMode')) || false;
window.isProFeaturesEnabled = JSON.parse(localStorage.getItem('calcProFeatures')) || false;
window.isMacButtons = JSON.parse(localStorage.getItem('calcMacButtons')) || false;
window.isAutoCopyEnabled = JSON.parse(localStorage.getItem('calcAutoCopy')) || false;
window.dimmingLevel = parseInt(localStorage.getItem('calcDimming')) || 50;
window.wallpaperUrl = localStorage.getItem('calcWallpaper') || '';
window.lastAppliedEffect = localStorage.getItem('calcLastAppliedEffect') || 'none';
window.isRandomGreeting = JSON.parse(localStorage.getItem('calcRandomGreeting')) || false;
window.currentRandomPhrase = localStorage.getItem('calcLastRandomPhrase') || "Hello,";
window.userName = localStorage.getItem('calcUserName') || '';
window.greetingPrefix = localStorage.getItem('calcGreetingPrefix') || '';
window.greetingPos = localStorage.getItem('calcGreetingPos') || 'replace-logo';

window.btcPrice = 0;
window.isSoundEnabled = JSON.parse(localStorage.getItem('calcSoundEnabled')) || false;
window.isParticlesEnabled = JSON.parse(localStorage.getItem('calcParticlesEnabled') ?? 'true');
window.isVisualEffectsEnabled = localStorage.getItem('calcSeasonEffect') || 'auto';
window.historyData = JSON.parse(localStorage.getItem('cryptoCalcHistory')) || [];
window.deltaBaseValue = null;
window.btcFetchInterval = null;
window.isBtcLocked = JSON.parse(localStorage.getItem('calcBtcLock')) || false;

// --- 2. Global DOM Elements ---
window.display = document.getElementById('display');
window.particleContainer = document.getElementById('particleContainer');
window.historyList = document.getElementById('historyList');
window.partnersTable = document.querySelector('.partners-table tbody');
window.displayContainer = document.getElementById('displayContainer');
window.tooltip = document.getElementById('copyTooltip');
window.settingsModal = document.getElementById('settingsModal');


// --- Initialization ---


window.addEventListener('load', () => {
    // Re-bind DOM elements
    window.display = document.getElementById('display');
    window.historyList = document.getElementById('historyList');
    window.partnersTable = document.querySelector('.partners-table tbody');
    window.displayContainer = document.getElementById('displayContainer');
    window.tooltip = document.getElementById('copyTooltip');
    window.particleContainer = document.getElementById('particleContainer');
    window.settingsModal = document.getElementById('settingsModal');

    // Init UI toggles
    const autoCopyToggleEl = document.getElementById('autoCopyToggle');
    const macButtonsToggleEl = document.getElementById('macButtonsToggle');
    const soundToggleEl = document.getElementById('soundToggle');
    const potatoModeToggleEl = document.getElementById('potatoModeToggle');
    const proFeaturesToggleEl = document.getElementById('proFeaturesToggle');
    const particlesToggleEl = document.getElementById('particlesToggle');
    const randomGreetingToggleEl = document.getElementById('randomGreetingToggle');

    if (autoCopyToggleEl) autoCopyToggleEl.checked = window.isAutoCopyEnabled;
    if (macButtonsToggleEl) macButtonsToggleEl.checked = window.isMacButtons;
    if (soundToggleEl) soundToggleEl.checked = window.isSoundEnabled;
    if (potatoModeToggleEl) potatoModeToggleEl.checked = window.isPotatoMode;
    if (proFeaturesToggleEl) proFeaturesToggleEl.checked = window.isProFeaturesEnabled;
    if (particlesToggleEl) particlesToggleEl.checked = window.isParticlesEnabled;

    if (randomGreetingToggleEl) {
        randomGreetingToggleEl.onclick = () => toggleRandomGreeting();
        randomGreetingToggleEl.classList.toggle('active', window.isRandomGreeting);
    }

    // --- EXECUTION ORDER ---

    // 1. Load Data
    loadTableData();

    // 2. Init Controls Listeners
    initVisualCustomization();

    const partSlider = document.getElementById('particleOpacitySlider');
    const partValueText = document.getElementById('particleOpacityValue');

    if (partSlider) {
        partSlider.value = window.particleOpacity;
        if (partValueText) partValueText.textContent = window.particleOpacity + '%';

        partSlider.addEventListener('input', (e) => {
            window.particleOpacity = parseInt(e.target.value);
            localStorage.setItem('calcParticleOpacity', window.particleOpacity);
            if (partValueText) partValueText.textContent = window.particleOpacity + '%';

            // Вызываем функцию мгновенного обновления (создадим её в effects.js)
            if (typeof updateActiveParticlesOpacity === 'function') {
                updateActiveParticlesOpacity();
            }
        });
    }

    // 3. Apply Settings (Potato mode, Mac buttons etc)
    applySettings();
    applyPotatoMode();

    // 4. Apply Pro Features
    applyProFeatures();

    // 5. Update Greeting
    if (window.isRandomGreeting) {
        // Мы не вызываем updateRandomPhrase(), чтобы фраза не менялась при каждом F5 (это бесит)
        // Мы просто берем ту, что сохранили выше.
    }

    // Теперь запускаем визуал. Теперь он не упадет!
    applyVisualEffects(false);

    updateUserGreeting(); // Обновляем текст в заголовке
    renderHistory();

    // 8. BTC Lock UI
    if (typeof updateBtcLockIcon === 'function') updateBtcLockIcon();

    // Force Dimming Update one last time to match slider state
    updateDimming();

    if (window.isRandomGreeting && typeof updateRandomPhrase === 'function') {
        updateRandomPhrase();
    }

    if (document.activeElement) {
        document.activeElement.blur();
    }
    window.focus();



    // Check Eggs
    console.log(
        `%c
                       *     .--.
                            / /  \`
           +               | |
                  '         \\ \\__,
              *          +   '--'  *
                  +   /\\
     +              .'  '.   *
            *      /======\\      +
                  ;:.  _   ;
                  |:. (_)  |
                  |:.  _   |
        +         |:. (_)  |          *
                  ;:.      ;
                .' \\:.    / \`.
               / .-'':._.'\`-. \\
               |/    /||\\    \\|
             _..--"""\`\`\`\`"""--.._
       _.-'\`\`                    \`\`'-._
     -'                                '-

 Типа                              88                                     
                                  88                    ,d               
                                  88                    88               
 8b,dPPYba,  ,adPPYba,   ,adPPYba, 88   ,d8  ,adPPYba, MM88MMM  
 88P'   "Y8 a8"     "8a a8"     "" 88 ,a8"  a8P_____88   88    
 88         8b       d8 8b         8888[    8PP"""""""   88    
 88         "8a,   ,a8" "8a,   ,aa 88\`"Yba, "8b,   ,aa   88,  
 88          \`"YbbdP"'  \`"Ybbd8"'  88   \`Y8a \`"Ybbd8"'   "Y888 🚀
 `,
        'color: #3A7DFF; font-weight: bold; font-family: monospace; font-size: 16px;'
    );
    console.log(
        '%cДарова! это Veles, слеплено все из говна и палок XD, ничего сложного тут не использовалось, практически ванила.\nВсем кискам пис ✌️',
        'background: #222; color: #bada55; padding: 10px; border-radius: 5px; font-size: 14px; font-family: "Segoe UI", sans-serif; border: 1px solid #444;'
    );
    if (typeof checkUpdateNotification === 'function') checkUpdateNotification();

});


// --- Event Listeners Integration ---

function initVisualCustomization() {
    const userNameInput = document.getElementById('userName');
    const greetingPrefixInput = document.getElementById('greetingPrefix');
    const greetingPosInput = document.getElementById('greetingPosition');
    const wallpaperUrlInput = document.getElementById('wallpaperUrl');
    const dimmingSlider = document.getElementById('dimmingSlider');
    const particlesToggle = document.getElementById('particlesToggle');

    if (particlesToggle) {
        particlesToggle.checked = isParticlesEnabled;
    }

    if (userNameInput) {
        userNameInput.value = window.userName;
        userNameInput.addEventListener('input', function (e) {
            window.userName = e.target.value;
            localStorage.setItem('calcUserName', window.userName);
            updateUserGreeting();
        });
    }

    if (greetingPrefixInput) {
        greetingPrefixInput.value = window.greetingPrefix;
        greetingPrefixInput.addEventListener('input', function (e) {
            window.greetingPrefix = e.target.value;
            localStorage.setItem('calcGreetingPrefix', window.greetingPrefix);
            updateUserGreeting();
        });
    }

    if (greetingPosInput) {
        greetingPosInput.value = window.greetingPos;
        greetingPosInput.addEventListener('change', function (e) {
            window.greetingPos = e.target.value;
            localStorage.setItem('calcGreetingPos', window.greetingPos);
            updateUserGreeting();
        });
    }

    if (wallpaperUrlInput) {
        wallpaperUrlInput.value = window.wallpaperUrl;
        wallpaperUrlInput.addEventListener('input', function (e) {
            window.wallpaperUrl = e.target.value;
            localStorage.setItem('calcWallpaper', window.wallpaperUrl);
            const currentEffect = getEffectFromSettings();
            updateWallpaper(currentEffect);
        });
    }

    if (dimmingSlider) {
        dimmingSlider.value = window.dimmingLevel;
        dimmingSlider.addEventListener('input', function (e) {
            window.dimmingLevel = parseInt(e.target.value);
            localStorage.setItem('calcDimming', window.dimmingLevel);

            const valueDisplay = document.getElementById('dimmingValue');
            if (valueDisplay) {
                valueDisplay.textContent = `${window.dimmingLevel}%`;
            }

            const currentEffect = getEffectFromSettings();
            updateWallpaper(currentEffect);
        });
    }

    // Fix: Ensure Dice Button state is synced on load
    const diceBtn = document.getElementById('randomGreetingToggle');
    if (diceBtn) {
        // Remove old listeners to prevent duplicates (though replace handles this)
        diceBtn.onclick = null;
        diceBtn.onclick = (e) => {
            e.preventDefault(); // Prevent potential form submission if inside a form
            toggleRandomGreeting();
        };
        diceBtn.classList.toggle('active', window.isRandomGreeting);
    }

    // Interval: Update Random Greeting every 30 minutes смена времени 
    setInterval(() => {
        if (window.isRandomGreeting) {
            updateRandomPhrase();
        }
    }, 30 * 30 * 1000); // 15 minutes correctly in ms
}

// Click to Copy Listener
if (displayContainer) {
    displayContainer.addEventListener('click', () => {
        playSound('ui'); // Sound Hook
        if (isAutoCopyEnabled) copyToClipboard(display.value);
    });
}

// Global Hotkey Management
document.addEventListener('keydown', (e) => {
    const code = e.code;
    const target = e.target;

    // 1. PRIORITY: Enter -> Calculate (Always, unless editing text)
    if (code === 'Enter') {
        // Exception: If user is typing inside the Help Table (contenteditable) or a Textarea, let Enter create a new line.
        if (target.isContentEditable || target.tagName === 'TEXTAREA') return;

        // Otherwise, ALWAYS prevent default and calculate
        e.preventDefault();

        // CRITICAL FIX: If the focus is on a button, remove focus to stop browser interference (double firing)
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
        }

        calculate();
        playSound('ui'); // Sound Hook (Enter)
        return;
    }

    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable;

    // Rule: Disable general hotkeys while typing in standard inputs, but maintain calculator responsiveness.
    // Main Display ID is 'display'.
    const isTyping = isContentEditable || (isInput && target.id !== 'display');

    // Special Case: "Escape" clears the calculator display even if focused elsewhere (unless editing table).
    if (code === 'Escape') {
        if (!isTyping || target.id === 'display') {
            e.preventDefault();
            clearDisplay();
            playSound('action'); // Sound Hook (Escape)
        }
        return;
    }

    // Global Copy (Ctrl+C / Cmd+C)
    if ((e.ctrlKey || e.metaKey) && code === 'KeyC') {
        // If user has selected text manually (e.g. in table), let browser handle it.
        const selection = window.getSelection().toString();
        if (selection && selection.length > 0) return;

        // Fallback: Copy Calculator Display
        e.preventDefault();
        copyToClipboard(display.value);
        return;
    }

    // Undo (Ctrl+Z)
    if ((e.ctrlKey || e.metaKey) && code === 'KeyZ') {
        e.preventDefault();
        if (lastDisplayState !== null) {
            const temp = display.value;
            display.value = lastDisplayState;
            lastDisplayState = temp; // Allow redo-toggle
            adjustFontSize();
            showTooltip('Undone');
            playSound('ui');
        }
        return;
    }

    // Shortcut Safety:
    // Stop here if any modifier is held (Ctrl/Alt/Meta). 
    // This prevents "Type-to-Focus" from blocking browser shortcuts (e.g. Ctrl+R, Ctrl+Shift+I).
    // We placed this AFTER 'Ctrl+C' because we explicitly want to handle that one.
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Platform-agnostic Hotkey Bindings

    // Delta (KeyD)
    // Exception: Allow "Delta" input if specifically focused on the display.
    if (code === 'KeyD') {
        // If typing in a description or partner name, we need 'D'/'d'.
        if (isTyping && target.id !== 'display') return;

        e.preventDefault();
        inputSymbol(' Δ '); // Add spaces for better selection
        playSound('ui'); // Sound Hook (Delta)
        return;
    }

    // Hotkey Suppression: Prevent accidental triggers while editing text fields.
    // Simplified: if (isContentEditable || isInput) return;

    if (isContentEditable || isInput) return;

    // Feature: Auto-Focus Display on Input
    // Capture global numeric input and redirect to calculator display.
    const key = e.key;

    // Auto-Focus for Math keys
    if (/^[0-9+\-*/%().=,÷×]$/.test(key)) {
        // Fix: Blur any focused button so global generic input works
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
        }

        e.preventDefault();
        display.focus(); // Ensure focus

        // Special mapping for keys that calculate
        if (key === '=' || key === 'Enter') {
            calculate();
            playSound('ui'); // Sound Hook
            return;
        }

        // Normalize symbols
        let char = key;
        // REMOVED: if (char === ',') char = '.';  <-- Allow commas!
        if (char === '÷') char = '/';
        if (char === '×') char = '*';

        inputSymbol(char);
        playSound('click'); // Sound Hook (Typing)
        return;
    }

    // Auto-Focus for Backspace
    if (key === 'Backspace') {
        e.preventDefault();
        display.focus();
        deleteLast();
        playSound('action'); // Sound Hook (Backspace)
        return;
    }

    // Potato Mode (KeyY)
    if (code === 'KeyY') {
        e.preventDefault();
        const checkbox = document.getElementById('potatoModeToggle');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            togglePotatoMode(checkbox);
            playSound('ui'); // Sound Hook
        }
        return;
    }

    // Pro Features (KeyP)
    if (code === 'KeyP') {
        e.preventDefault();
        const checkbox = document.getElementById('proFeaturesToggle');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            toggleProFeatures(checkbox);
            playSound('ui'); // Sound Hook
        }
        return;
    }

    // Mac Button Style (KeyM)
    if (code === 'KeyM') {
        e.preventDefault();
        const checkbox = document.getElementById('macButtonsToggle');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            toggleMacButtons(checkbox);
            playSound('ui'); // Sound Hook
        }
        return;
    }

    // Help Panel (KeyH)
    if (code === 'KeyH') {
        e.preventDefault();
        toggleHelpPanel();
        playSound('ui'); // Sound Hook
        return;
    }

    // Settings Modal (KeyO)
    if (code === 'KeyO') {
        e.preventDefault();
        toggleSettingsModal();
        playSound('ui'); // Sound Hook
        return;
    }
});

// Global Paste Listener 
window.addEventListener('paste', (e) => {
    const target = e.target;

    // 1. Если юзер вставляет текст в таблицу правил или в настройки (имена, ссылки)
    // Мы НЕ должны мешать. Даем браузеру вставить текст стандартно.
    if (target.isContentEditable || (target.tagName === 'INPUT' && target.id !== 'display') || target.tagName === 'TEXTAREA') {
        return;
    }

    // 2. Если мы здесь, значит вставка идет "в калькулятор" (даже если фокус не на поле)
    e.preventDefault();

    // Получаем текст из буфера
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;

    // 3. Санация (Оставляем только цифры, точки, запятые и математические знаки)
    const validCharsRegex = /[^0-9+\-*/%().,÷×Δ\s]/g;
    let cleanText = text.replace(validCharsRegex, '');

    // Нормализация знаков (заменяем визуальные крестики на компьютерные звездочки)
    cleanText = cleanText.replace(/÷/g, '/').replace(/×/g, '*');

    // 4. Вставка в дисплей
    const disp = window.display || document.getElementById('display');
    if (!disp) return;

    // Если фокус не на поле ввода — принудительно ставим его туда
    if (document.activeElement !== disp) {
        disp.focus();
        const len = disp.value.length;
        disp.setSelectionRange(len, len);
    }

    // Используем нашу функцию ввода
    if (typeof inputSymbol === 'function') {
        inputSymbol(cleanText);
    }

    // Обновляем шрифт (из calculator.js)
    if (typeof adjustFontSize === 'function') {
        adjustFontSize();
    }
});
