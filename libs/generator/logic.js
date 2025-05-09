/**
 * @license
 * Arduino code generator for Logic blocks.
 */
'use strict';

// Ensure Blockly.Arduino is initialized.
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Define the if-else block
Blockly.Blocks['logic_if_else'] = {
  init: function() {
    this.appendValueInput('IF')
        .setCheck('Boolean')
        .appendField('if');
    this.appendStatementInput('DO')
        .appendField('do');
    this.appendStatementInput('ELSE')
        .appendField('else');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip('If the condition is true, do the first block of statements. Otherwise, do the second block of statements.');
    this.setHelpUrl('');
  }
};

// Generator for if-else block
Blockly.Arduino['logic_if_else'] = function(block) {
  var condition = Blockly.Arduino.valueToCode(block, 'IF', Blockly.Arduino.ORDER_NONE) || 'false';
  var doCode = Blockly.Arduino.statementToCode(block, 'DO');
  var elseCode = Blockly.Arduino.statementToCode(block, 'ELSE');
  
  return 'if (' + condition + ') {\n' + doCode + '} else {\n' + elseCode + '}\n';
};

Blockly.Arduino['controls_if'] = function(block) {
  var n = 0; var code = '', branchCode, conditionCode;
  do {
    conditionCode = Blockly.Arduino.valueToCode(block, 'IF' + n, Blockly.Arduino.ORDER_NONE) || 'false';
    branchCode = Blockly.Arduino.statementToCode(block, 'DO' + n);
    code += (n > 0 ? ' else ' : '') + 'if (' + conditionCode + ') {\n' + branchCode + '}';
    ++n;
  } while (block.getInput('IF' + n));
  if (block.getInput('ELSE')) { branchCode = Blockly.Arduino.statementToCode(block, 'ELSE'); code += ' else {\n' + branchCode + '}'; }
  return code + '\n';
};

Blockly.Arduino['logic_compare'] = function(block) {
  var OPERATORS = {'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='};
  var operator = OPERATORS[block.getFieldValue('OP')]; var order = Blockly.Arduino.ORDER_EQUALITY;
  var argument0 = Blockly.Arduino.valueToCode(block, 'A', order) || '0'; var argument1 = Blockly.Arduino.valueToCode(block, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1; return [code, order];
};

Blockly.Arduino['logic_operation'] = function(block) {
  var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.Arduino.ORDER_LOGICAL_AND : Blockly.Arduino.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Arduino.valueToCode(block, 'A', order) || 'false'; var argument1 = Blockly.Arduino.valueToCode(block, 'B', order) || 'false';
  if (!argument0 && !argument1) { argument0 = 'false'; argument1 = 'false'; }
  else { var defaultArgument = (operator == '&&') ? 'true' : 'false'; if (!argument0) { argument0 = defaultArgument; } if (!argument1) { argument1 = defaultArgument; } }
  var code = argument0 + ' ' + operator + ' ' + argument1; return [code, order];
};

Blockly.Arduino['logic_negate'] = function(block) {
  var order = Blockly.Arduino.ORDER_UNARY_PREFIX; var argument0 = Blockly.Arduino.valueToCode(block, 'BOOL', order) || 'true';
  var code = '!' + argument0; return [code, order];
};

Blockly.Arduino['logic_boolean'] = function(block) { var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false'; return [code, Blockly.Arduino.ORDER_ATOMIC]; };

Blockly.Arduino['logic_null'] = function(block) { return ['NULL', Blockly.Arduino.ORDER_ATOMIC]; };

Blockly.Arduino['logic_ternary'] = function(block) {
  var value_if = Blockly.Arduino.valueToCode(block, 'IF', Blockly.Arduino.ORDER_CONDITIONAL) || 'false';
  var value_then = Blockly.Arduino.valueToCode(block, 'THEN', Blockly.Arduino.ORDER_CONDITIONAL) || 'null';
  var value_else = Blockly.Arduino.valueToCode(block, 'ELSE', Blockly.Arduino.ORDER_CONDITIONAL) || 'null';
  var code = value_if + ' ? ' + value_then + ' : ' + value_else; return [code, Blockly.Arduino.ORDER_CONDITIONAL];
};

// --- Break Statement Block ---
Blockly.Blocks['controls_break'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("break");
    this.setPreviousStatement(true, null);
    this.setNextStatement(false, null); // No next statement because break exits the loop/switch
    this.setColour(210); // Same color as other logic blocks
    this.setTooltip("Exits the current loop or switch statement.");
    this.setHelpUrl("https://www.arduino.cc/reference/en/language/structure/control-structure/break/");
  }
};

Blockly.Arduino['controls_break'] = function(block) {
  return 'break;\n';
};
