/**
 * @license Licensed under the Apache License, Version 2.0 (the "License"):
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * @fileoverview Arduino code generator for Servo library blocks.
 * Based on the Ardublockly project generator.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
  throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// --- NEW APPROACH: Helper function to get clean variable name ---
// (We get the variable object from the field first)
function getCleanVariableName(block, fieldName) {
  const variableField = block.getField(fieldName);
  if (!variableField) {
    console.error(`Field "${fieldName}" not found on block ${block.type}`);
    return 'UNKNOWN_VAR'; // Or throw an error
  }
  const variable = variableField.getVariable();
  if (!variable) {
    // This can happen if the variable was deleted after the block was created
    // or if the field is somehow misconfigured.
    // We might fall back to the field's text value as a last resort,
    // but it's better to handle this case explicitly.
    console.warn(`Variable not found for field "${fieldName}" on block ${block.type}. Using field text as fallback.`);
    // Fallback to text value, but this might not be the canonical variable name
    return block.getFieldValue(fieldName) || 'MISSING_VAR';
  }
  // --- Using the direct name from the variable object ---
  // WARNING: This name might not be safe for C++ identifiers (e.g., contain spaces)
  // The original code used nameDB_.getName() for sanitization.
  return variable.name;
}
// --- End Helper ---


// Attach block
Blockly.Arduino['servo_attach'] = function(block) {
  // 1) Get the variable object's clean name
  const cleanVarName = getCleanVariableName(block, 'SERVO_VAR');

  // 2) Build a distinct servo object name based on the clean name:
  //    e.g. MyServo -> servo_MyServo
  //    WARNING: If cleanVarName is "My Servo", this becomes "servo_My Servo" (Invalid C++)
  const servoObj = 'servo_' + cleanVarName;

  const pin = block.getFieldValue('PIN');

  // 3) Make sure Servo.h is always included once:
  Blockly.Arduino.definitions_['include_servo'] = '#include <Servo.h>';

  // 4) Declare your Servo object exactly once, using the clean name for the key
  Blockly.Arduino.definitions_['servo_obj_' + cleanVarName] =
    `Servo ${servoObj};`;

  // 5) In setup(), attach it, using the clean name for the key:
  Blockly.Arduino.setups_['servo_attach_' + cleanVarName] =
    `${servoObj}.attach(${pin});`;

  // This block itself emits no inline code:
  return '';
};

// Detach block
Blockly.Arduino['servo_detach'] = function(block) {
  const cleanVarName = getCleanVariableName(block, 'SERVO_VAR');
  const servoObj = 'servo_' + cleanVarName; // WARNING: Potential C++ naming issue

  // Check if the declaration exists using the clean name key
  if (!Blockly.Arduino.definitions_['servo_obj_' + cleanVarName]) {
    console.warn(
      `Servo detach used on "${cleanVarName}" but no Servo object was declared.`
    );
    return `// ERROR: no Servo declared for ${cleanVarName}\n`;
  }
  return `${servoObj}.detach();\n`;
};

// Write block
Blockly.Arduino['servo_write'] = function(block) {
  const cleanVarName = getCleanVariableName(block, 'SERVO_VAR');
  const servoObj = 'servo_' + cleanVarName; // WARNING: Potential C++ naming issue
  const angle = Blockly.Arduino.valueToCode(
    block, 'DEGREE', Blockly.Arduino.ORDER_ATOMIC
  ) || '90';

  // Check if the declaration exists using the clean name key
  if (!Blockly.Arduino.definitions_['servo_obj_' + cleanVarName]) {
    console.warn(`Servo write used on "${cleanVarName}" but no declaration found.`);
    return `// ERROR: no Servo declared for ${cleanVarName}\n`;
  }
  return `${servoObj}.write(${angle});\n`;
};

// Read block
Blockly.Arduino['servo_read'] = function(block) {
  const cleanVarName = getCleanVariableName(block, 'SERVO_VAR');
  const servoObj = 'servo_' + cleanVarName; // WARNING: Potential C++ naming issue

  // Check if the declaration exists using the clean name key
  if (!Blockly.Arduino.definitions_['servo_obj_' + cleanVarName]) {
    console.warn(`Servo read used on "${cleanVarName}" but no declaration found.`);
    return [
      `/* ERROR: no Servo declared for ${cleanVarName} */ 0`, // Return 0 or similar default
      Blockly.Arduino.ORDER_ATOMIC
    ];
  }
  const code = `${servoObj}.read()`;
  return [code, Blockly.Arduino.ORDER_FUNCTION_CALL]; // .read() is a function call
};