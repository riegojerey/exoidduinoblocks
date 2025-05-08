/**
 * @license
 * Arduino code generator for L298N blocks (New Structure).
 * Uses Blockly.Variables.getVariable for variable names.
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Helper function to get a C++ safe variable name
function getCleanL298NVarName(block, fieldName) {
    const variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue(fieldName));
    if (!variable) {
        console.warn(`Variable for field "${fieldName}" not found on block ${block.type}.`);
        const fieldValue = block.getFieldValue(fieldName);
        return fieldValue ? fieldValue.replace(/[^a-zA-Z0-9_]/g, '_') : 'MISSING_L298N_VAR';
    }
    return variable.name.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Helper function for error handling
function handleGeneratorError(block, error) {
    console.error(`Error in ${block.type}:`, error);
    return `// ERROR in ${block.type}: ${error.message}\n`;
}

// Generator for the L298N Attach/Setup Block
Blockly.Arduino['l298n_attach'] = function(block) {
    try {
        var userVariableName = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('VAR'))?.name;
        if (!userVariableName) { return '// ERROR: L298N variable not found!\n'; }
        var variable_l298n_var = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_');

        let ena = block.getFieldValue('ENA');
        let in1 = block.getFieldValue('IN1');
        let in2 = block.getFieldValue('IN2');
        let enb = block.getFieldValue('ENB');
        let in3 = block.getFieldValue('IN3');
        let in4 = block.getFieldValue('IN4');

        // Store pin assignments in definitions
        Blockly.Arduino.definitions_['l298n_pins_' + variable_l298n_var] =
            `// L298N ${variable_l298n_var} Pins\n` +
            `const int ${variable_l298n_var}_ENA = ${ena};\n` +
            `const int ${variable_l298n_var}_IN1 = ${in1};\n` +
            `const int ${variable_l298n_var}_IN2 = ${in2};\n` +
            `const int ${variable_l298n_var}_ENB = ${enb};\n` +
            `const int ${variable_l298n_var}_IN3 = ${in3};\n` +
            `const int ${variable_l298n_var}_IN4 = ${in4};`;

        // Set pin modes in setup
        Blockly.Arduino.setups_['setup_l298n_' + variable_l298n_var] =
            `// Setup L298N ${variable_l298n_var}\n` +
            `  pinMode(${variable_l298n_var}_ENA, OUTPUT);\n` +
            `  pinMode(${variable_l298n_var}_IN1, OUTPUT);\n` +
            `  pinMode(${variable_l298n_var}_IN2, OUTPUT);\n` +
            `  pinMode(${variable_l298n_var}_ENB, OUTPUT);\n` +
            `  pinMode(${variable_l298n_var}_IN3, OUTPUT);\n` +
            `  pinMode(${variable_l298n_var}_IN4, OUTPUT);\n` +
            `  // Initialize motors stopped\n` +
            `  digitalWrite(${variable_l298n_var}_IN1, LOW);\n` +
            `  digitalWrite(${variable_l298n_var}_IN2, LOW);\n` +
            `  digitalWrite(${variable_l298n_var}_IN3, LOW);\n` +
            `  digitalWrite(${variable_l298n_var}_IN4, LOW);\n` +
            `  analogWrite(${variable_l298n_var}_ENA, 0);\n` +
            `  analogWrite(${variable_l298n_var}_ENB, 0);`;

        return ''; // This block only affects definitions and setup
    } catch (error) {
        return handleGeneratorError(block, error);
    }
};

// Generator for the L298N Set Direction Block
Blockly.Arduino['l298n_set_direction'] = function(block) {
    try {
        var userVariableName = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('VAR'))?.name;
        if (!userVariableName) { return '// ERROR: L298N variable not found!\n'; }
        var variable_l298n_var = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_');

        let motor = block.getFieldValue('MOTOR_CHOICE');
        let direction = block.getFieldValue('DIRECTION');

        // Ensure the setup block's definitions exist
        if (!Blockly.Arduino.definitions_['l298n_pins_' + variable_l298n_var]) {
            console.warn(`L298N set direction used for '${userVariableName}' but its setup definition was not found.`);
            return `// ERROR: Missing setup for L298N ${userVariableName}\n`;
        }

        let pin_in1 = (motor === 'A') ? `${variable_l298n_var}_IN1` : `${variable_l298n_var}_IN3`;
        let pin_in2 = (motor === 'A') ? `${variable_l298n_var}_IN2` : `${variable_l298n_var}_IN4`;
        let pin_en = (motor === 'A') ? `${variable_l298n_var}_ENA` : `${variable_l298n_var}_ENB`;
        let code = '';

        switch (direction) {
            case 'FORWARD':
                code += `digitalWrite(${pin_in1}, HIGH);\n`;
                code += `  digitalWrite(${pin_in2}, LOW);\n`;
                break;
            case 'BACKWARD':
                code += `digitalWrite(${pin_in1}, LOW);\n`;
                code += `  digitalWrite(${pin_in2}, HIGH);\n`;
                break;
            case 'STOP':
                code += `digitalWrite(${pin_in1}, LOW);\n`;
                code += `  digitalWrite(${pin_in2}, LOW);\n`;
                code += `  analogWrite(${pin_en}, 0);\n`;
                break;
            case 'BRAKE':
                code += `digitalWrite(${pin_in1}, HIGH);\n`;
                code += `  digitalWrite(${pin_in2}, HIGH);\n`;
                code += `  analogWrite(${pin_en}, 255);\n`;
                break;
        }
        return `  // Set Motor ${motor} Direction for ${userVariableName}\n` + code;
    } catch (error) {
        return handleGeneratorError(block, error);
    }
};

// Generator for the L298N Set Speed Block
Blockly.Arduino['l298n_set_speed'] = function(block) {
    try {
        var userVariableName = Blockly.Variables.getVariable(block.workspace, block.getFieldValue('VAR'))?.name;
        if (!userVariableName) { return '// ERROR: L298N variable not found!\n'; }
        var variable_l298n_var = userVariableName.replace(/[^a-zA-Z0-9_]/g, '_');

        let motor = block.getFieldValue('MOTOR_CHOICE');
        let speed = Blockly.Arduino.valueToCode(block, 'SPEED', Blockly.Arduino.ORDER_ATOMIC) || '0';

        // Ensure the setup block's definitions exist
        if (!Blockly.Arduino.definitions_['l298n_pins_' + variable_l298n_var]) {
            console.warn(`L298N set speed used for '${userVariableName}' but its setup definition was not found.`);
            return `// ERROR: Missing setup for L298N ${userVariableName}\n`;
        }

        let pin_en = (motor === 'A') ? `${variable_l298n_var}_ENA` : `${variable_l298n_var}_ENB`;

        // Only use constrain() if the speed is a variable or expression
        // If it's a literal number, we can check at generation time
        let speedValue = parseInt(speed);
        if (!isNaN(speedValue)) {
            // For literal numbers, we can validate at generation time
            speedValue = Math.max(0, Math.min(255, speedValue));
            return `  // Set Motor ${motor} Speed for ${userVariableName}\n` +
                   `  analogWrite(${pin_en}, ${speedValue});\n`;
        } else {
            // For variables or expressions, we need runtime constraining
            return `  // Set Motor ${motor} Speed for ${userVariableName}\n` +
                   `  analogWrite(${pin_en}, constrain(${speed}, 0, 255));\n`;
        }
    } catch (error) {
        return handleGeneratorError(block, error);
    }
};

// REMOVE Generators for old blocks if they exist
// delete Blockly.Arduino['l298n_setup'];
// delete Blockly.Arduino['l298n_motor'];
// delete Blockly.Arduino['l298n_stop_motors'];
