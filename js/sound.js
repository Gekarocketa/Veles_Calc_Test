// --- Sound Engine (Web Audio API) ---
let audioCtx = null;

function initAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Lazy load audio on first interaction
['click', 'keydown'].forEach(event => {
    document.addEventListener(event, initAudioContext, { once: true });
});

function playSound(type) {
    if (!window.isSoundEnabled || window.isPotatoMode || !audioCtx) return;

    // Simple synthesized sounds
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        // High pitch, short (Typing)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'action') {
        // Lower pitch, thocky (Delete, AC) - Reduced Volume (Was 0.15)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'ui') {
        // Soft aerie blip (Toggles)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    }
}

function toggleSound(checkbox) {
    window.isSoundEnabled = checkbox.checked;
    localStorage.setItem('calcSoundEnabled', JSON.stringify(window.isSoundEnabled));
    if (window.isSoundEnabled) initAudioContext();
    playSound('ui');
}
