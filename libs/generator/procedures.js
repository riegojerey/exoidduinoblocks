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
