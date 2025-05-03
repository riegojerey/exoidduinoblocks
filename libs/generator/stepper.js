/**
 * @license
 * Arduino code generator for Stepper Motor blocks using Stepper.h library.
 * Uses Blockly.Variables.getVariable for variable names.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Helper function to get a C++ safe variable name
function getCleanStepperVarName(block, fieldName) {
    const variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue(fieldName));
    if (!variable) {
        console.warn(`Variable for field "${fieldName}" not found on block ${block.type}.`);
        const fieldValue = block.getFieldValue(fieldName);
        return fieldValue ? fieldValue.replace(/[^a-zA-Z0-9_]/g, '_') : 'MISSING_STEPPER_VAR';
    }
    // Clean the user-provided name
    return variable.name.replace(/[^a-zA-Z0-9_]/g, '_');
}


Blockly.Arduino['stepper_setup_2pin'] = function(block) {
  // Get the user-chosen variable name correctly
  var userVariableName = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('STEPPER_VAR'))?.name;
  if (!userVariableName) { return '// ERROR: Stepper variable not found!\n'; }
  var variable_stepper_var = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_'); // Clean for C++

  var steps = block.getFieldValue('STEPS') || '2048';
  var pin1 = block.getFieldValue('PIN1');
  var pin2 = block.getFieldValue('PIN2');

  Blockly.Arduino.definitions_['include_stepper'] = '#include <Stepper.h>';
  // Define the Stepper object instance using the clean variable name
  Blockly.Arduino.definitions_['var_stepper_' + variable_stepper_var] =
    `Stepper ${variable_stepper_var}(${steps}, ${pin1}, ${pin2});`;
  // Add a comment indicating pin usage
  Blockly.Arduino.definitions_['stepper_pins_' + variable_stepper_var] =
    `// Stepper ${variable_stepper_var} uses Step=${pin1}, Dir=${pin2}`;

  return '';
};

Blockly.Arduino['stepper_setup_4pin'] = function(block) {
  var userVariableName = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('STEPPER_VAR'))?.name;
   if (!userVariableName) { return '// ERROR: Stepper variable not found!\n'; }
  var variable_stepper_var = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_'); // Clean for C++

  var steps = block.getFieldValue('STEPS') || '2048';
  var pin1 = block.getFieldValue('PIN1');
  var pin2 = block.getFieldValue('PIN2');
  var pin3 = block.getFieldValue('PIN3');
  var pin4 = block.getFieldValue('PIN4');

  Blockly.Arduino.definitions_['include_stepper'] = '#include <Stepper.h>';
  // Define the Stepper object instance using the clean variable name
  // Note the pin order for the 4-pin constructor: steps, pin1, pin3, pin2, pin4
  Blockly.Arduino.definitions_['var_stepper_' + variable_stepper_var] =
    `Stepper ${variable_stepper_var}(${steps}, ${pin1}, ${pin3}, ${pin2}, ${pin4});`;
   // Add a comment indicating pin usage
  Blockly.Arduino.definitions_['stepper_pins_' + variable_stepper_var] =
    `// Stepper ${variable_stepper_var} uses pins=${pin1}, ${pin3}, ${pin2}, ${pin4}`;

  return '';
};


Blockly.Arduino['stepper_set_speed'] = function(block) {
  var userVariableName = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('STEPPER_VAR'))?.name;
   if (!userVariableName) { return '// ERROR: Stepper variable not found!\n'; }
  var variable_stepper_var = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_'); // Clean for C++

  var speed = Blockly.Arduino.valueToCode(block, 'SPEED', Blockly.Arduino.ORDER_ATOMIC) || '60';

   // Ensure the init block's definition exists (safety check)
   if (!Blockly.Arduino.definitions_['var_stepper_' + variable_stepper_var]) {
       console.warn(`Stepper set speed block used for '${userVariableName}' but its setup definition was not found.`);
       return '// ERROR: Missing setup for stepper ' + userVariableName + '\n';
   }

  return `${variable_stepper_var}.setSpeed(${speed});\n`;
};

Blockly.Arduino['stepper_step'] = function(block) {
  var userVariableName = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('STEPPER_VAR'))?.name;
   if (!userVariableName) { return '// ERROR: Stepper variable not found!\n'; }
  var variable_stepper_var = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_'); // Clean for C++

  var steps = Blockly.Arduino.valueToCode(block, 'STEPS', Blockly.Arduino.ORDER_ATOMIC) || '0';

   // Ensure the init block's definition exists (safety check)
   if (!Blockly.Arduino.definitions_['var_stepper_' + variable_stepper_var]) {
       console.warn(`Stepper step block used for '${userVariableName}' but its setup definition was not found.`);
       return '// ERROR: Missing setup for stepper ' + userVariableName + '\n';
   }

  return `${variable_stepper_var}.step(${steps});\n`;
};
