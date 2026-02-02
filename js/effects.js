// --- Configuration: Birthday List ---
const TEAM_BIRTHDAYS = [
    { name: "Cleo", date: "03.02" },
    { name: "Admin", date: "20.05" },
];

const RANDOM_GREETINGS = [
    "Wake up,", "Time to cook,", "Lets go,", "Focus,", "Big moves,", "Hello,", "Greetings,", "Good vibes,", "Crypto King,", "Arbitrage God,",
    "Stay sharp,", "Money moves,", "Grind time,", "Lets build,", "Stay hungry,", "Keep pushing,", "Make it happen,", "Level up,", "Be great,", "Dream big,",
    "Work hard,", "Stay humble,", "Be kind,", "Good morning,", "Rise & shine,", "Lets win,", "No limits,", "Stay focused,", "Keep going,", "Never settle,",
    "You got this,", "Believe,", "Execute,", "Dominate,", "Crush it,", "Lets trade,", "Market open,", "New highs,", "Stay green,", "HODL strong,",
    "To the moon,", "Diamond hands,", "Smart money,", "Alpha state,", "Flow state,", "Be legendary,", "Create value,", "Solve problems,", "Think big,", "Action time,",
    "Поехали,", "Тихо, я считаю,", "Зара буде профіт,", "Рахуй, не гадай,", "Все по плану? ", "Шо ти дядя ? "
];


// --- Event Wallpapers (Auto-Applied based on Active Effect) Заготовленные обои для сезонов ---
const EVENT_WALLPAPERS = {
    'snow': { url: 'https://png.klev.club/uploads/posts/2024-06/png-klev-club-ntb1-p-effekt-zamorozki-png-25.png', dimming: 90 },
    'hearts': { url: 'https://cliply.co/wp-content/uploads/2019/02/371901360_HEART_TUNNEL_1x1_400px.gif', dimming: 70 },
    'sakura': { url: 'https://i.pinimg.com/originals/ec/9c/68/ec9c6844d3f505144fe64a77bb62b809.gif', dimming: 80 },
    'party': { url: 'https://i.pinimg.com/originals/00/e8/57/00e857a3c087bfcc085119e0e0aef8e8.gif', dimming: 65 },
    'none': { url: '', dimming: 100 }
};

// --- Event Colors (Dynamic UI Theming) ---
const EVENT_COLORS = {
    'snow': { primary: '#3A7DFF', secondary: '#AEE2FF' },
    'hearts': { primary: '#FF4D4D', secondary: '#FFB3B3' },
    'sakura': { primary: '#FF85A2', secondary: '#FFD1DC' },
    'party': { primary: '#FFD60A', secondary: '#FFF4A3' },
    'none': { primary: '#3A7DFF', secondary: '#2CD4A7' }
};

// --- Seasonal & Birthday Visual Effects System ---

// --- Helper: Check Today's Birthday ---
function checkTodayBirthday() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = `${day}.${month}`;

    const birthday = TEAM_BIRTHDAYS.find(p => p.date === dateStr);
    if (birthday) {
        return { isBirthday: true, person: birthday };
    }
    return { isBirthday: false, person: null };
}

function getAutoSeason() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = `${day}.${month}`;

    const m = now.getMonth();
    const d = now.getDate();
    const h = now.getHours();

    const birthday = TEAM_BIRTHDAYS.find(p => p.date === dateStr);
    if (birthday) return { type: 'party', name: birthday.name };

    // Valentine's
    if (m === 1) {
        if (d === 13 && h >= 18) return { type: 'hearts' };
        if (d === 14) return { type: 'hearts' };
        if (d === 15 && h < 6) return { type: 'hearts' };
    }

    // Winter
    if (m === 11 || m === 0 || m === 1) return { type: 'snow' };
    // Spring
    if (m === 2 || m === 3) return { type: 'sakura' };

    return { type: 'none' };
}

// Update UI theme colors based on active effect
function updateThemeColors(effect) {
    const colors = EVENT_COLORS[effect] || EVENT_COLORS['none'];
    document.documentElement.style.setProperty('--primary-accent', colors.primary);
    document.documentElement.style.setProperty('--secondary-accent', colors.secondary);
}

// FIX: Sync Dimming only if forced (new selection) or first run without stored data
function syncDimmingToPreset(effect, force = false) {
    // If user has a custom wallpaper, never override opacity
    const customWallpaper = localStorage.getItem('calcWallpaper');
    if (customWallpaper) return;

    // Check if we are actually switching effects or just reloading
    const lastEffect = localStorage.getItem('calcLastAppliedEffect');

    // Если эффект тот же, что и был, и это не принудительный сброс (force) — не трогаем настройки юзера
    if (!force && lastEffect === effect) {
        return;
    }

    const preset = EVENT_WALLPAPERS[effect];
    if (preset && typeof preset.dimming !== 'undefined') {
        window.dimmingLevel = preset.dimming;

        // Update UI
        const slider = document.getElementById('dimmingSlider');
        const label = document.getElementById('dimmingValue');
        if (slider) slider.value = window.dimmingLevel;
        if (label) label.textContent = window.dimmingLevel + '%';

        // Apply immediately
        const overlay = document.querySelector('#bg-layer .overlay');
        if (overlay) overlay.style.opacity = window.dimmingLevel / 100;

        // Save
        localStorage.setItem('calcDimming', window.dimmingLevel);
    }
}


function updateWallpaper(currentEffect = 'none') {
    const bgLayer = document.getElementById('bg-layer');
    const overlay = document.querySelector('#bg-layer .overlay');

    if (!bgLayer) return;

    if (window.isPotatoMode) {
        bgLayer.style.backgroundImage = 'none';
        if (overlay) overlay.style.opacity = 0;
        return;
    }

    let backgroundUrl = '';

    if (window.wallpaperUrl && window.wallpaperUrl.trim() !== '') {
        backgroundUrl = window.wallpaperUrl;
    } else if (currentEffect !== 'none') {
        const eventWallpaper = EVENT_WALLPAPERS[currentEffect];
        if (eventWallpaper && eventWallpaper.url) {
            backgroundUrl = eventWallpaper.url;
        }
    }

    if (backgroundUrl) {
        bgLayer.style.backgroundImage = `url('${backgroundUrl}')`;
    } else {
        bgLayer.style.backgroundImage = 'none';
    }

    // Ensure opacity is applied
    if (overlay) {
        overlay.style.opacity = (window.dimmingLevel || 0) / 100;
    }
}

function updateDimming() {
    const overlay = document.querySelector('#bg-layer .overlay');
    const valueDisplay = document.getElementById('dimmingValue');
    if (overlay) overlay.style.opacity = window.dimmingLevel / 100;
    if (valueDisplay) valueDisplay.textContent = `${window.dimmingLevel}%`;
}


// Helper: Detect current active visual effect
function getCurrentEffect() {
    // Simplified checker for internal use
    const auto = getAutoSeason();
    return auto.type;
}

function getEffectFromSettings() {
    const savedPreference = localStorage.getItem('calcSeasonEffect') || 'auto';
    const birthdayCheck = checkTodayBirthday();

    // Birthday overrides manual "Off" check logic handled in applyVisualEffects
    if (birthdayCheck.isBirthday && savedPreference !== 'none') {
        return 'party';
    }

    if (savedPreference !== 'auto') {
        return savedPreference;
    }
    return getCurrentEffect();
}

function clearWallpaper() {
    window.wallpaperUrl = '';
    localStorage.removeItem('calcWallpaper');
    const urlInput = document.getElementById('wallpaperUrl');
    if (urlInput) urlInput.value = '';

    // Re-apply current effect (force sync dimming because custom WP removed)
    const currentEffect = getEffectFromSettings();
    syncDimmingToPreset(currentEffect, true); // Force reset dimming
    updateWallpaper(currentEffect);
    playSound('ui');
}

// Called when user changes dropdown
function toggleVisualEffects(select) {
    playSound('ui');
    window.isVisualEffectsEnabled = select.value;
    localStorage.setItem('calcSeasonEffect', window.isVisualEffectsEnabled);

    // Force apply with sync because user explicitly changed settings
    applyVisualEffects(true);
}

// FIX: Added 'forceSync' parameter
function applyVisualEffects(forceSync = false) {
    const titleEl = document.querySelector('.app-title');
    const select = document.getElementById('seasonSelect');

    if (select) select.value = window.isVisualEffectsEnabled;

    // Cleanup
    if (window.particlesInterval) clearInterval(window.particlesInterval);
    const existingHat = document.querySelector('.seasonal-hat');
    if (existingHat) existingHat.remove();
    createParticles('none'); // Clear particles

    // 1. Check "None"
    if (window.isVisualEffectsEnabled === 'none') {
        updateUserGreeting();
        syncDimmingToPreset('none', forceSync);
        updateWallpaper('none');
        updateThemeColors('none');
        localStorage.setItem('calcLastAppliedEffect', 'none');
        return;
    }

    // 2. Determine Mode
    const birthdayCheck = checkTodayBirthday();
    let mode = window.isVisualEffectsEnabled;
    let currentSeason = { type: 'none' };
    let isBirthdayActive = false;

    if (birthdayCheck.isBirthday) {
        currentSeason = { type: 'party', name: birthdayCheck.person.name };
        mode = 'party';
        isBirthdayActive = true;
        if (titleEl) {
            titleEl.innerHTML = `<span style="color:#FFD60A">${birthdayCheck.person.name}</span> <span style="color:var(--text-color)">Happy Birthday! 🥳</span>`;
        }
    } else {
        updateUserGreeting();
        if (mode === 'auto') {
            currentSeason = getAutoSeason();
            mode = currentSeason.type;
        } else {
            currentSeason = { type: mode };
        }
    }

    // 3. Sync Dimming (Smart)
    syncDimmingToPreset(mode, forceSync);

    // Save current effect as applied
    localStorage.setItem('calcLastAppliedEffect', mode);

    if (mode === 'none') {
        updateWallpaper('none');
        return;
    }

    // 4. Apply Visuals
    // Hat Logic
    let hatType = '';
    switch (mode) {
        case 'party': hatType = 'party'; break;
        case 'snow': hatType = 'santa'; break;
        case 'hearts': hatType = 'heart'; break;
    }

    if (hatType) {
        const letterL = document.querySelector('.brand-letter');
        if (letterL) {
            const hat = document.createElement('div');
            hat.className = 'seasonal-hat';
            hat.style.position = 'absolute';
            hat.style.zIndex = '10';
            hat.style.filter = 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5))';

            if (hatType === 'santa') {
                hat.innerHTML = '🎅';
                hat.style.top = '-10px'; hat.style.left = '-60px'; hat.style.fontSize = '2.5rem';
                hat.style.transform = 'rotate(-20deg)'; hat.style.animation = 'hatBounce 2s infinite ease-in-out';
            } else if (hatType === 'party') {
                hat.innerHTML = '🥳';
                hat.style.top = '-18px'; hat.style.left = '-55px'; hat.style.fontSize = '2.5rem';
                hat.style.transform = 'rotate(-10deg)'; hat.style.animation = 'hatBounce 2s infinite ease-in-out';
            } else if (hatType === 'heart') {
                hat.innerHTML = '💘';
                hat.style.top = '-15px'; hat.style.left = '-35px'; hat.style.fontSize = '1.5rem';
                hat.style.animation = 'hatBounce 2s infinite ease-in-out';
            }
            letterL.appendChild(hat);
        }
    }

    // Particles
    // Check localStorage direct to avoid initialization lag issues
    const potato = localStorage.getItem('calcPotatoMode') === 'true';
    if (!potato) {
        createParticles(mode);
    }

    updateWallpaper(mode);
    updateThemeColors(mode);
    updateDimming(); // Ensure slider value is respected visually
}

function toggleParticles(checkbox) {
    window.isParticlesEnabled = checkbox.checked;
    localStorage.setItem('calcParticlesEnabled', window.isParticlesEnabled);
    playSound('ui');

    if (window.isParticlesEnabled) {
        const effect = getEffectFromSettings();
        applyVisualEffects(false); // Re-apply without forcing dimming reset
    } else {
        const container = document.getElementById('particleContainer');
        if (container) container.innerHTML = '';
    }
}

function createParticles(type) {
    // FIX: Get container dynamically to ensure it exists
    const container = document.getElementById('particleContainer');
    if (!container) return;

    container.innerHTML = '';

    if (type === 'none' || !window.isParticlesEnabled || window.isPotatoMode) return;

    let particles = [];
    if (type === 'snow') particles = ['❄', '❅'];
    else if (type === 'hearts') particles = ['💖', '💕', '💘'];
    else if (type === 'sakura') particles = ['🌸', '💮', '🌺'];
    else if (type === 'party') particles = ['🎉', '✨', '🎈', '🥳'];
    else return;

    for (let i = 0; i < 50; i++) {
        const flake = document.createElement('div');
        flake.classList.add('particle');
        flake.textContent = particles[Math.floor(Math.random() * particles.length)];
        // Random positioning
        flake.style.left = Math.random() * 100 + 'vw';
        // Random fall speed
        flake.style.animationDuration = (Math.random() * 5 + 3) + 's';
        flake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        flake.style.opacity = Math.random() * 0.7 + 0.3;
        flake.style.animationDelay = Math.random() * 5 + 's';

        container.appendChild(flake);
    }
}