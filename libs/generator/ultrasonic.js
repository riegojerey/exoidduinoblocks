/**
 * @license
 * Arduino code generator for Ultrasonic Sensor blocks using NewPing library.
 * Fixed variable naming issue.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['sensor_ultrasonic_init'] = function(block) {
  // Get the actual variable object, not just the ID
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SONAR_VAR'));
  // Use the clean variable name directly from the variable object
  var variable_sonar_var = variable.name;
  
  // Get the pin numbers chosen by the user
  var dropdown_trig_pin = block.getFieldValue('TRIG_PIN');
  var dropdown_echo_pin = block.getFieldValue('ECHO_PIN');
  var max_distance = 200; // Default max distance in cm for NewPing

  // Add the include for the library
  Blockly.Arduino.definitions_['include_newping'] = '#include <NewPing.h>';

  // Make a clean variable identifier for C++ code
  var clean_var_name = variable_sonar_var.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Define the NewPing object instance
  Blockly.Arduino.definitions_['var_sonar_' + clean_var_name] =
    `NewPing ${clean_var_name}(${dropdown_trig_pin}, ${dropdown_echo_pin}, ${max_distance});`;

  // Store pin mapping for reference if needed later
  Blockly.Arduino.definitions_['ultrasonic_pins_' + clean_var_name] = 
    `// Ultrasonic sensor ${clean_var_name} uses trig=${dropdown_trig_pin}, echo=${dropdown_echo_pin}`;

  return ''; // This block only defines things
};

Blockly.Arduino['sensor_ultrasonic_read'] = function(block) {
  var dropdown_unit = block.getFieldValue('UNIT');
  
  // Get the actual variable object, not just the ID
  var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SONAR_VAR'));
  // Use the clean variable name directly from the variable object
  var variable_sonar_var = variable.name;
  
  // Make a clean variable identifier for C++ code
  var clean_var_name = variable_sonar_var.replace(/[^a-zA-Z0-9_]/g, '_');

  // Generate a call to the specific function for this sensor instance
  var funcName = 'readUltrasonicDistance_' + clean_var_name;

  // Define the distance reading function if not already defined
  if (!Blockly.Arduino.definitions_['func_' + funcName]) {
      // Check if we can find the initialization block
      var initFound = Blockly.Arduino.definitions_['var_sonar_' + clean_var_name] !== undefined;
      
      if (!initFound) {
          console.warn(`Ultrasonic read for '${variable_sonar_var}' called without proper initialization.`);
          
          // Create fallback definitions - assuming default pins if missing init block
          var trigPin = 12;  // Default fallback
          var echoPin = 11;  // Default fallback
          
          Blockly.Arduino.definitions_['include_newping'] = '#include <NewPing.h>';
          Blockly.Arduino.definitions_['var_sonar_' + clean_var_name] = 
              `NewPing ${clean_var_name}(${trigPin}, ${echoPin}, 200); // WARNING: Default pins, initialize sensor properly`;
      }

      var funcCode =
      `long ${funcName}(String unit) {
  // Use the NewPing library's ping method which handles timing and returns duration or distance
  if (unit == "CM") {
      return ${clean_var_name}.ping_cm(); // Returns distance in cm (0 = no echo)
  } else { // INCH
      return ${clean_var_name}.ping_in(); // Returns distance in inches (0 = no echo)
  }
  // Note: NewPing returns 0 for no echo within MAX_DISTANCE.
}`;
      Blockly.Arduino.definitions_['func_' + funcName] = funcCode;
  }

  // Generate the code to call the specific function
  var code = `${funcName}("${dropdown_unit}")`;
  return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; // Function call order
};