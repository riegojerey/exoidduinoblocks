/**
 * @license
 * Arduino code generator for Sensor blocks.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['sensor_light_condition'] = function(block) {
  var pin = block.getFieldValue('PIN') || 'A0';
  var state = block.getFieldValue('STATE');
  // pinMode is not required for analog inputs
  var analogReadCode = `analogRead(${pin})`;
  var code;
  if (state === 'LIGHT') {
    // Light condition: value < 300 (Adjust threshold if needed)
    code = `${analogReadCode} < 300`;
  } else { // DARK
    // Dark condition: value >= 300 (Adjust threshold if needed)
    code = `${analogReadCode} >= 300`;
  }
  // Return the comparison code and its operator precedence
  return [code, Blockly.Arduino.ORDER_RELATIONAL];
};

Blockly.Arduino['sensor_light_value'] = function(block) {
  var pin = block.getFieldValue('PIN') || 'A0';
  // pinMode is not required for analog inputs
  var code = `analogRead(${pin})`;
  // Return the analogRead code and its precedence (atomic)
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['sensor_potentiometer'] = function(block) {
  var pin = block.getFieldValue('PIN') || 'A0';
  var unit = block.getFieldValue('UNIT');
  // pinMode is not required for analog inputs
  var analogReadCode = `analogRead(${pin})`;
  var code;
  if (unit === 'PERCENTAGE') {
    // Map the 0-1023 value to 0-100
    code = `map(${analogReadCode}, 0, 1023, 0, 100)`;
    // map() is a function call, precedence is ORDER_UNARY_POSTFIX
    return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
  } else { // VALUE (0-1023)
    code = analogReadCode;
    // analogRead() is atomic
    return [code, Blockly.Arduino.ORDER_ATOMIC];
  }
};
