/**
 * @license
 * Arduino code generator for Rotary Encoder blocks using Encoder.h library.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['encoder_init'] = function(block) {
  // Get the actual variable object, not just the ID
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('ENCODER_VAR'));
  // Use the clean variable name directly from the variable object
  var variable_encoder_var = variable.name;
  
  // Make a clean variable identifier for C++ code
  var clean_var_name = variable_encoder_var.replace(/[^a-zA-Z0-9_]/g, '_');
  
  var dropdown_clk_pin = block.getFieldValue('CLK_PIN');
  var dropdown_dt_pin = block.getFieldValue('DT_PIN');
  
  // Add the include for the library
  Blockly.Arduino.definitions_['include_encoder'] = '#include <Encoder.h>';
  
  // Define the Encoder object instance
  // Use the sanitized variable name
  Blockly.Arduino.definitions_['var_encoder_' + clean_var_name] =
    `Encoder ${clean_var_name}(${dropdown_clk_pin}, ${dropdown_dt_pin});`;
  
  // Add a comment indicating pin usage
  Blockly.Arduino.definitions_['encoder_pins_' + clean_var_name] =
    `// Encoder ${clean_var_name} uses CLK=${dropdown_clk_pin}, DT=${dropdown_dt_pin}`;
  
  // Store the mapping between the variable name and its cleaned version
  if (!Blockly.Arduino.encoderVarMap) {
    Blockly.Arduino.encoderVarMap = {};
  }
  Blockly.Arduino.encoderVarMap[variable_encoder_var] = clean_var_name;
  
  // No specific setup code needed here, library handles pins in constructor
  return ''; // This block only defines things
};

Blockly.Arduino['encoder_read'] = function(block) {
  // Get the actual variable object, not just the ID
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('ENCODER_VAR'));
  // Use the clean variable name directly from the variable object
  var variable_encoder_var = variable.name;
  
  // Make a clean variable identifier for C++ code
  var clean_var_name = variable_encoder_var.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Ensure the init block's definition exists (safety check)
  if (!Blockly.Arduino.definitions_['var_encoder_' + clean_var_name]) {
    console.warn(`Encoder read block used for '${variable_encoder_var}' but its setup definition was not found. Code generation might fail.`);
    
    // Create a fallback definition if possible
    Blockly.Arduino.definitions_['include_encoder'] = '#include <Encoder.h>';
    Blockly.Arduino.definitions_['var_encoder_' + clean_var_name] =
      `Encoder ${clean_var_name}(2, 3); // WARNING: Default pins, initialize encoder properly`;
  }
  
  var code = `${clean_var_name}.read()`;
  // Return the function call code and its operator precedence
  return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; // Member access/function call
};

Blockly.Arduino['encoder_write'] = function(block) {
  // Get the actual variable object, not just the ID
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('ENCODER_VAR'));
  // Use the clean variable name directly from the variable object
  var variable_encoder_var = variable.name;
  
  // Make a clean variable identifier for C++ code
  var clean_var_name = variable_encoder_var.replace(/[^a-zA-Z0-9_]/g, '_');
  
  var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  
  // Ensure the init block's definition exists (safety check)
  if (!Blockly.Arduino.definitions_['var_encoder_' + clean_var_name]) {
    console.warn(`Encoder write block used for '${variable_encoder_var}' but its setup definition was not found. Code generation might fail.`);
    
    // Create a fallback definition if possible
    Blockly.Arduino.definitions_['include_encoder'] = '#include <Encoder.h>';
    Blockly.Arduino.definitions_['var_encoder_' + clean_var_name] =
      `Encoder ${clean_var_name}(2, 3); // WARNING: Default pins, initialize encoder properly`;
  }
  
  var code = `${clean_var_name}.write(${value});\n`;
  return code;
};