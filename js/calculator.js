// Helper to focus and move caret to end
function focusAndMoveCursorToEnd() {
    window.display.focus();
    // Use setTimeout to ensure focus happens after any default browser behavior
    setTimeout(() => {
        const len = window.display.value.length;
        window.display.setSelectionRange(len, len);
    }, 0);
}

// --- Font Scaling & Undo Logic ---
let lastDisplayState = '';

function adjustFontSize() {
    const len = window.display.value.length;
    let baseSize = 1.5;
    let newSize = baseSize;

    if (len > 36) {
        // New formula: start shrinking after 36 chars
        newSize = Math.max(0.8, baseSize - (len - 36) * 0.03);
    }
    window.display.style.fontSize = `${newSize}rem`;
}

function showTooltip(text) {
    const originalText = window.tooltip.textContent;
    window.tooltip.textContent = text;
    window.tooltip.classList.add('visible');
    setTimeout(() => {
        window.tooltip.classList.remove('visible');
        setTimeout(() => window.tooltip.textContent = originalText, 200);
    }, 1000);
}


function inputSymbol(symbol) {
    playSound('click'); // Sound Hook
    const start = window.display.selectionStart;
    const end = window.display.selectionEnd;

    // Handle initial "0" replacement if input is a number
    if (window.display.value === '0' && !['+', '-', '*', '/', '%'].includes(symbol)) {
        window.display.value = symbol;
        window.display.focus();
        window.display.setSelectionRange(symbol.length, symbol.length);
        return;
    }

    // Validation: Prevent silly duplicates (e.g. ".." or ",,")
    // But allow mixed separators (e.g. "1.000,50" -> ".,")
    const val = window.display.value;
    if (start > 0) {
        const prevChar = val[start - 1];
        if ((symbol === '.' && prevChar === '.') || (symbol === ',' && prevChar === ',')) {
            // Ignore double separator
            return;
        }
    }

    // Insert at cursor position
    const before = val.substring(0, start);
    const after = val.substring(end);

    window.display.value = before + symbol + after;

    window.display.focus();
    const newPos = start + symbol.length;
    window.display.setSelectionRange(newPos, newPos);
    adjustFontSize();
}

function clearDisplay() {
    playSound('action'); // Sound Hook
    lastDisplayState = window.display.value; // Save State for Undo
    window.display.value = '';
    adjustFontSize();
    focusAndMoveCursorToEnd();
}

function deleteLast() {
    playSound('action'); // Sound Hook
    const start = window.display.selectionStart;
    const end = window.display.selectionEnd;
    const val = window.display.value;

    if (start !== end) {
        // Delete Selection
        window.display.value = val.substring(0, start) + val.substring(end);
        window.display.focus();
        window.display.setSelectionRange(start, start);
    } else {
        // Normal Backspace
        if (start === 0) {
            window.display.focus();
            return; // Nothing to delete
        }

        window.display.value = val.substring(0, start - 1) + val.substring(end);
        window.display.focus();
        window.display.setSelectionRange(start - 1, start - 1);
    }
    adjustFontSize();
}


function parseCryptoNumber(numStr) {
    // 1. Remove all spaces (1 000 -> 1000)
    let clean = numStr.trim().replace(/\s/g, '');

    // Safety check: if no numbers, return as is
    if (!/[\d]/.test(clean)) return clean;

    const hasDot = clean.includes('.');
    const hasComma = clean.includes(',');

    // SCENARIO 1: Mixed separators (The most common crypto format)
    if (hasDot && hasComma) {
        const lastDotIndex = clean.lastIndexOf('.');
        const lastCommaIndex = clean.lastIndexOf(',');

        if (lastDotIndex > lastCommaIndex) {
            // Dot is last ("1,000.50") -> Comma is thousand sep
            return clean.replace(/,/g, '');
        } else {
            // Comma is last ("1.000,50") -> Dot is thousand sep
            return clean.replace(/\./g, '').replace(/,/g, '.');
        }
    }

    // SCENARIO 2: Only Commas
    if (hasComma) {
        const parts = clean.split(',');
        // If multiple commas exist, use heuristic
        if (parts.length > 2) {
            const lastSegment = parts[parts.length - 1];
            // HEURISTIC: If last segment is NOT 3 digits, treat last comma as decimal
            // Example: "1,000,50" -> 1000.50 | "1,000,000" -> 1000000
            if (lastSegment.length !== 3) {
                // Replace last comma with dot, remove others
                return clean.replace(/,(?=[^,]*$)/, '.').replace(/,/g, '');
            }
            // Else assume all are thousand separators
            return clean.replace(/,/g, '');
        } else {
            // Single comma: "1000,50" -> 1000.50
            return clean.replace(/,/g, '.');
        }
    }

    // SCENARIO 3: Only Dots
    if (hasDot) {
        const parts = clean.split('.');
        // If multiple dots exist, use heuristic
        if (parts.length > 2) {
            const lastSegment = parts[parts.length - 1];
            // HEURISTIC: If last segment is NOT 3 digits, treat last dot as decimal
            // Example: "1.000.50" -> 1000.50 | "1.000.000" -> 1000000
            if (lastSegment.length !== 3) {
                // Keep last dot, remove others. 
                // Logic: Replace last dot with placeholder, remove all dots, revert placeholder
                return clean.replace(/\.(?=[^.]*$)/, 'TEMP_DOT').replace(/\./g, '').replace('TEMP_DOT', '.');
            }
            // Else assume all are thousand separators
            return clean.replace(/\./g, '');
        }
        // Single dot: "1000.50" -> Keep as is
    }

    return clean;
}

function formatResult(num) {
    if (num === Infinity || num === -Infinity || isNaN(num)) return 'ERROR';
    let s = num.toFixed(10);
    return s.replace(/\.?0+$/, "");
}

function calculate() {
    playSound('click'); // Sound Hook (Enter/Equals)
    let rawInput = window.display.value;
    if (!rawInput) return;

    // Delta Operator Logic Integration
    if (rawInput.includes('Δ')) {
        // Parse: Left Δ Right
        // "100Δ105"
        const parts = rawInput.split('Δ');
        if (parts.length === 2) {
            const base = parseFloat(parts[0]);
            const target = parseFloat(parts[1]);

            if (!isNaN(base) && !isNaN(target)) {
                if (base === 0) {
                    window.display.value = "Error";
                    return;
                }

                let diff = target - base;
                let percentage = (diff / base) * 100;
                let sign = percentage >= 0 ? '+' : '';
                let resultStr = `${sign}${percentage.toFixed(5).replace(/\.?0+$/, "")}%`;

                // Custom History Entry
                const item = {
                    expr: rawInput,
                    res: resultStr,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isDelta: true
                };
                window.historyData.unshift(item);
                if (window.historyData.length > 30) window.historyData.pop();
                localStorage.setItem('cryptoCalcHistory', JSON.stringify(window.historyData));
                renderHistory();

                window.display.value = resultStr;
                return;
            }
        }
    }

    // Standard Calculation
    // Save state before calc
    lastDisplayState = rawInput;

    let expr = rawInput.replace(/÷/g, '/').replace(/×/g, '*');
    let tokens = expr.split(/([+\-*/%()])/);
    let cleanExpression = tokens.map(token => parseCryptoNumber(token)).join('');

    // Iteratively solve percentages
    // Algorithm: Find first %, check context (operator before it), solve, repeat.
    while (cleanExpression.includes('%')) {
        const percentIndex = cleanExpression.indexOf('%');
        const substring = cleanExpression.substring(0, percentIndex);
        const remainder = cleanExpression.substring(percentIndex + 1);

        // Regex to find [Expression] [Operator] [Number] at the end of substring
        // Group 1: Left Part (Expression), Group 2: Operator, Group 3: Number
        const match = substring.match(/^(.*)([\+\-\*\/])(\d+(?:\.\d+)?)$/);

        if (match) {
            const leftPart = match[1];
            const operator = match[2];
            const number = parseFloat(match[3]);

            if ((operator === '+' || operator === '-') && leftPart.trim() !== '') {
                try {
                    // Evaluate Left Part to get base value for percentage
                    const base = new Function('return ' + leftPart)();
                    // Calculate percentage value of the base
                    const percentValue = base * (number / 100);
                    // Apply operation
                    const result = operator === '+' ? base + percentValue : base - percentValue;

                    // Replace the entire handled segment with the result
                    cleanExpression = result + remainder;
                } catch (e) {
                    // If eval fails (e.g. invalid syntax), fallback to simple replacement
                    cleanExpression = substring.replace(/(\d+(?:\.\d+)?)$/, '($1/100)') + remainder;
                }
            } else {
                // Multiplicative (* /) or no valid left part: treat N% as N/100
                // e.g. 10 * 10% -> 10 * 0.1
                cleanExpression = substring.substring(0, substring.length - match[3].length) + (number / 100) + remainder;
            }
        } else {
            // No pattern matched (e.g. "50%" or "(1+2)%"), treat as /100
            const numMatch = substring.match(/(\d+(?:\.\d+)?)$/);
            if (numMatch) {
                const val = parseFloat(numMatch[1]);
                const pre = substring.substring(0, substring.length - numMatch[1].length);
                cleanExpression = pre + (val / 100) + remainder;
            } else {
                // Just replace % symbol with /100 if no number found (safeguard)
                cleanExpression = cleanExpression.replace('%', '/100');
            }
        }
    }

    try {
        const result = new Function('return ' + cleanExpression)();

        // Use formatResult to fix 3e-8 bug
        let formattedResult = formatResult(result);

        addToHistory(rawInput, formattedResult);

        window.display.value = formattedResult;
        adjustFontSize();
        focusAndMoveCursorToEnd();
    } catch (e) {
        const originalVal = window.display.value;
        window.display.value = 'ERROR';
        window.display.style.color = 'var(--error-color)';
        setTimeout(() => {
            window.display.value = originalVal;
            window.display.style.color = 'var(--text-color)';
            focusAndMoveCursorToEnd();
        }, 1000);
    }
}

function addToHistory(expression, result) {
    const item = {
        expr: expression,
        res: result,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    window.historyData.unshift(item);
    if (window.historyData.length > 30) window.historyData.pop();

    localStorage.setItem('cryptoCalcHistory', JSON.stringify(window.historyData));
    renderHistory();
}

function clearHistory() {
    window.historyData = [];
    renderHistory();
}

// Quick Fees
function applyQuickFee(percent) {
    let currentVal = parseFloat(window.display.value);
    if (isNaN(currentVal)) return;
    let result = currentVal * (1 + percent / 100);
    let formatted = formatResult(result);
    addToHistory(`${currentVal} ${percent > 0 ? '+' : ''}${percent}%`, formatted);
    window.display.value = formatted;
    focusAndMoveCursorToEnd();
}

// Delta Operator Logic
function toggleDeltaMode() {
    // New Behavior: Insert ' Δ ' Symbol (with spaces)
    inputSymbol(' Δ ');
}
