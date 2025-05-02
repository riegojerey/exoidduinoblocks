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

Blockly.Arduino['math_number'] = function(block) {
  var code = Number(block.getFieldValue('NUM'));
  var order = code < 0 ? Blockly.Arduino.ORDER_UNARY_PREFIX : Blockly.Arduino.ORDER_ATOMIC;
  if (code == Infinity) { code = 'INFINITY'; }
  else if (code == -Infinity) { code = '-INFINITY';}
  return [code, order];
};

Blockly.Arduino['math_arithmetic'] = function(block) {
  var OPERATORS = {'ADD': [' + ', Blockly.Arduino.ORDER_ADDITIVE], 'MINUS': [' - ', Blockly.Arduino.ORDER_ADDITIVE], 'MULTIPLY': [' * ', Blockly.Arduino.ORDER_MULTIPLICATIVE], 'DIVIDE': [' / ', Blockly.Arduino.ORDER_MULTIPLICATIVE], 'POWER': [null, Blockly.Arduino.ORDER_NONE]};
  var tuple = OPERATORS[block.getFieldValue('OP')]; var operator = tuple[0]; var order = tuple[1];
  var argument0 = Blockly.Arduino.valueToCode(block, 'A', order) || '0'; var argument1 = Blockly.Arduino.valueToCode(block, 'B', order) || '0';
  var code;
  if (!operator) { code = 'pow(' + argument0 + ', ' + argument1 + ')'; return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; }
  code = argument0 + operator + argument1; return [code, order];
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

// Add other math generators if needed (e.g., constants, modulo, constrain)
