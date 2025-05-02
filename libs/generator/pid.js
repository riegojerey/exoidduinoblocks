/**
 * @license
 * PID Control Blocks for Arduino
 */
'use strict';

// Ensure Blockly and the Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Helper function to get a C++ safe variable name
function getCleanPIDVarName(block, fieldName) {
    const variable = Blockly.Variables.getVariable(block.workspace, block.getFieldValue(fieldName));
    if (!variable) {
        console.warn(`Variable for field "${fieldName}" not found on block ${block.type}.`);
        const fieldValue = block.getFieldValue(fieldName);
        return fieldValue ? fieldValue.replace(/[^a-zA-Z0-9_]/g, '_') : 'MISSING_PID_VAR';
    }
    return variable.name.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Helper function for error handling
function handleGeneratorError(block, error) {
    console.error(`Error in ${block.type}:`, error);
    return `// ERROR in ${block.type}: ${error.message}\n`;
}

// Generator for PID Create block
Blockly.Arduino['pid_create'] = function(block) {
    var variable = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    if (!variable) { return '// ERROR: PID variable not found!\n'; }

    var kp = Blockly.Arduino.valueToCode(block, 'KP', Blockly.Arduino.ORDER_ATOMIC) || '0.0';
    var ki = Blockly.Arduino.valueToCode(block, 'KI', Blockly.Arduino.ORDER_ATOMIC) || '0.0';
    var kd = Blockly.Arduino.valueToCode(block, 'KD', Blockly.Arduino.ORDER_ATOMIC) || '0.0';
    var sampleTime = Blockly.Arduino.valueToCode(block, 'SAMPLE_TIME', Blockly.Arduino.ORDER_ATOMIC) || '100';

    // Add PID library include
    Blockly.Arduino.includes_['include_pid'] = '#include <PID_v1.h>';

    // Add variable declaration
    Blockly.Arduino.definitions_['var_pid_' + variable] = 
        `double ${variable}_input, ${variable}_output, ${variable}_setpoint;\n` +
        `PID ${variable}(${variable}_input, ${variable}_output, ${variable}_setpoint, ${kp}, ${ki}, ${kd}, DIRECT);`;

    // Add setup code
    Blockly.Arduino.setups_['setup_pid_' + variable] = 
        `${variable}.SetMode(AUTOMATIC);\n` +
        `${variable}.SetSampleTime(${sampleTime});`;

    return '';
};

// Generator for PID Set Limits block
Blockly.Arduino['pid_set_limits'] = function(block) {
    var variable = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    if (!variable) { return '// ERROR: PID variable not found!\n'; }

    var min = Blockly.Arduino.valueToCode(block, 'MIN', Blockly.Arduino.ORDER_ATOMIC) || '0.0';
    var max = Blockly.Arduino.valueToCode(block, 'MAX', Blockly.Arduino.ORDER_ATOMIC) || '255.0';

    return `${variable}.SetOutputLimits(${min}, ${max});\n`;
};

// Generator for PID Compute block
Blockly.Arduino['pid_compute'] = function(block) {
    var variable = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    if (!variable) { return '// ERROR: PID variable not found!\n'; }

    var setpoint = Blockly.Arduino.valueToCode(block, 'SETPOINT', Blockly.Arduino.ORDER_ATOMIC) || '0.0';
    var input = Blockly.Arduino.valueToCode(block, 'INPUT', Blockly.Arduino.ORDER_ATOMIC) || '0.0';

    return `${variable}_setpoint = ${setpoint};\n` +
           `${variable}_input = ${input};\n` +
           `${variable}.Compute();\n`;
};

// Generator for PID Get Output block
Blockly.Arduino['pid_get_output'] = function(block) {
    var variable = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    if (!variable) { return ['0', Blockly.Arduino.ORDER_ATOMIC]; }

    return [`${variable}_output`, Blockly.Arduino.ORDER_ATOMIC];
};

// Generator for PID Reset block
Blockly.Arduino['pid_reset'] = function(block) {
    try {
        var variable = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
        if (!variable) { return '// ERROR: PID variable not found!\n'; }

        return `  // Reset PID ${variable}\n` +
               `  ${variable}.Reset();\n`;
    } catch (error) {
        return handleGeneratorError(block, error);
    }
}; 