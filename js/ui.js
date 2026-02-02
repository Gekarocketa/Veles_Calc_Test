function toggleHelpPanel() {
    const helpPanel = document.getElementById('helpPanel');
    const floatingControls = document.getElementById('floatingControls');
    const toggleText = document.getElementById('helpToggleText');

    helpPanel.classList.toggle('hidden');
    const isHidden = helpPanel.classList.contains('hidden');

    if (isHidden) {
        toggleText.textContent = 'Show Help';
        floatingControls.classList.remove('panel-open-state');
    } else {
        toggleText.textContent = 'Hide';
        floatingControls.classList.add('panel-open-state');
    }
    playSound('ui'); // Sound Hook
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    historyList.innerHTML = '';
    window.historyData.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';

        // Delta Logic
        const isDelta = item.isDelta || (typeof item.res === 'string' && item.res.includes('%') && (item.expr.includes('Δ') || item.expr.includes('Delta')));
        const resClass = isDelta ? 'history-res history-res-delta' : 'history-res';

        // Mac Theme Logic
        const isMac = document.body.getAttribute('data-btn-style') === 'mac';
        const colorStyle = (isDelta && isMac) ? 'style="color: #FF9F0A"' : '';

        li.innerHTML = `
        <div style="display:flex; flex-direction:column; width:100%">
            <span class="history-expr" title="Click to edit formula">${item.expr}</span>
            <div class="history-meta">
                <span class="${resClass}" ${colorStyle}>= ${item.res}</span>
                <span class="history-time">${item.time}</span>
            </div>
        </div>
        `;
        li.onclick = () => {
            window.display.value = item.expr;
            window.display.focus();
        };
        historyList.appendChild(li);
    });
}

function toggleMacButtons(checkbox) {
    window.isMacButtons = checkbox.checked;
    localStorage.setItem('calcMacButtons', JSON.stringify(window.isMacButtons));
    applySettings();

    // Real-time Update
    if (typeof applyMacThemeToNewElements === 'function') applyMacThemeToNewElements();

    // Force color update if Visual Effects logic depends on it, or just re-render
    if (typeof updateThemeColors === 'function') {
        const currentEffect = (typeof getEffectFromSettings === 'function') ? getEffectFromSettings() : 'auto';
        updateThemeColors(currentEffect);
    }

    renderHistory(); // Re-render history to apply colors
    playSound('ui');
}

function applySettings() {
    document.body.setAttribute('data-btn-style', window.isMacButtons ? 'mac' : 'default');
}

function toggleAutoCopy(checkbox) {
    window.isAutoCopyEnabled = checkbox.checked;
    localStorage.setItem('calcAutoCopy', JSON.stringify(window.isAutoCopyEnabled));
}

function toggleSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const updateModal = document.getElementById('updateModal'); // Добавляем проверку
    const overlay = document.getElementById('modalOverlay');

    // БЛОКИРОВКА: Если окно обновления сейчас на экране, не даем открыть настройки
    if (updateModal && !updateModal.classList.contains('hidden')) {
        return;
    }

    modal.classList.toggle('hidden');
    overlay.classList.toggle('hidden');
    playSound('ui');
}

function hardRefresh() {
    // Factory Reset Logic
    if (confirm("This will clear ALL saved data (Partners, Settings) to fix bugs and download the latest version.\n\nContinue?")) {
        localStorage.clear();
        sessionStorage.clear();

        // Aggressive Force Update
        const url = new URL(window.location.href);
        url.searchParams.set('v', Date.now()); // Add unique version param
        window.history.replaceState(null, null, url); // Update URL without reloading yet
        window.location.reload(true); // Force reload from server
    }
}

function switchSettingsTab(tabName) {
    const modal = document.querySelector('.settings-modal');
    const currentHeight = modal.getBoundingClientRect().height;

    // 1. Lock Height
    modal.style.height = currentHeight + 'px';

    // Hide all content sections
    document.querySelectorAll('.settings-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Remove active from all tabs
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show target content
    const targetContent = document.getElementById(`settings-${tabName}`);
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }

    // Mark tab as active
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // 3. Calculate New Height (Force Reflow)
    modal.style.height = 'auto';
    const targetHeight = modal.getBoundingClientRect().height;

    // Reset to current height to animate from
    modal.style.height = currentHeight + 'px';
    void modal.offsetHeight; // Force Reflow

    // Animate to target
    modal.style.height = targetHeight + 'px';

    // 4. Cleanup after transition
    modal.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'height') {
            modal.style.height = 'auto'; // Release height for responsiveness
            modal.removeEventListener('transitionend', handler);
        }
    }, { once: true });

    playSound('ui');
}

function toggleRandomGreeting() {
    window.isRandomGreeting = !window.isRandomGreeting;
    localStorage.setItem('calcRandomGreeting', JSON.stringify(window.isRandomGreeting));

    const btn = document.getElementById('randomGreetingToggle');
    if (btn) btn.classList.toggle('active', window.isRandomGreeting);

    if (window.isRandomGreeting) {
        updateRandomPhrase();
    } else {
        updateUserGreeting();
    }

    // Disable/Enable the prefix input visually
    const prefixInput = document.getElementById('greetingPrefix');
    if (prefixInput) {
        prefixInput.disabled = window.isRandomGreeting;
        prefixInput.style.opacity = window.isRandomGreeting ? '0.5' : '1';
    }

    // Explicit update to force saving state if needed
    if (window.isRandomGreeting) {
        localStorage.setItem('calcLastRandomPhrase', window.currentRandomPhrase);
    }

    playSound('ui');
}

function updateRandomPhrase() {
    const index = Math.floor(Math.random() * RANDOM_GREETINGS.length);
    window.currentRandomPhrase = RANDOM_GREETINGS[index];
    localStorage.setItem('calcLastRandomPhrase', window.currentRandomPhrase);
    updateUserGreeting();
}

// Helper: Format text with dual-color split
function formatDualColorTitle(text) {
    const words = text.trim().split(/\s+/);

    if (words.length === 1) {
        // Single word - wrap in accent color
        return `<span class="title-exchange">${words[0]}</span>`;
    } else {
        // Multiple words - split roughly in half
        const splitIndex = Math.floor(words.length / 2);
        const leftPart = words.slice(0, splitIndex).join(' ');
        const rightPart = words.slice(splitIndex).join(' ');

        return `<span class="title-lets"><span class="brand-letter">${leftPart.charAt(0)}</span>${leftPart.slice(1)}</span> <span class="title-exchange">${rightPart}</span>`;
    }
}

function updateUserGreeting() {
    // Birthday Priority: Don't overwrite birthday title
    const birthdayCheck = checkTodayBirthday();
    if (birthdayCheck.isBirthday) {
        // Hide other greeting containers to avoid duplicates
        const center = document.getElementById('centerGreetingContainer');
        const history = document.getElementById('historyAboveGreeting');
        const topRight = document.getElementById('userGreeting');
        const btc = document.getElementById('btcFooterGreeting');

        if (center) { center.innerHTML = ''; center.style.display = 'none'; }
        if (history) { history.innerHTML = ''; history.style.display = 'none'; }
        if (topRight) topRight.style.display = 'none';
        if (btc) { btc.innerHTML = ''; btc.style.display = 'none'; }
        return;
    }

    const appTitle = document.querySelector('.app-title');
    const originalLogo = `<span class="title-lets"><span class="brand-letter">L</span>ets</span><span class="title-exchange">Exchange</span>`;

    // Containers
    const containers = {
        'top-right': document.getElementById('userGreeting'),
        'center': document.getElementById('centerGreetingContainer'),
        'above-history': document.getElementById('historyAboveGreeting'),
        'below-btc': document.getElementById('btcFooterGreeting')
    };

    // Determine if we should show greeting
    const hasName = window.userName && window.userName.trim() !== '';
    const hasPrefix = window.greetingPrefix && window.greetingPrefix.trim() !== '';
    const shouldShow = window.isRandomGreeting || hasPrefix || hasName;

    // Smart String Construction
    let htmlContent, fullGreeting;

    if (window.isRandomGreeting) {
        // Если вдруг фраза пустая, берем дефолт, чтобы не упасть
        const prefix = window.currentRandomPhrase || "Welcome,";

        if (hasName) {
            htmlContent = `${prefix} <span style="color: var(--secondary-accent); font-weight: 600;">${window.userName}</span>`;
            fullGreeting = `${prefix} ${window.userName}`;
        } else {
            // Убираем запятую на конце, если она есть
            const cleanPrefix = prefix.toString().replace(/,\s*$/, '');
            htmlContent = cleanPrefix;
            fullGreeting = cleanPrefix;
        }
    } else {
        // Manual Mode - use greeting prefix
        const manualText = `${window.greetingPrefix} ${window.userName}`.trim();

        if (hasName) {
            // Prefix + Name with colored name
            htmlContent = `${window.greetingPrefix} <span style="color: var(--secondary-accent); font-weight: 600;">${window.userName}</span>`;
            fullGreeting = manualText;
        } else {
            // Prefix only (no name)
            htmlContent = window.greetingPrefix.trim();
            fullGreeting = window.greetingPrefix.trim();
        }
    }

    // Update Dice Button State (UI Sync)
    const diceBtn = document.getElementById('randomGreetingToggle');
    if (diceBtn) diceBtn.classList.toggle('active', window.isRandomGreeting);

    // Disable manual input if random is on
    const prefixInput = document.getElementById('greetingPrefix');
    if (prefixInput) {
        prefixInput.disabled = window.isRandomGreeting;
        prefixInput.style.opacity = window.isRandomGreeting ? '0.5' : '1';
    }

    // Handle Logo Replacement
    if (window.greetingPos === 'off') {
        // Off position: Hide all greeting containers, restore logo
        if (appTitle) {
            appTitle.innerHTML = originalLogo;
        }
        Object.values(containers).forEach(el => {
            if (el) {
                el.style.display = 'none';
                el.innerHTML = '';
            }
        });
        return;
    }

    // Default Case: Position active
    if (shouldShow) {
        // Restore logo if NOT in replace-logo mode
        if (window.greetingPos !== 'replace-logo' && appTitle) {
            appTitle.innerHTML = originalLogo;
            // Also ensure seasonal hats can check in
            const existingHat = document.querySelector('.seasonal-hat');
            if (existingHat) existingHat.style.display = 'block';
        }

        if (window.greetingPos === 'replace-logo') {
            // Replace logo with greeting
            if (appTitle) {
                appTitle.innerHTML = formatDualColorTitle(fullGreeting);
                // Hide seasonal hat if it exists, as it breaks the replaced text layout usually
                const existingHat = document.querySelector('.seasonal-hat');
                if (existingHat) existingHat.style.display = 'none';
            }
            // Hide other containers
            Object.values(containers).forEach(el => {
                if (el) { el.style.display = 'none'; el.innerHTML = ''; }
            });
        } else {
            // Standard placement in specific container
            const target = containers[window.greetingPos];
            if (target) {
                target.innerHTML = htmlContent;
                target.style.display = 'block'; // Ensure visibility
                target.style.opacity = '1';
            }
            // Hide others
            Object.keys(containers).forEach(key => {
                if (key !== window.greetingPos && containers[key]) {
                    containers[key].style.display = 'none';
                    containers[key].innerHTML = '';
                }
            });
        }
    } else {
        // Should NOT show (empty inputs, etc) - Revert to clean state
        if (appTitle) appTitle.innerHTML = originalLogo;
        Object.values(containers).forEach(el => {
            if (el) { el.style.display = 'none'; el.innerHTML = ''; }
        });
    }
}

// Click to Copy Logic Helper
function copyToClipboard(text) {
    if (!text) return;
    const tooltip = window.tooltip || document.getElementById('copyTooltip');

    navigator.clipboard.writeText(text).then(() => {
        // Show Tooltip
        tooltip.classList.add('visible');

        // Reset timer if clicked again quickly
        if (tooltip.dataset.timeout) clearTimeout(parseInt(tooltip.dataset.timeout));

        const timeoutId = setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 1500);
        tooltip.dataset.timeout = timeoutId;

        // Ensure focus remains for typing
        window.display.focus();
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function togglePotatoMode(checkbox) {
    playSound('ui'); // Sound Hook
    window.isPotatoMode = checkbox.checked;
    localStorage.setItem('calcPotatoMode', JSON.stringify(window.isPotatoMode));
    applyPotatoMode();
}

function applyPotatoMode() {
    const body = document.body;
    const toggle = document.getElementById('potatoModeToggle');
    const indicator = document.getElementById('lowPowerIndicator');

    if (toggle) toggle.checked = window.isPotatoMode;

    if (window.isPotatoMode) {
        body.setAttribute('data-perf', 'potato');
        if (indicator) indicator.style.display = 'inline';
        if (typeof stopBtcPolling === 'function') stopBtcPolling();

        // Also stop particles
        if (window.particleContainer) window.particleContainer.innerHTML = '';

    } else {
        body.removeAttribute('data-perf');
        if (indicator) indicator.style.display = 'none';

        if (window.isProFeaturesEnabled && !window.isBtcLocked) {
            if (typeof startBtcPolling === 'function') startBtcPolling();
        }
        // Restoring particles is handled by applyVisualEffects or toggle logic
        if (typeof applyVisualEffects === 'function' && window.isParticlesEnabled) applyVisualEffects();
    }
    // Re-bind Dice Button (Identity Randomizer)
    const diceBtn = document.getElementById('randomGreetingToggle');
    if (diceBtn) {
        diceBtn.onclick = toggleRandomGreeting;
    }

    renderHistory();
}

// --- Update Notification Logic ---
const UPDATE_VERSION_KEY = 'veles_update_v2_seen'; // Поменяй ключ, чтобы показать окно снова в будущем

function checkUpdateNotification() {
    const hasSeenUpdate = localStorage.getItem(UPDATE_VERSION_KEY);

    // Если ключа нет — показываем окно
    if (!hasSeenUpdate) {
        const modal = document.getElementById('updateModal');
        const overlay = document.getElementById('modalOverlay');

        if (modal && overlay) {
            // Небольшая задержка, чтобы интерфейс успел прогрузиться красиво
            setTimeout(() => {
                modal.classList.remove('hidden');
                overlay.classList.remove('hidden');
                playSound('ui'); // Дзынь!
            }, 1000);
        }
    }
}

function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    const overlay = document.getElementById('modalOverlay');

    if (modal) modal.classList.add('hidden'); // Явно скрываем
    if (overlay) overlay.classList.add('hidden'); // Явно скрываем слой

    localStorage.setItem(UPDATE_VERSION_KEY, 'true');
    playSound('ui');
}
