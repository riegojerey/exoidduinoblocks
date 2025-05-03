/**
 * @license
 * Arduino code generator for Arduino Serial blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['serial_setup'] = function(block) {
  var baud = block.getFieldValue('BAUD') || '9600';
  Blockly.Arduino.setups_['setup_serial'] = `Serial.begin(${baud});`;
  return ''; // Affects setup only
};

Blockly.Arduino['serial_print'] = function(block) {
  var content = Blockly.Arduino.valueToCode(block, 'CONTENT', Blockly.Arduino.ORDER_ATOMIC) || '""';
  var nlField = block.getField('NEW_LINE'); // Check if field exists
  var nl = nlField ? nlField.getValue() === 'TRUE' : false; // Default to false if field missing
  // Ensure Serial is initialized if setup block wasn't used
  if (!Blockly.Arduino.setups_['setup_serial']) {
      Blockly.Arduino.setups_['setup_serial_print'] = 'Serial.begin(9600);'; // Default baud
  }
  if (nl) {
    return `Serial.println(${content});\n`;
  } else {
    return `Serial.print(${content});\n`;
  }
};

Blockly.Arduino['serial_available'] = function(block) {
  return ['Serial.available()', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['serial_read'] = function(block) {
  return ['Serial.read()', Blockly.Arduino.ORDER_ATOMIC];
};
