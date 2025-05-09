/**
 * @license
 * Arduino code generator for Procedure blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Note: Blockly.Arduino.getProcedureDef is defined in arduino_generator_init.js
// because it's referenced by multiple procedure blocks.

Blockly.Arduino['procedures_defnoreturn'] = Blockly.Arduino.getProcedureDef;
Blockly.Arduino['procedures_defreturn'] = Blockly.Arduino.getProcedureDef;

Blockly.Arduino['procedures_callnoreturn'] = function(block) {
    var funcName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
    var args = [];
    var variables = block.getVars();
    for (var i = 0; i < variables.length; i++) {
        args[i] = Blockly.Arduino.valueToCode(block, 'ARG' + i, Blockly.Arduino.ORDER_COMMA) || 'null';
    }
    var code = funcName + '(' + args.join(', ') + ');\n';
    return code;
};

Blockly.Arduino['procedures_callreturn'] = function(block) {
    var funcName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
    var args = [];
    var variables = block.getVars();
    for (var i = 0; i < variables.length; i++) {
        args[i] = Blockly.Arduino.valueToCode(block, 'ARG' + i, Blockly.Arduino.ORDER_COMMA) || 'null';
    }
    var code = funcName + '(' + args.join(', ') + ')';
    return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; // Function call order
};

Blockly.Arduino['procedures_ifreturn'] = function(block) {
    var condition = Blockly.Arduino.valueToCode(block, 'CONDITION', Blockly.Arduino.ORDER_NONE) || 'false';
    var code = 'if (' + condition + ') {\n';
    if (block.hasReturnValue_) {
        var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || 'null';
        // Use Blockly.Arduino.INDENT if available, otherwise default to two spaces
        var indent = Blockly.Arduino.INDENT || '  ';
        code += indent + 'return ' + value + ';\n';
    } else {
        var indent = Blockly.Arduino.INDENT || '  ';
        code += indent + 'return;\n';
    }
    code += '}\n';
    return code;
};

// --- Custom Return Statement Block (void return) ---
Blockly.Blocks['custom_return_statement'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("return");
    this.setPreviousStatement(true, null);
    this.setColour(290);
    this.setTooltip('Exits the current function. Use in functions that do not return a value (void functions), or to return a value from functions that do.');
    this.setHelpUrl('https://www.arduino.cc/reference/en/language/structure/control-structure/return/');
  }
};

Blockly.Arduino['custom_return_statement'] = function(block) {
  return 'return;\n';
};

// --- Custom Return Value Statement Block ---
Blockly.Blocks['custom_return_value_statement'] = {
  init: function() {
    this.appendValueInput("VALUE")
        .setCheck(null) // Allow any type to be returned
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("return value");
    this.setPreviousStatement(true, null);
    // No next statement because return exits the function.
    this.setColour(290);
    this.setTooltip('Returns a value from a function.');
    this.setHelpUrl('https://www.arduino.cc/reference/en/language/structure/control-structure/return/');
    // Ensure this block can only be placed inside functions that return a value.
    // This often requires custom logic or relying on Blockly's built-in procedure handling.
    // For now, we'll define it; proper context checking is more advanced.
  }
};

Blockly.Arduino['custom_return_value_statement'] = function(block) {
  var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || '0';
  return 'return ' + value + ';\n';
};

// --- TEST BLOCK ---
Blockly.Blocks['test_procedures_block'] = {
  init: function() {
    this.appendDummyInput().appendField("TEST PROCEDURES BLOCK");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0); // Black color for easy spotting
  }
};

Blockly.Arduino['test_procedures_block'] = function(block) {
  return '// Test block from procedures.js\n';
};
console.log("Procedures.js: test_procedures_block defined."); // Log to confirm execution
