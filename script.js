// DOM elements
const inputBox = document.getElementById('input');
const expressionDiv = document.getElementById('expression');
const resultDiv = document.getElementById('result');
const historyDiv = document.getElementById('history');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const toggleScientificBtn = document.getElementById('toggle-scientific');
const scientificButtons = document.getElementById('scientific-buttons');

// Global variables
let expression = '';
let result = '';
let typingTimeout;
const MAX_HISTORY_ITEMS = 5;
let openParentheses = 0;
let isDegree = true;
let isInverse = false;

// Event listeners
inputBox.addEventListener('click', buttonClick);
document.addEventListener('keydown', handleKeyPress);
themeToggle.addEventListener('click', toggleTheme);
themeToggle.addEventListener('touchstart', function(e) {
  e.preventDefault(); // Prevent default touch behavior
  toggleTheme();
});
toggleScientificBtn.addEventListener('click', toggleScientific);

// Main functions
function buttonClick(event) {
  const target = event.target;
  const action = target.dataset.action;
  const value = target.dataset.value;
  clearTimeout(typingTimeout);

  switch (action) {
    case 'number':
    case 'decimal':
    case 'addition':
    case 'subtraction':
    case 'multiplication':
    case 'division':
    case 'exponent':
      addValue(value);
      break;
    case 'clear':
      clear();
      break;
    case 'backspace':
      backspace();
      break;
    case 'submit':
      submit();
      break;
    case 'negate':
      negate();
      break;
    case 'mod':
      percentage();
      break;
    case 'pi':
      addPi();
      break;
    case 'sqrt':
      addSqrt();
      break;
    case 'factorial':
      addFactorial();
      break;
    case 'parenthesis':
      addParenthesis();
      break;
    case 'deg':
      toggleDegRad();
      break;
    case 'sin':
    case 'cos':
    case 'tan':
      trigonometry(action);
      break;
    case 'inv':
      toggleInverse();
      break;
    case 'e':
      addValue(Math.E.toFixed(10));
      break;
    case 'ln':
      addFunction(isInverse ? 'Math.exp' : 'Math.log');
      break;
    case 'log':
      addFunction(isInverse ? 'Math.pow(10,' : 'Math.log10');
      break;
  }

  updateDisplay(expression, '');
}

function updateDisplay(expression, result) {
  if (expression === '' && result === '') {
    expressionDiv.textContent = '0';
    expressionDiv.classList.remove('has-content');
  } else {
    expressionDiv.textContent = expression;
    expressionDiv.classList.add('has-content');
  }
  resultDiv.textContent = result;
  
  if (result) {
    expressionDiv.style.opacity = '0.5';
    expressionDiv.style.transform = 'translateY(-100%)';
    resultDiv.style.opacity = '1';
    resultDiv.style.transform = 'translateY(0)';
  } else {
    expressionDiv.style.opacity = '1';
    expressionDiv.style.transform = 'translateY(0)';
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'translateY(100%)';
  }
}

function submit() {
  clearTimeout(typingTimeout);
  
  while (needsClosingParenthesis()) {
    expression += ')';
    openParentheses--;
  }
  
  result = evaluateExpression();
  
  animateTransition();
  
  setTimeout(updateHistory, 250);

  setTimeout(() => {
    if (result !== 'Error') {
      expression = '';
    }
    updateDisplay(expression, result);
  }, 1000);
}

// Helper functions
function getMaxHistoryItems() {
  const historyItemHeight = 28;
  const historyDivHeight = historyDiv.clientHeight;
  return Math.floor(historyDivHeight / historyItemHeight);
}

function animateTransition() {
  expressionDiv.style.transition = 'all 0.5s ease';
  resultDiv.style.transition = 'all 0.5s ease';
  expressionDiv.style.opacity = '0';
  expressionDiv.style.transform = 'translateY(-100%)';
}

function updateHistory() {
  const historyItem = document.createElement('div');
  historyItem.classList.add('history-item');
  historyItem.textContent = `${expression} = ${result}`;
  historyDiv.appendChild(historyItem);
  
  expressionDiv.textContent = '';
  resultDiv.textContent = result;
  resultDiv.style.opacity = '1';
  resultDiv.style.transform = 'translateY(0)';
  
  const historyItems = historyDiv.querySelectorAll('.history-item');
  const maxHistoryItems = getMaxHistoryItems();
  historyItems.forEach((item, index) => {
    item.style.transition = 'all 0.5s ease';
    item.style.opacity = Math.max(0, 1 - (index / maxHistoryItems));
  });

  while (historyItems.length > maxHistoryItems) {
    historyDiv.removeChild(historyItems[0]);
  }
}

function addValue(value) {
  if (expression === '0') {
    expression = value;
  } else {
    // Always add the value, don't auto-close parentheses
    expression += value;
  }
  updateDisplay(expression, '');
  document.querySelector('button[data-action="clear"]').textContent = 'C';
}

function clear() {
  if (expression !== '' || result !== '') {
    expression = '';
    result = '';
    openParentheses = 0;
    updateDisplay(expression, result);
    document.querySelector('button[data-action="clear"]').textContent = 'AC';
  } else {
    historyDiv.innerHTML = '';
  }
}

function backspace() {
  expression = expression.slice(0, -1);
  updateDisplay(expression, '');
}

function isLastCharOperator() {
  return isNaN(parseInt(expression.slice(-1)));
}

function startFromResult(value) {
  expression += result + value;
}

function evaluateExpression() {
  try {
    let sanitizedExpression = expression.replace(/\^/g, '**');
    sanitizedExpression = sanitizedExpression.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)');
    sanitizedExpression = sanitizedExpression.replace(/√/g, 'Math.sqrt(');
    sanitizedExpression = sanitizedExpression.replace(/π/g, Math.PI.toFixed(10));
    sanitizedExpression = sanitizedExpression.replace(/(\d+)!/g, (match, number) => {
      return factorial(parseInt(number));
    });
    
    let openParens = (sanitizedExpression.match(/\(/g) || []).length;
    let closeParens = (sanitizedExpression.match(/\)/g) || []).length;
    sanitizedExpression += ')'.repeat(openParens - closeParens);
    
    sanitizedExpression = sanitizedExpression.replace(/Math.sin\(/g, `Math.sin(${isDegree ? 'Math.PI / 180 * ' : ''}`);
    sanitizedExpression = sanitizedExpression.replace(/Math.cos\(/g, `Math.cos(${isDegree ? 'Math.PI / 180 * ' : ''}`);
    sanitizedExpression = sanitizedExpression.replace(/Math.tan\(/g, `Math.tan(${isDegree ? 'Math.PI / 180 * ' : ''}`);
    sanitizedExpression = sanitizedExpression.replace(/Math.asin\(/g, `${isDegree ? '180 / Math.PI * ' : ''}Math.asin(`);
    sanitizedExpression = sanitizedExpression.replace(/Math.acos\(/g, `${isDegree ? '180 / Math.PI * ' : ''}Math.acos(`);
    sanitizedExpression = sanitizedExpression.replace(/Math.atan\(/g, `${isDegree ? '180 / Math.PI * ' : ''}Math.atan(`);
    
    const result = new Function('return ' + sanitizedExpression)();
    
    if (isNaN(result) || !isFinite(result)) {
      throw new Error('Invalid calculation');
    }
    
    return result < 1 ? parseFloat(result.toFixed(10)) : parseFloat(result.toFixed(2));
  } catch (error) {
    console.error('Calculation error:', error);
    return 'Error';
  }
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('Factorial is only defined for non-negative integers');
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

function negate() {
  if (expression === '' && result !== '') {
    result = -result;
  } else if (!expression.startsWith('-') && expression !== '') {
    expression = '-' + expression;
  } else if (expression.startsWith('-')) {
    expression = expression.slice(1);
  }
  updateDisplay(expression, result);
}

function percentage() {
  if (expression !== '') {
    result = evaluateExpression();
    expression = '';
    if (!isNaN(result) && isFinite(result)) {
      result /= 100;
    } else {
      result = '';
    }
  } else if (result !== '') {
    result = parseFloat(result) / 100;
  }
  updateDisplay(expression, result);
}

function decimal(value) {
  if (!expression.endsWith('.') && !isNaN(expression.slice(-1))) {
    addValue(value);
  }
}

function handleKeyPress(event) {
  const key = event.key;
  const button = document.querySelector(`button[data-value="${key}"]`);

  if (button) {
    button.click();
  } else {
    switch(key) {
      case 'Enter':
        document.querySelector('button[data-action="submit"]').click();
        break;
      case 'Escape':
        document.querySelector('button[data-action="clear"]').click();
        break;
      case 'Backspace':
        document.querySelector('button[data-action="backspace"]').click();
        break;
    }
  }
}

// Theme toggle functionality
function toggleTheme() {
  body.classList.toggle('light-theme');
  const isLightTheme = body.classList.contains('light-theme');
  themeToggle.innerHTML = isLightTheme ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

// Scientific calculator functions
function addPi() {
  addValue(Math.PI.toFixed(10));
}

function addSqrt() {
  if (!isNaN(expression.slice(-1)) && expression.slice(-1) !== '') {
    expression += '*';
  }
  expression += '√';
  updateDisplay(expression, '');
}

function addFactorial() {
  addValue('!');
}

function needsClosingParenthesis() {
  let openCount = 0;
  for (let char of expression) {
    if (char === '(') openCount++;
    if (char === ')') openCount--;
  }
  return openCount > 0;
}

function addParenthesis() {
  if (needsClosingParenthesis()) {
    expression += ')';
    openParentheses--;
  } else {
    if (!isNaN(expression.slice(-1)) && expression.slice(-1) !== '') {
      expression += '*';
    }
    expression += '(';
    openParentheses++;
  }
  updateDisplay(expression, '');
}

function toggleDegRad() {
  isDegree = !isDegree;
  document.querySelector('button[data-action="deg"]').textContent = isDegree ? 'DEG' : 'RAD';
}

function toggleInverse() {
  isInverse = !isInverse;
  document.querySelector('button[data-action="sin"]').textContent = isInverse ? 'asin' : 'sin';
  document.querySelector('button[data-action="cos"]').textContent = isInverse ? 'acos' : 'cos';
  document.querySelector('button[data-action="tan"]').textContent = isInverse ? 'atan' : 'tan';
  document.querySelector('button[data-action="ln"]').textContent = isInverse ? 'exp' : 'ln';
  document.querySelector('button[data-action="log"]').textContent = isInverse ? '10^x' : 'log';
}

function trigonometry(func) {
  const inverse = isInverse ? 'a' : '';
  addFunction(`Math.${inverse}${func}`);
}

function addFunction(func) {
  if (!isNaN(expression.slice(-1)) && expression.slice(-1) !== '') {
    expression += '*';
  }
  expression += `${func}(`;
  openParentheses++;
  updateDisplay(expression, '');
}

function toggleScientific() {
  scientificButtons.classList.toggle('visible');
  toggleScientificBtn.textContent = scientificButtons.classList.contains('visible') ? 'Basic' : 'Scientific';
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  if (prefersDarkScheme.matches) {
    body.classList.remove('light-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    body.classList.add('light-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }

  prefersDarkScheme.addListener((e) => {
    if (e.matches) {
      body.classList.remove('light-theme');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      body.classList.add('light-theme');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
});

// Initial display update
updateDisplay(expression, result);