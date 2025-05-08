/**
 * @license
 * Arduino code generator for Ultrasonic Sensor blocks using NewPing library.
 * Added user-defined max distance and simplified to cm only.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['sensor_ultrasonic_init'] = function(block) {
    var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SONAR_VAR')); // Get the actual variable object from workspace
    var variable_sonar_var = variable.name; // Use the clean variable name from the variable object
    var dropdown_trig_pin = block.getFieldValue('TRIG_PIN'); // Get trigger pin from block
    var dropdown_echo_pin = block.getFieldValue('ECHO_PIN'); // Get echo pin from block
    var max_distance_val = block.getFieldValue('MAX_DIST') || '200'; // Default to 200 if not set
    
    Blockly.Arduino.includes_['include_newping'] = '#include <NewPing.h>'; // Add NewPing library include
    
    var clean_var_name = variable_sonar_var.replace(/[^a-zA-Z0-9_]/g, '_'); // Make a clean variable identifier for C++ code
    
    // Store the initialization info for later use
    Blockly.Arduino.ultrasonic_sensors = Blockly.Arduino.ultrasonic_sensors || {};
    Blockly.Arduino.ultrasonic_sensors[clean_var_name] = {
        trig_pin: dropdown_trig_pin,
        echo_pin: dropdown_echo_pin,
        max_distance: max_distance_val
    };
    
    // Define a constant for max distance (for the sensor_ultrasonic_max_distance block and constructor)
    Blockly.Arduino.definitions_['ultrasonic_0_const_maxdist_' + clean_var_name] =
        `const unsigned int ${clean_var_name}_MAX_DISTANCE = ${max_distance_val}; // Maximum distance in cm for ${clean_var_name}`;
    
    // Instantiate NewPing using the defined constant for max distance
    Blockly.Arduino.definitions_['ultrasonic_1_var_newping_' + clean_var_name] =
        `NewPing ${clean_var_name}(${dropdown_trig_pin}, ${dropdown_echo_pin}, ${clean_var_name}_MAX_DISTANCE); // Ultrasonic sensor using trig=${dropdown_trig_pin}, echo=${dropdown_echo_pin}, max_distance=${clean_var_name}_MAX_DISTANCE cm`;
    
    return ''; // This block only defines things
};

Blockly.Arduino['sensor_ultrasonic_read'] = function(block) {
    var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SONAR_VAR')); // Get the actual variable object from workspace
    var variable_sonar_var = variable.name; // Use the clean variable name from the variable object
    var clean_var_name = variable_sonar_var.replace(/[^a-zA-Z0-9_]/g, '_'); // Make a clean variable identifier for C++ code
    var funcName = 'readUltrasonicDistance_' + clean_var_name; // Generate function name for this sensor instance

    // Get stored initialization info
    var sensorInfo = (Blockly.Arduino.ultrasonic_sensors || {})[clean_var_name];
    
    if (!Blockly.Arduino.definitions_['func_' + funcName]) { // Define the distance reading function if not already defined
        var trigPin, echoPin, maxDist;
        if (sensorInfo) {
            trigPin = sensorInfo.trig_pin;
            echoPin = sensorInfo.echo_pin;
            maxDist = sensorInfo.max_distance;
        } else {
            console.warn(`Ultrasonic read for '${variable_sonar_var}' called without proper initialization. Using default values.`);
            trigPin = 12; // Default fallback pin for trigger
            echoPin = 11; // Default fallback pin for echo
            maxDist = 200; // Default max distance in cm
            
            // Define a constant for max distance even in fallback case
            if (!Blockly.Arduino.definitions_['ultrasonic_0_const_maxdist_' + clean_var_name]) {
                Blockly.Arduino.definitions_['ultrasonic_0_const_maxdist_' + clean_var_name] =
                    `const unsigned int ${clean_var_name}_MAX_DISTANCE = ${maxDist}; // Maximum distance in cm for ${clean_var_name} (default)`;
            }
            // Instantiate NewPing with the defined constant for max distance for fallback
            if (!Blockly.Arduino.definitions_['ultrasonic_1_var_newping_' + clean_var_name]) {
                 Blockly.Arduino.definitions_['ultrasonic_1_var_newping_' + clean_var_name] = 
                    `NewPing ${clean_var_name}(${trigPin}, ${echoPin}, ${clean_var_name}_MAX_DISTANCE); // WARNING: Using default pins and max distance`;
            }
        }

        var funcCode =
        `long ${funcName}() {
    unsigned int pingTime = ${clean_var_name}.ping(); // Get the raw ping time in microseconds
    return ${clean_var_name}.convert_cm(pingTime); // Convert ping time to distance in centimeters; Returns 0 if no echo received within MAX_DISTANCE (NewPing handles this internally based on constructor's max_distance)
}`;
        Blockly.Arduino.definitions_['func_' + funcName] = funcCode;
    }

    var code = `${funcName}()`; // Generate code to call the specific function
    return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; // Return with function call operator precedence
};

Blockly.Arduino['sensor_ultrasonic_max_distance'] = function(block) {
    var variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('SONAR_VAR')); // Get the actual variable object from workspace
    var variable_sonar_var = variable.name; // Use the clean variable name from the variable object
    var clean_var_name = variable_sonar_var.replace(/[^a-zA-Z0-9_]/g, '_'); // Make a clean variable identifier for C++ code
    
    var sensorInfo = (Blockly.Arduino.ultrasonic_sensors || {})[clean_var_name];
    var maxDist_val = sensorInfo ? sensorInfo.max_distance : '200'; // Use stored max distance or default
    
    // Ensure the constant is defined (it should be by sensor_ultrasonic_init or the fallback in sensor_ultrasonic_read)
    if (!Blockly.Arduino.definitions_['ultrasonic_0_const_maxdist_' + clean_var_name]) {
        Blockly.Arduino.definitions_['ultrasonic_0_const_maxdist_' + clean_var_name] =
            `const unsigned int ${clean_var_name}_MAX_DISTANCE = ${maxDist_val}; // Maximum distance in cm for ${clean_var_name}${!sensorInfo ? ' (default)' : ''}`;
    }
    
    var code = `${clean_var_name}_MAX_DISTANCE`; // Use the constant name
    return [code, Blockly.Arduino.ORDER_ATOMIC]; // Return with atomic precedence since it's a constant
};