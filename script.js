// Access DOM elements of the calculator
const inputBox = document.getElementById('input');
const expressionDiv = document.getElementById('expression');
const resultDiv = document.getElementById('result');

// Define expression and result variable
let expression = '';
let result = '';

// Event handler for button clicks
function buttonClick(event) {
  const target = event.target;
  const action = target.dataset.action;
  const value = target.dataset.value;

  switch (action) {
    case 'number':
      addValue(value);
      break;
    case 'clear':
      clear();
      break;
    case 'backspace':
      backspace();
      break;
    case 'addition':
    case 'subtraction':
    case 'multiplication':
    case 'division':
      handleOperator(value);
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
    case 'decimal':
      decimal(value);
      break;
    case 'sqrt':
      sqrt();
      break;
    case 'power':
      power();
      break;
  }
  updateDisplay(expression, result);
}

// Event handler for keyboard input
function handleKeyPress(event) {
  const key = event.key;
  if (!isNaN(key)) {
    addValue(key);
  } else {
    handleKeyOperator(key);
  }
  updateDisplay(expression, result);
}

function handleKeyOperator(key) {
  switch (key) {
    case '+':
    case '-':
    case '*':
    case '/':
      addValue(key);
      break;
    case 'Enter':
      submit();
      break;
    case 'Backspace':
      backspace();
      break;
    case 'Escape':
      clear();
      break;
    case '.':
      decimal('.');
      break;
    case '%':
      percentage();
      break;
    case '^':
      power();
      break;
    case '√':
      sqrt();
      break;
    case 'n':
      negate();
      break;
  }
}

// Add value to the expression
function addValue(value) {
  if (value === '.') {
    addDecimal(value);
  } else {
    expression += value;
  }
}

// Add decimal point to the expression
function addDecimal(value) {
  const lastOperatorIndex = expression.search(/[+\-*/]/);
  const lastDecimalIndex = expression.lastIndexOf('.');
  const lastNumberIndex = Math.max(
    expression.lastIndexOf('+'),
    expression.lastIndexOf('-'),
    expression.lastIndexOf('*'),
    expression.lastIndexOf('/')
  );

  if (
    (lastDecimalIndex < lastOperatorIndex ||
      lastDecimalIndex < lastNumberIndex ||
      lastDecimalIndex === -1) &&
    (expression === '' ||
      expression.slice(lastNumberIndex + 1).indexOf('-') === -1)
  ) {
    expression += value;
  }
}

// Update the display with the current expression and result
function updateDisplay(expression, result) {
  expressionDiv.textContent = expression || '0';
  resultDiv.textContent = result || 'Result';

  togglePlaceholder(expressionDiv, expression);
  togglePlaceholder(resultDiv, result);

  restartAnimation(expressionDiv);
  restartAnimation(resultDiv);
}

// Toggle placeholder class based on content
function togglePlaceholder(element, content) {
  if (content) {
    element.classList.remove('placeholder');
  } else {
    element.classList.add('placeholder');
  }
}

// Restart animation for the given element
function restartAnimation(element) {
  element.classList.remove('animate');
  void element.offsetWidth;
  element.classList.add('animate');
}

// Clear the expression and result
function clear() {
  expression = '';
  result = '';
  updateDisplay(expression, result);
}

// Remove the last character from the expression
function backspace() {
  expression = expression.slice(0, -1);
  updateDisplay(expression, result);
}

// Check if the last character in the expression is an operator
function isLastCharOperator() {
  return isNaN(parseInt(expression.slice(-1)));
}

// Start a new expression from the result
function startFromResult(value) {
  expression += result + value;
}

// Submit the current expression for evaluation
function submit() {
  result = evaluateExpression();
  expression = '';
  updateDisplay(expression, result);
}

// Evaluate the current expression
function evaluateExpression() {
  try {
    const evalResult = eval(expression.replace(/\*\*/g, '**'));
    return isNaN(evalResult) || !isFinite(evalResult)
      ? ' '
      : evalResult < 1
      ? parseFloat(evalResult.toFixed(10))
      : parseFloat(evalResult.toFixed(2));
  } catch (e) {
    return 'Error';
  }
}

// Negate the current expression or result
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

// Convert the current expression or result to a percentage
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

// Add a decimal point to the expression
function decimal(value) {
  if (!expression.endsWith('.') && !isNaN(expression.slice(-1))) {
    addValue(value);
  }
  updateDisplay(expression, result);
}

// Calculate the square root of the current expression or result
function sqrt() {
  if (expression !== '') {
    result = Math.sqrt(evaluateExpression());
    expression = '';
  } else if (result !== '') {
    result = Math.sqrt(result);
  }
  updateDisplay(expression, result);
}

// Raise the current expression to a power
function power() {
  if (expression !== '' && !isLastCharOperator()) {
    expression += '**';
  }
}

// Add event listeners
inputBox.addEventListener('click', buttonClick);
document.addEventListener('keydown', handleKeyPress);