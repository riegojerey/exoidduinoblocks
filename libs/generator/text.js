/**
 * @license
 * Arduino code generator for Text blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['text'] = function(block) {
  var code = Blockly.Arduino.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['text_print'] = function(block) {
  var msg = Blockly.Arduino.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_NONE) || '""';
  // Ensure Serial is initialized if not already done by serial_setup
  if (!Blockly.Arduino.setups_['setup_serial']) {
      Blockly.Arduino.setups_['setup_serial_print'] = 'Serial.begin(9600);';
  }
  return 'Serial.println(' + msg + ');\n';
};

Blockly.Arduino['text_join'] = function(block) {
    if (block.itemCount_ == 0) { return ['""', Blockly.Arduino.ORDER_ATOMIC]; }
    var code = ''; var order = Blockly.Arduino.ORDER_ADDITIVE;
    for (var n = 0; n < block.itemCount_; n++) {
        var argument = Blockly.Arduino.valueToCode(block, 'ADD' + n, order) || '""';
        if (n > 0) { code += ' + '; }
        code += 'String(' + argument + ')'; // Cast to String object for concatenation
    }
    if (block.itemCount_ == 1) {
         var singleArg = Blockly.Arduino.valueToCode(block, 'ADD0', Blockly.Arduino.ORDER_ATOMIC) || '""';
         // Try to return original type if it's just one item
         return [singleArg, Blockly.Arduino.ORDER_ATOMIC];
    }
    return [code, order];
};

Blockly.Arduino['text_append'] = function(block) {
    var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    var value = Blockly.Arduino.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_ASSIGNMENT) || '""';
    // Assumes varName is a String object
    return varName + ' += String(' + value + ');\n';
};

// Add other text generators if needed (length, isEmpty, charAt, etc.)
