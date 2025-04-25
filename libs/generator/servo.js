/**
 * @license
 * Arduino code generator for Servo blocks using Servo.h library.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['servo_attach'] = function(block) {
  var variable_servo_var = Blockly.Arduino.nameDB_.getName(block.getFieldValue('SERVO_VAR'), Blockly.Variables.NAME_TYPE);
  var dropdown_pin = block.getFieldValue('PIN');

  // Add the include for the library
  Blockly.Arduino.definitions_['include_servo'] = '#include <Servo.h>';

  // Define the Servo object instance
  Blockly.Arduino.definitions_['var_servo_' + variable_servo_var] = `Servo ${variable_servo_var};`;

  // Add the attach code to the setup section
  Blockly.Arduino.setups_['setup_servo_' + variable_servo_var] = `${variable_servo_var}.attach(${dropdown_pin});`;

  return ''; // This block only affects definitions and setup
};

Blockly.Arduino['servo_detach'] = function(block) {
  var variable_servo_var = Blockly.Arduino.nameDB_.getName(block.getFieldValue('SERVO_VAR'), Blockly.Variables.NAME_TYPE);

   // Ensure the init block's definition exists (safety check)
   if (!Blockly.Arduino.definitions_['var_servo_' + variable_servo_var]) {
       console.warn(`Servo detach block used for '${variable_servo_var}' but its setup definition was not found.`);
       return '// ERROR: Missing setup for servo ' + variable_servo_var + '\n';
   }

  return `${variable_servo_var}.detach();\n`;
};

Blockly.Arduino['servo_write'] = function(block) {
  var variable_servo_var = Blockly.Arduino.nameDB_.getName(block.getFieldValue('SERVO_VAR'), Blockly.Variables.NAME_TYPE);
  var value_degree = Blockly.Arduino.valueToCode(block, 'DEGREE', Blockly.Arduino.ORDER_ATOMIC) || '90'; // Default to 90 degrees

   // Ensure the init block's definition exists (safety check)
   if (!Blockly.Arduino.definitions_['var_servo_' + variable_servo_var]) {
       console.warn(`Servo write block used for '${variable_servo_var}' but its setup definition was not found.`);
       return '// ERROR: Missing setup for servo ' + variable_servo_var + '\n';
   }

  return `${variable_servo_var}.write(${value_degree});\n`;
};

Blockly.Arduino['servo_read'] = function(block) {
  var variable_servo_var = Blockly.Arduino.nameDB_.getName(block.getFieldValue('SERVO_VAR'), Blockly.Variables.NAME_TYPE);

   // Ensure the init block's definition exists (safety check)
   if (!Blockly.Arduino.definitions_['var_servo_' + variable_servo_var]) {
       console.warn(`Servo read block used for '${variable_servo_var}' but its setup definition was not found.`);
       return ['/* ERROR: Missing setup for servo ' + variable_servo_var + ' */', Blockly.Arduino.ORDER_ATOMIC];
   }

  var code = `${variable_servo_var}.read()`;
  return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; // Function call order
};
