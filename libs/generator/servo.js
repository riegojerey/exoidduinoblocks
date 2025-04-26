/**
 * @license Licensed under the Apache License, Version 2.0 (the "License"):
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * @fileoverview Arduino code generator for Servo library blocks.
 * Based on the Ardublockly project generator.
 * Updated to use Blockly.Variables.getVariable for variable names.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
  throw new Error('Blockly or Blockly.Arduino is not loaded!');
}


// Attach block
Blockly.Arduino['servo_attach'] = function(block) {
  // Get the variable object using the field value (which is the variable ID)
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SERVO_VAR'));
  if (!variable) { return '// ERROR: Servo variable not found!\n'; }
  var userVariableName = variable.name; // Get the user-friendly name

  // Create a C++ safe version of the variable name for the object
  var cleanVarName = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_');
  var servoObjName = 'servo_' + cleanVarName; // e.g., servo_myServo

  var pin = block.getFieldValue('PIN');

  // Include the Servo library header
  Blockly.Arduino.definitions_['include_servo'] = '#include <Servo.h>';

  // Declare the Servo object instance using the clean variable name
  Blockly.Arduino.definitions_['var_servo_' + cleanVarName] = `Servo ${servoObjName};`;

  // Add the attach code to the setup section
  Blockly.Arduino.setups_['setup_servo_' + cleanVarName] = `${servoObjName}.attach(${pin});`;

  return ''; // This block only affects definitions and setup
};

// Detach block
Blockly.Arduino['servo_detach'] = function(block) {
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SERVO_VAR'));
  if (!variable) { return '// ERROR: Servo variable not found!\n'; }
  var userVariableName = variable.name;
  var cleanVarName = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_');
  var servoObjName = 'servo_' + cleanVarName;

  // Check if the declaration exists using the clean name key
  if (!Blockly.Arduino.definitions_['var_servo_' + cleanVarName]) {
    console.warn(`Servo detach used on "${userVariableName}" but no Servo object was declared.`);
    return `// ERROR: no Servo declared for ${userVariableName}\n`;
  }
  return `${servoObjName}.detach();\n`;
};

// Write block
Blockly.Arduino['servo_write'] = function(block) {
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SERVO_VAR'));
   if (!variable) { return '// ERROR: Servo variable not found!\n'; }
  var userVariableName = variable.name;
  var cleanVarName = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_');
  var servoObjName = 'servo_' + cleanVarName;

  var angle = Blockly.Arduino.valueToCode(
    block, 'DEGREE', Blockly.Arduino.ORDER_ATOMIC
  ) || '90';

  // Check if the declaration exists using the clean name key
  if (!Blockly.Arduino.definitions_['var_servo_' + cleanVarName]) {
    console.warn(`Servo write used on "${userVariableName}" but no declaration found.`);
    return `// ERROR: no Servo declared for ${userVariableName}\n`;
  }
  return `${servoObjName}.write(${angle});\n`;
};

// Read block
Blockly.Arduino['servo_read'] = function(block) {
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SERVO_VAR'));
   if (!variable) { return ['/* ERROR: Servo variable not found! */ 0', Blockly.Arduino.ORDER_ATOMIC]; }
  var userVariableName = variable.name;
  var cleanVarName = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_');
  var servoObjName = 'servo_' + cleanVarName;

  // Check if the declaration exists using the clean name key
  if (!Blockly.Arduino.definitions_['var_servo_' + cleanVarName]) {
    console.warn(`Servo read used on "${userVariableName}" but no declaration found.`);
    return [ `/* ERROR: no Servo declared for ${userVariableName} */ 0`, Blockly.Arduino.ORDER_ATOMIC ];
  }
  const code = `${servoObjName}.read()`;
  return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; // .read() is a function call
};
