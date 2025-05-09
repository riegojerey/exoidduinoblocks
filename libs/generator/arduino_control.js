/**
 * @license
 * Arduino code generator for Control Flow blocks (Switch/Case).
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// --- Switch Block ---
Blockly.Blocks['controls_switch'] = {
  init: function() {
    this.setHelpUrl('https://en.cppreference.com/w/cpp/language/switch');
    this.setColour(Blockly.Msg['LOGIC_HUE'] || 210);
    this.appendValueInput('SWITCH_VALUE')
        .setCheck(['Number', 'String']) // Arduino switch works with int types, char. String needs care.
        .appendField("switch on");
    this.appendStatementInput('CASES')
        .setCheck(['controls_case', 'controls_default']) // Only allow case/default blocks
        .appendField("cases:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Executes different blocks of code based on the value of an expression. Only case and default blocks can be placed inside.');
  }
};

// --- Case Block ---
Blockly.Blocks['controls_case'] = {
  init: function() {
    this.setHelpUrl('https://en.cppreference.com/w/cpp/language/switch');
    this.setColour(Blockly.Msg['LOGIC_HUE'] || 210);
    this.appendValueInput('CASE_VALUE')
        .setCheck(['Number', 'String']) // Match type with switch_on input
        .appendField("case");
    this.appendStatementInput('DO')
        .appendField("do");
    this.setPreviousStatement(true, ['controls_case', 'controls_default']);
    this.setNextStatement(true, ['controls_case', 'controls_default']);
    this.setTooltip('One of the cases for the switch block. Code here executes if the case value matches the switch value. Includes an automatic break.');
  }
};

// --- Default Block ---
Blockly.Blocks['controls_default'] = {
  init: function() {
    this.setHelpUrl('https://en.cppreference.com/w/cpp/language/switch');
    this.setColour(Blockly.Msg['LOGIC_HUE'] || 210);
    this.appendDummyInput()
        .appendField("default");
    this.appendStatementInput('DO')
        .appendField("do");
    this.setPreviousStatement(true, ['controls_case', 'controls_default']);
    // No next statement for default if it's typically last, but allow stacking for flexibility.
    this.setNextStatement(true, ['controls_case', 'controls_default']); 
    this.setTooltip('The default case for the switch block. Code here executes if no other case matches. Includes an automatic break.');
  }
};

// --- Arduino Generators ---
Blockly.Arduino['controls_switch'] = function(block) {
  var switch_value = Blockly.Arduino.valueToCode(block, 'SWITCH_VALUE', Blockly.Arduino.ORDER_NONE) || '0';
  var cases_code = Blockly.Arduino.statementToCode(block, 'CASES');
  
  var code = 'switch (' + switch_value + ') {\n' +
             cases_code +
             '}\n';
  return code;
};

Blockly.Arduino['controls_case'] = function(block) {
  var case_value = Blockly.Arduino.valueToCode(block, 'CASE_VALUE', Blockly.Arduino.ORDER_NONE) || '0';
  var statements_do = Blockly.Arduino.statementToCode(block, 'DO');
  // For Arduino (C++), string literals in case statements are not directly supported.
  // If using strings, they typically need to be converted to char or be part of if-else chains within cases for complex strings.
  // For simplicity, we'll assume numeric or char values here. If it's a string block, it will be quoted.
  // User needs to ensure the type matches what switch can handle (ints, chars).
  var code = '  case ' + case_value + ':\n' +
             Blockly.Arduino.prefixLines(statements_do, '    ') + // Indent statements
             '    break;\n'; // Automatic break
  return code;
};

Blockly.Arduino['controls_default'] = function(block) {
  var statements_do = Blockly.Arduino.statementToCode(block, 'DO');
  var code = '  default:\n' +
             Blockly.Arduino.prefixLines(statements_do, '    ') + // Indent statements
             '    break;\n'; // Automatic break
  return code;
}; 