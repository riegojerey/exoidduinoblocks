/**
 * @license
 * Arduino code generator for Math blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Define the absolute value block
Blockly.Blocks['math_abs'] = {
  init: function() {
    this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField('absolute value of');
    this.setOutput(true, 'Number');
    this.setColour(230);
    this.setTooltip('Returns the absolute value of a number (removes the sign).');
    this.setHelpUrl('');
  }
};

// Generator for absolute value block
Blockly.Arduino['math_abs'] = function(block) {
  var argument0 = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_UNARY_PREFIX) || '0';
  return ['abs(' + argument0 + ')', Blockly.Arduino.ORDER_UNARY_POSTFIX];
};

Blockly.Blocks['math_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0, null, null, 0.01), 'NUM');
    this.setOutput(true, 'Number');
    this.setColour(230);
    this.setTooltip('A number.');
    this.setHelpUrl('');
  }
};

Blockly.Arduino['math_number'] = function(block) {
  var text = block.getFieldValue('NUM');
  var code = Number(text);
  text = String(text); // Ensure text is a string for indexOf
  if (text.indexOf('.') !== -1) {
    code = text; // preserves 5.0 as '5.0', 3.14 as '3.14', etc.
  }
  var order = code < 0 ? Blockly.Arduino.ORDER_UNARY_PREFIX : Blockly.Arduino.ORDER_ATOMIC;
  if (code == Infinity) { code = 'INFINITY'; }
  else if (code == -Infinity) { code = '-INFINITY';}
  return [code, order];
};

Blockly.Arduino['math_arithmetic'] = function(block) {
  var OPERATORS = {
    'ADD': [' + ', Blockly.Arduino.ORDER_ADDITIVE],
    'MINUS': [' - ', Blockly.Arduino.ORDER_ADDITIVE],
    'MULTIPLY': [' * ', Blockly.Arduino.ORDER_MULTIPLICATIVE],
    'DIVIDE': [' / ', Blockly.Arduino.ORDER_MULTIPLICATIVE],
    'POWER': [null, Blockly.Arduino.ORDER_NONE]
  };
  var tuple = OPERATORS[block.getFieldValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];

  // Helper to preserve decimal for math_number blocks
  function getOperandCode(inputName) {
    var inputBlock = block.getInputTargetBlock(inputName);
    if (inputBlock && inputBlock.type === 'math_number') {
      var text = inputBlock.getFieldValue('NUM');
      if (String(text).indexOf('.') !== -1) {
        return text; // preserve as string with decimal
      }
    }
    return Blockly.Arduino.valueToCode(block, inputName, order) || '0';
  }

  var argument0 = getOperandCode('A');
  var argument1 = getOperandCode('B');
  var code;
  var opType = block.getFieldValue('OP');
  var rightBlock = block.getInputTargetBlock('B');
  // Add parentheses for all arithmetic blocks on the right for MINUS, DIVIDE, MULTIPLY, or when precedence requires
  if (rightBlock && rightBlock.type === 'math_arithmetic') {
    var rightOp = rightBlock.getFieldValue('OP');
    var precedence = { 'POWER': 3, 'MULTIPLY': 2, 'DIVIDE': 2, 'ADD': 1, 'MINUS': 1 };
    if (
      opType === 'MINUS' ||
      opType === 'DIVIDE' ||
      opType === 'MULTIPLY' ||
      precedence[rightOp] <= precedence[opType]
    ) {
      argument1 = '(' + Blockly.Arduino.valueToCode(block, 'B', Blockly.Arduino.ORDER_NONE) + ')';
    }
  }
  if (!operator) {
    code = 'pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
  }
  code = argument0 + operator + argument1;
  return [code, order];
};

Blockly.Arduino['math_single'] = function(block) {
  var operator = block.getFieldValue('OP'); var code; var arg;
  if (operator == 'NEG') { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_UNARY_PREFIX) || '0'; if (arg[0] == '-') { arg = ' ' + arg; } code = '-' + arg; return [code, Blockly.Arduino.ORDER_UNARY_PREFIX]; }
  if (operator == 'ABS' || operator.substring(0, 5) == 'ROUND') { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_UNARY_POSTFIX) || '0'; }
  else if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_MULTIPLICATIVE) || '0'; }
  else { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_NONE) || '0'; }
  switch (operator) {
    case 'ABS': code = 'abs(' + arg + ')'; break; case 'ROOT': code = 'sqrt(' + arg + ')'; break; case 'LN': code = 'log(' + arg + ')'; break;
    case 'EXP': code = 'exp(' + arg + ')'; break; case 'POW10': code = 'pow(10,' + arg + ')'; break; case 'ROUND': code = 'round(' + arg + ')'; break;
    case 'ROUNDUP': code = 'ceil(' + arg + ')'; break; case 'ROUNDDOWN': code = 'floor(' + arg + ')'; break;
    case 'SIN': code = 'sin(' + arg + ' / 180.0 * PI)'; break; case 'COS': code = 'cos(' + arg + ' / 180.0 * PI)'; break; case 'TAN': code = 'tan(' + arg + ' / 180.0 * PI)'; break;
    default: throw Error('Unknown math operator: ' + operator);
  } return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
};

Blockly.Arduino['math_random_int'] = function(block) {
    var argument0 = Blockly.Arduino.valueToCode(block, 'FROM', Blockly.Arduino.ORDER_COMMA) || '0';
    var argument1 = Blockly.Arduino.valueToCode(block, 'TO', Blockly.Arduino.ORDER_COMMA) || '0';
    Blockly.Arduino.setups_['setup_randomseed'] = 'randomSeed(analogRead(0));';
    var code = 'random(' + argument0 + ', ' + argument1 + ' + 1)'; return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
};

// Define the negate block
Blockly.Blocks['math_negate'] = {
    init: function() {
        this.appendValueInput('NUMBER')
            .setCheck('Number')
            .appendField('-');
        this.setOutput(true, 'Number');
        this.setColour(230);
        this.setTooltip('Returns the negative of a number.');
        this.setHelpUrl('');
    }
};

// Generator for negate block
Blockly.Arduino['math_negate'] = function(block) {
    var argument0 = Blockly.Arduino.valueToCode(block, 'NUMBER', Blockly.Arduino.ORDER_UNARY_PREFIX) || '0';
    return ['-' + argument0, Blockly.Arduino.ORDER_UNARY_PREFIX];
};

// Trigonometric dropdown block
Blockly.Blocks['math_trig_dropdown'] = {
    init: function() {
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['sin', 'sin'],
                ['cos', 'cos'],
                ['tan', 'tan'],
                ['asin', 'asin'],
                ['acos', 'acos'],
                ['atan', 'atan']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setColour(230);
        this.setTooltip('Trigonometric functions (degrees)');
        this.setHelpUrl('');
    }
};

Blockly.Arduino['math_trig_dropdown'] = function(block) {
    var op = block.getFieldValue('OP');
    var num = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_NONE) || '0';
    // Convert degrees to radians for Arduino trig functions
    if(['sin','cos','tan'].includes(op)) {
        return [`${op}(radians(${num}))`, Blockly.Arduino.ORDER_FUNCTION_CALL];
    } else {
        // asin, acos, atan return radians, convert to degrees
        return [`degrees(${op}(${num}))`, Blockly.Arduino.ORDER_FUNCTION_CALL];
    }
};

// Sqrt/pi/epsilon/infinity/psi dropdown block
Blockly.Blocks['math_sqrt_dropdown'] = {
    init: function() {
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['sqrt', 'sqrt'],
                ['pi', 'pi'],
                ['epsilon', 'epsilon'],
                ['infinity', 'infinity'],
                ['psi', 'psi']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setColour(230);
        this.setTooltip('Square root, pi, epsilon, infinity, psi');
        this.setHelpUrl('');
    }
};

Blockly.Arduino['math_sqrt_dropdown'] = function(block) {
    var op = block.getFieldValue('OP');
    var num = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_NONE) || '0';
    switch(op) {
        case 'sqrt':
            return [`sqrt(${num})`, Blockly.Arduino.ORDER_FUNCTION_CALL];
        case 'pi':
            return ['PI', Blockly.Arduino.ORDER_ATOMIC];
        case 'epsilon':
            return ['__FLT_EPSILON__', Blockly.Arduino.ORDER_ATOMIC];
        case 'infinity':
            return ['INFINITY', Blockly.Arduino.ORDER_ATOMIC];
        case 'psi':
            return ['0.5772156649', Blockly.Arduino.ORDER_ATOMIC]; // Euler-Mascheroni constant
        default:
            return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Rounding dropdown block
Blockly.Blocks['math_round_dropdown'] = {
    init: function() {
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField(new Blockly.FieldDropdown([
                ['round', 'round'],
                ['round up', 'ceil'],
                ['round down', 'floor']
            ]), 'OP');
        this.setOutput(true, 'Number');
        this.setColour(230);
        this.setTooltip('Rounding functions');
        this.setHelpUrl('');
    }
};

Blockly.Arduino['math_round_dropdown'] = function(block) {
    var op = block.getFieldValue('OP');
    var num = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_NONE) || '0';
    switch(op) {
        case 'round':
            return [`round(${num})`, Blockly.Arduino.ORDER_FUNCTION_CALL];
        case 'ceil':
            return [`ceil(${num})`, Blockly.Arduino.ORDER_FUNCTION_CALL];
        case 'floor':
            return [`floor(${num})`, Blockly.Arduino.ORDER_FUNCTION_CALL];
        default:
            return [num, Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Remainder block
Blockly.Blocks['math_remainder'] = {
    init: function() {
        this.appendValueInput('DIVIDEND')
            .setCheck('Number')
            .appendField('remainder of');
        this.appendDummyInput()
            .appendField('÷');
        this.appendValueInput('DIVISOR')
            .setCheck('Number');
        this.setOutput(true, 'Number');
        this.setColour(230);
        this.setTooltip('Remainder of division');
        this.setHelpUrl('');
    }
};

Blockly.Arduino['math_remainder'] = function(block) {
    var dividend = Blockly.Arduino.valueToCode(block, 'DIVIDEND', Blockly.Arduino.ORDER_MODULUS) || '0';
    var divisor = Blockly.Arduino.valueToCode(block, 'DIVISOR', Blockly.Arduino.ORDER_MODULUS) || '1';
    return [`${dividend} % ${divisor}`, Blockly.Arduino.ORDER_MODULUS];
};

// Map block
Blockly.Blocks['math_map'] = {
    init: function() {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('map');
        this.appendValueInput('FROM_LOW')
            .setCheck('Number')
            .appendField('from');
        this.appendValueInput('FROM_HIGH')
            .setCheck('Number');
        this.appendValueInput('TO_LOW')
            .setCheck('Number')
            .appendField('to');
        this.appendValueInput('TO_HIGH')
            .setCheck('Number');
        this.setOutput(true, 'Number');
        this.setColour(230);
        this.setTooltip('Map a value from one range to another');
        this.setHelpUrl('');
    }
};

Blockly.Arduino['math_map'] = function(block) {
    var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || '0';
    var fromLow = Blockly.Arduino.valueToCode(block, 'FROM_LOW', Blockly.Arduino.ORDER_NONE) || '0';
    var fromHigh = Blockly.Arduino.valueToCode(block, 'FROM_HIGH', Blockly.Arduino.ORDER_NONE) || '1023';
    var toLow = Blockly.Arduino.valueToCode(block, 'TO_LOW', Blockly.Arduino.ORDER_NONE) || '0';
    var toHigh = Blockly.Arduino.valueToCode(block, 'TO_HIGH', Blockly.Arduino.ORDER_NONE) || '255';
    return [`map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`, Blockly.Arduino.ORDER_FUNCTION_CALL];
};

// Typed number block: (dropdown int, float, double) (insert number)
Blockly.Blocks['math_number_typed'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['int', 'int'],
        ['float', 'float'],
        ['double', 'double']
      ]), 'TYPE')
      .appendField(new Blockly.FieldNumber(0, null, null, 0.01), 'NUM');
    this.setOutput(true, 'Number');
    this.setColour(230);
    this.setTooltip('A typed number: int, float, or double.');
    this.setHelpUrl('');
  }
};

Blockly.Arduino['math_number_typed'] = function(block) {
  var type = block.getFieldValue('TYPE');
  var text = block.getFieldValue('NUM');
  var code = Number(text);
  text = String(text);
  if (type === 'int') {
    code = parseInt(code);
  } else if (type === 'float' || type === 'double') {
    // Always output a decimal for float/double
    if (text.indexOf('.') === -1) {
      code = code + '.0';
    } else {
      code = text;
    }
  }
  var order = code < 0 ? Blockly.Arduino.ORDER_UNARY_PREFIX : Blockly.Arduino.ORDER_ATOMIC;
  return [code, order];
};

// Remove math_abs block if present
if (Blockly.Blocks['math_abs']) delete Blockly.Blocks['math_abs'];
if (Blockly.Arduino['math_abs']) delete Blockly.Arduino['math_abs'];

// Add other math generators if needed (e.g., constants, modulo, constrain)
