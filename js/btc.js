
// --- Pro Features Logic ---

function toggleProFeatures(checkbox) {
    playSound('ui'); // Sound Hook
    window.isProFeaturesEnabled = checkbox.checked;
    localStorage.setItem('calcProFeatures', JSON.stringify(window.isProFeaturesEnabled));
    applyProFeatures();
}

function applyProFeatures() {
    const headerControls = document.getElementById('headerControls');
    const btcWidget = document.getElementById('btcWidget');
    const historyPanel = document.getElementById('historyPanel');
    const proToggle = document.getElementById('proFeaturesToggle');

    if (proToggle) proToggle.checked = window.isProFeaturesEnabled;

    // Ensure any inline display styles from previous versions are cleared
    if (btcWidget) btcWidget.style.display = '';

    if (window.isProFeaturesEnabled) {
        // Show Header & Widget
        if (headerControls) headerControls.classList.add('visible');

        // Animate: History Shrink & Widget Expand (Simultaneous)
        if (historyPanel) historyPanel.classList.add('compact');
        if (btcWidget) btcWidget.classList.add('visible');

        // Re-attach listeners for BTC input
        const btcInput = document.getElementById('btcInput');
        const usdtInput = document.getElementById('usdtInput');
        if (btcInput) btcInput.oninput = convertFromBtc;
        if (usdtInput) usdtInput.oninput = convertFromUsdt;

        if (!window.isBtcLocked) {
            setTimeout(startBtcPolling, 500); // Small delay on load
        } else {
            if (window.btcPrice === 0) setTimeout(fetchBtcPrice, 500);
        }
    } else {
        // Hide Header & Widget
        if (headerControls) headerControls.classList.remove('visible');

        // Animate: History Expand & Widget Collapse
        if (historyPanel) historyPanel.classList.remove('compact');
        if (btcWidget) btcWidget.classList.remove('visible');

        stopBtcPolling();
    }
    updateBtcLockIcon();
    applyMacThemeToNewElements();
}

function applyMacThemeToNewElements() {
    // Ensure CSS variables are updated on :root
    const mode = window.isVisualEffectsEnabled || 'auto';
    if (typeof updateThemeColors === 'function') {
        updateThemeColors(mode);
    }
}

// BTC Bidirectional Converter
function startBtcPolling() {
    if (window.isPotatoMode) return; // Block in Potato Mode
    if (window.btcFetchInterval) clearInterval(window.btcFetchInterval);
    fetchBtcPrice();
    window.btcFetchInterval = setInterval(fetchBtcPrice, 30000);
}

function stopBtcPolling() {
    if (window.btcFetchInterval) clearInterval(window.btcFetchInterval);
}

async function fetchBtcPrice() {
    try {
        // 5 Second Timeout Race
        const fetchPromise = fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        window.btcPrice = parseFloat(data.price);

        const displayEl = document.getElementById('btcPriceDisplay');
        if (displayEl) {
            displayEl.textContent = `$${window.btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            applyMacThemeToNewElements();
        }

        // Update inputs if active
        // Use document.activeElement safely
        if (document.activeElement === document.getElementById('usdtInput')) {
            convertFromUsdt();
        } else {
            convertFromBtc();
        }
    } catch (error) {
        console.warn('BTC Fetch Error:', error);
        const displayEl = document.getElementById('btcPriceDisplay');
        if (displayEl) displayEl.textContent = "Update Failed";
    }
}

function convertFromBtc() {
    const btcInput = document.getElementById('btcInput');
    const usdtInput = document.getElementById('usdtInput');
    if (!btcInput || !usdtInput) return;

    let val = parseFloat(btcInput.value);
    if (isNaN(val)) {
        usdtInput.value = '';
        return;
    }
    let usdtVal = val * window.btcPrice;
    usdtInput.value = usdtVal.toFixed(2);
}

function convertFromUsdt() {
    const btcInput = document.getElementById('btcInput');
    const usdtInput = document.getElementById('usdtInput');
    if (!btcInput || !usdtInput) return;

    let val = parseFloat(usdtInput.value);
    if (isNaN(val)) {
        btcInput.value = '';
        return;
    }
    let btcAmount = val / window.btcPrice;
    btcInput.value = btcAmount.toFixed(8);
}

// Logic: Manage BTC Auto-Update Lock State
function toggleBtcLock() {
    window.isBtcLocked = !window.isBtcLocked;
    localStorage.setItem('calcBtcLock', JSON.stringify(window.isBtcLocked));
    updateBtcLockIcon();
    if (window.isBtcLocked) stopBtcPolling();
    else startBtcPolling();
}

function updateBtcLockIcon() {
    const btn = document.getElementById('btcLockBtn');
    if (!btn) return;
    if (window.isBtcLocked) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        btn.title = "Unlock Auto-Update";
        btn.classList.add('locked'); // CSS handles seasonal/mac colors
        btn.style.color = ''; // Remove any inline style
    } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
        btn.title = "Lock Auto-Update";
        btn.classList.remove('locked');
        btn.style.color = ''; // Remove inline style to fall back to CSS
    }
}

function refreshBtcPrice() {
    if (document.activeElement) document.activeElement.blur(); // Fix Input Freeze
    fetchBtcPrice();
    const btn = document.querySelector('button[onclick="refreshBtcPrice()"] svg');
    if (btn) {
        btn.style.transition = 'transform 0.5s';
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => btn.style.transform = 'none', 500);
    }
}
