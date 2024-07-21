// DOM elements
const elements = {
  inputBox: document.getElementById('input'),
  expressionDiv: document.getElementById('expression'),
  resultDiv: document.getElementById('result'),
  themeToggle: document.getElementById('theme-toggle'),
  body: document.body,
  toggleScientificBtn: document.getElementById('toggle-scientific'),
  scientificButtons: document.getElementById('scientific-buttons')
};

// Global state
const state = {
  expression: '',
  result: '',
  openParentheses: 0,
  isDegree: true,
  isInverse: false
};

// Event listeners
document.addEventListener('DOMContentLoaded', initializeCalculator);
elements.inputBox.addEventListener('click', buttonClick);
document.addEventListener('keydown', handleKeyPress);
elements.themeToggle.addEventListener('click', toggleTheme);
elements.themeToggle.addEventListener('touchstart', (e) => {
  e.preventDefault();
  toggleTheme();
});
elements.toggleScientificBtn.addEventListener('click', toggleScientific);

// Main functions
function buttonClick(event) {
  const { action, value } = event.target.dataset;
  const actions = {
    number: () => addValue(value),
    decimal: () => addValue(value),
    operator: () => addValue(value),
    clear: () => { clear(); updateClearButton(); },
    backspace: () => { backspace(); updateButtonIcon('backspace', 'delete-left'); },
    submit,
    negate: () => { negate(); updateButtonIcon('negate', 'plus-minus'); },
    mod: () => { percentage(); updateButtonIcon('mod', 'percent'); },
    pi: () => { addPi(); updateButtonIcon('pi', 'p'); },
    sqrt: () => { addSqrt(); updateButtonIcon('sqrt', 'square-root-variable'); },
    factorial: () => { addFactorial(); updateButtonIcon('factorial', 'exclamation'); },
    parenthesis: addParenthesis,
    deg: toggleDegRad,
    trigonometry: () => trigonometry(action),
    inv: toggleInverse,
    e: () => addValue(Math.E.toFixed(10)),
    ln: () => addFunction(state.isInverse ? 'Math.exp' : 'Math.log'),
    log: () => addFunction(state.isInverse ? 'Math.pow(10,' : 'Math.log10')
  };

  (actions[action] || actions[getActionType(action)])?.();
  updateDisplay();
  updateClearButton();
}

function getActionType(action) {
  return ['addition', 'subtraction', 'multiplication', 'division', 'exponent'].includes(action) ? 'operator' : action;
}

function updateDisplay() {
  elements.expressionDiv.textContent = state.expression || '0';
  elements.expressionDiv.classList.toggle('has-content', state.expression !== '');
  elements.resultDiv.textContent = state.result;

  const hasResult = Boolean(state.result);
  elements.expressionDiv.style.opacity = hasResult ? '0.5' : '1';
  elements.expressionDiv.style.transform = hasResult ? 'translateY(-100%)' : 'translateY(0)';
  elements.resultDiv.style.opacity = hasResult ? '1' : '0';
  elements.resultDiv.style.transform = hasResult ? 'translateY(0)' : 'translateY(100%)';
}

function submit() {
  while (needsClosingParenthesis()) {
    state.expression += ')';
    state.openParentheses--;
  }
  
  state.result = evaluateExpression();
  
  animateTransition();
  
  setTimeout(() => {
    if (state.result !== 'Error') {
      state.expression = '';
    }
    updateDisplay();
  }, 1000);
}

// Helper functions
function animateTransition() {
  elements.expressionDiv.style.transition = elements.resultDiv.style.transition = 'all 0.5s ease';
  elements.expressionDiv.style.opacity = '0';
  elements.expressionDiv.style.transform = 'translateY(-100%)';
}

// Basic calculator functions
function addValue(value) {
  state.expression = state.expression === '0' ? value : state.expression + value;
  updateDisplay();
  updateClearButton();
}

function clear() {
  state.expression = state.result = '';
  state.openParentheses = 0;
  updateDisplay();
  updateClearButton();
}

function backspace() {
  state.expression = state.expression.slice(0, -1);
  updateDisplay();
}

function negate() {
  if (!state.expression && state.result) {
    state.result = -state.result;
  } else if (state.expression) {
    state.expression = state.expression.startsWith('-') ? state.expression.slice(1) : '-' + state.expression;
  }
  updateDisplay();
}

function percentage() {
  if (state.expression) {
    state.result = evaluateExpression();
    state.expression = '';
    state.result = !isNaN(state.result) && isFinite(state.result) ? state.result / 100 : '';
  } else if (state.result) {
    state.result = parseFloat(state.result) / 100;
  }
  updateDisplay();
}

// Evaluation functions
function evaluateExpression() {
  try {
    let sanitizedExpression = state.expression
      .replace(/\^/g, '**')
      .replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)')
      .replace(/√/g, 'Math.sqrt(')
      .replace(/π/g, Math.PI.toFixed(10))
      .replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)));
    
    const openParens = (sanitizedExpression.match(/\(/g) || []).length;
    const closeParens = (sanitizedExpression.match(/\)/g) || []).length;
    sanitizedExpression += ')'.repeat(openParens - closeParens);
    
    const trigFunctions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'];
    trigFunctions.forEach(func => {
      const regex = new RegExp(`Math.${func}\\(`, 'g');
      const replacement = state.isDegree && func.length === 3 ? `Math.${func}(Math.PI / 180 * ` :
                          state.isDegree && func.length === 4 ? `180 / Math.PI * Math.${func}(` :
                          `Math.${func}(`;
      sanitizedExpression = sanitizedExpression.replace(regex, replacement);
    });
    
    const result = new Function('return ' + sanitizedExpression)();
    
    if (isNaN(result) || !isFinite(result)) {
      throw new Error('Invalid calculation');
    }
    
    return result < 1 ? parseFloat(result.toFixed(10)) : parseFloat(result.toFixed(2));
  } catch (error) {
    console.error('Calculation error:', error);
    return error instanceof SyntaxError ? 'Syntax Error' :
           error instanceof RangeError ? 'Number too large' :
           error instanceof TypeError ? 'Invalid operation' : 'Error';
  }
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('Factorial is only defined for non-negative integers');
  }
  return n <= 1 ? 1 : n * factorial(n - 1);
}

// Event handling functions
function handleKeyPress({ key }) {
  const keyMappings = {
    'Enter': 'submit',
    'Escape': 'clear',
    'Backspace': 'backspace',
    '+': 'addition',
    '-': 'subtraction',
    '*': 'multiplication',
    '/': 'division',
    '^': 'exponent',
    '%': 'mod',
    '(': 'parenthesis',
    ')': 'parenthesis',
    'p': 'pi',
    's': 'sin',
    'c': 'cos',
    't': 'tan',
    'l': 'log',
    'e': 'e'
  };

  const button = keyMappings[key] ? 
    document.querySelector(`button[data-action="${keyMappings[key]}"]`) :
    (!isNaN(key) || key === '.') ? document.querySelector(`button[data-value="${key}"]`) : null;

  button?.click();
}

// Theme toggle functionality
function toggleTheme() {
  elements.body.classList.toggle('light-theme');
  const isLightTheme = elements.body.classList.contains('light-theme');
  elements.themeToggle.querySelector('i').className = isLightTheme ? 'fas fa-moon' : 'fas fa-sun';
  localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

// Scientific calculator functions
const addPi = () => addValue(Math.PI.toFixed(10));
const addSqrt = () => {
  if (!isNaN(state.expression.slice(-1)) && state.expression.slice(-1) !== '') {
    state.expression += '*';
  }
  state.expression += '√';
  updateDisplay();
};
const addFactorial = () => addValue('!');

function needsClosingParenthesis() {
  return (state.expression.match(/\(/g) || []).length > (state.expression.match(/\)/g) || []).length;
}

function addParenthesis() {
  if (needsClosingParenthesis()) {
    state.expression += ')';
    state.openParentheses--;
  } else {
    if (!isNaN(state.expression.slice(-1)) && state.expression.slice(-1) !== '') {
      state.expression += '*';
    }
    state.expression += '(';
    state.openParentheses++;
  }
  updateDisplay();
  updateParenthesisButton();
}

function toggleDegRad() {
  state.isDegree = !state.isDegree;
  const degButton = document.querySelector('button[data-action="deg"]');
  degButton.innerHTML = `<i class="fas fa-sync-alt"></i> ${state.isDegree ? 'DEG' : 'RAD'}`;
}

function toggleInverse() {
  state.isInverse = !state.isInverse;
  const invButton = document.querySelector('button[data-action="inv"]');
  invButton.classList.toggle('active', state.isInverse);
  ['sin', 'cos', 'tan', 'ln', 'log'].forEach(func => {
    const button = document.querySelector(`button[data-action="${func}"]`);
    const inverseMap = {
      sin: 'asin', cos: 'acos', tan: 'atan', ln: 'exp', log: '10^x'
    };
    button.innerHTML = `<i class="fa-solid fa-function"></i> ${state.isInverse ? inverseMap[func] : func}`;
  });
}

const trigonometry = (func) => {
  addFunction(`Math.${state.isInverse ? 'a' : ''}${func}`);
  updateButtonIcon(func, func);
};

function addFunction(func) {
  if (!isNaN(state.expression.slice(-1)) && state.expression.slice(-1) !== '') {
    state.expression += '*';
  }
  state.expression += `${func}(`;
  state.openParentheses++;
  updateDisplay();
  updateButtonIcon(func.toLowerCase().replace('math.', ''), 'function');
}

function toggleScientific() {
  elements.scientificButtons.classList.toggle('visible');
  const isScientific = elements.scientificButtons.classList.contains('visible');
  elements.toggleScientificBtn.innerHTML = `
    <i class="fas fa-${isScientific ? 'calculator' : 'flask'}"></i>
    <span class="toggle-text">${isScientific ? 'Basic' : 'Scientific'}</span>
  `;
  
  // Force a reflow to ensure the transition is applied
  void elements.scientificButtons.offsetWidth;
}

// Initialization
function initializeCalculator() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const setTheme = (isDark) => {
    elements.body.classList.toggle('light-theme', !isDark);
    elements.themeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  };
  
  setTheme(prefersDarkScheme.matches);
  prefersDarkScheme.addListener((e) => setTheme(e.matches));

  document.querySelectorAll('.btn').forEach(initializeButtonIcon);
  updateClearButton();
  updateParenthesisButton();
  updateDisplay();
}

function initializeButtonIcon(btn) {
  const { action, value } = btn.dataset;
  if (action) {
    const iconMap = {
      clear: 'c', backspace: 'delete-left', negate: 'plus-minus', mod: 'percent',
      pi: 'p', sqrt: 'square-root-variable', factorial: 'exclamation',
      parenthesis: 'brackets-round', sin: 'function', cos: 'function',
      tan: 'function', ln: 'function', log: 'function', e: 'e',
      inv: 'superscript', deg: 'rotate', addition: 'plus', subtraction: 'minus',
      multiplication: 'xmark', division: 'divide', submit: 'equals', exponent: 'superscript'
    };
    if (iconMap[action]) {
      btn.innerHTML = `<i class="fa-solid fa-${iconMap[action]}"></i>`;
      if (['sin', 'cos', 'tan', 'ln', 'log'].includes(action)) {
        btn.innerHTML += ` ${action.toUpperCase()}`;
      }
    } else if (action === 'parenthesis') {
      btn.innerHTML = '<strong>( )</strong>';
    }
  } else if (value) {
    btn.innerHTML = !isNaN(value) ? `<i class="fa-solid fa-${value}"></i>` :
                    value === '.' ? '<i class="fa-solid fa-circle"></i>' : value;
  }
}

function updateClearButton() {
  const clearButton = document.querySelector('[data-action="clear"]');
  if (state.expression.length > 0) {
    clearButton.innerHTML = 'C';
    clearButton.setAttribute('aria-label', 'Clear entry');
  } else {
    clearButton.innerHTML = '<i class="fas fa-trash"></i>';
    clearButton.setAttribute('aria-label', 'Clear all');
  }
}

function updateParenthesisButton() {
  const parenthesisButton = document.querySelector('button[data-action="parenthesis"]');
  parenthesisButton.textContent = needsClosingParenthesis() ? ')' : '(';
}

function updateButtonIcon(action, icon) {
  document.querySelector(`button[data-action="${action}"] i`).className = `fas fa-${icon}`;
}