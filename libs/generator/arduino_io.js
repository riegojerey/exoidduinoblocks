/**
 * @license
 * Arduino code generator for Arduino IO blocks.
 * Updated for Field Inputs & PWM block.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['io_digitalwrite'] = function(block) {
  // Get value directly from the field instead of an input block
  var pin = block.getFieldValue('PIN') || '13';
  var value = block.getFieldValue('STATE') || 'HIGH';
  // pinMode configuration should be handled by the io_pinmode block in the setup section
  return `digitalWrite(${pin}, ${value});\n`;
};

Blockly.Arduino['io_digitalread'] = function(block) {
  // Get value directly from the field
  var pin = block.getFieldValue('PIN') || '2';
  // pinMode configuration should be handled by the io_pinmode block in the setup section
  return [`digitalRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
};

// Generator for the NEW PWM block
Blockly.Arduino['io_pwm_write'] = function(block) {
  var pin = block.getFieldValue('PIN') || '3'; // Get pin from dropdown
  var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '128';
  // pinMode configuration should be handled by the io_pinmode block in the setup section
  return `analogWrite(${pin}, ${value});\n`;
};

// Keep old generator for compatibility if old blocks exist in saved workspaces
// This assumes the old block also had a field 'PIN' if it was modified.
// If the old block used a VALUE input for PIN, this would need adjustment.
Blockly.Arduino['io_analogwrite'] = function(block) {
  var pin = block.getFieldValue('PIN') || '3'; // Get value from field
  var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '128';
  return `analogWrite(${pin}, ${value});\n`;
};


Blockly.Arduino['io_analogread'] = function(block) {
  // Get pin value directly from the dropdown field
  var pin = block.getFieldValue('PIN') || 'A0';
  // pinMode is not required for analog inputs
  return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
};

// This block provides the HIGH/LOW constants
Blockly.Arduino['io_highlow'] = function(block) {
  return [block.getFieldValue('STATE'), Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['io_pinmode'] = function(block) {
  // Get values directly from the fields
  var pin = block.getFieldValue('PIN') || '13';
  var mode = block.getFieldValue('MODE');
  // Add the pinMode command to the setup section of the generated code
  Blockly.Arduino.setups_['setup_pinmode_' + pin] = `pinMode(${pin}, ${mode});`;
  return ''; // This block only affects the setup, doesn't generate code in the loop
};

// Note: The Blink block generator is in libs/generator/custom/blink.js
