/**
 * @license
 * Arduino code generator for Input/Output blocks.
 * Designed for kids' block programming.
 */

'use strict';

// Ensure Blockly and Arduino generator are loaded
if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly and Arduino generator must be loaded first!');
}

// Helper function to validate pin numbers
function validatePin(pin, isAnalog = false) {
    if (isAnalog) {
        // For analog pins, check if it's in format A0-A5
        if (!/^A[0-5]$/.test(pin)) {
            throw new Error(`Invalid analog pin: ${pin}. Must be A0-A5.`);
        }
    } else {
        // For digital pins, check if it's a valid number
        const pinNum = parseInt(pin);
        if (isNaN(pinNum) || pinNum < 0 || pinNum > 53) {
            throw new Error(`Invalid digital pin: ${pin}. Must be 0-53.`);
        }
    }
    return pin;
}

// Helper function to validate PWM values
function validatePWM(value) {
    const num = parseInt(value);
    if (isNaN(num) || num < 0 || num > 255) {
        throw new Error(`Invalid PWM value: ${value}. Must be 0-255.`);
    }
    return num;
}

// Digital Write Generator
Blockly.Arduino['io_digitalwrite'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '13';
    var state = Blockly.Arduino.valueToCode(block, 'STATE', Blockly.Arduino.ORDER_ATOMIC) || 'LOW';
    
    try {
        validatePin(pin);
        if (state !== 'HIGH' && state !== 'LOW') {
            throw new Error(`Invalid state: ${state}. Must be HIGH or LOW.`);
        }
        return `digitalWrite(${pin}, ${state});\n`;
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// Digital Read Generator
Blockly.Arduino['io_digitalread'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
    
    try {
        validatePin(pin);
        return [`digitalRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error(e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// PWM Write Generator
Blockly.Arduino['io_pwm_write'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '3';
    var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '128';
    
    try {
        validatePin(pin);
        const pwmValue = validatePWM(value);
        return `analogWrite(${pin}, ${pwmValue});\n`;
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// Analog Read Generator
Blockly.Arduino['io_analogread'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
    
    try {
        validatePin(pin, true);
        return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error(e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Pin Mode Generator with Variable
Blockly.Arduino['io_pinmode_var'] = function(block) {
    var pin = block.getFieldValue('PIN');
    var mode = block.getFieldValue('MODE');
    
    try {
        // Get the actual variable name from the workspace
        var variable = Blockly.Variables.getVariable(block.workspace, pin);
        if (variable) {
            pin = variable.name;
        }
        
        if (mode !== 'INPUT' && mode !== 'OUTPUT' && mode !== 'INPUT_PULLUP') {
            throw new Error(`Invalid mode: ${mode}. Must be INPUT, OUTPUT, or INPUT_PULLUP.`);
        }
        
        // Add to setup section
        Blockly.Arduino.setups_[`setup_pin_${pin}`] = `pinMode(${pin}, ${mode});`;
        return ''; // No code in loop section
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// Pin Mode Generator with Direct Number
Blockly.Arduino['io_pinmode_num'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '13';
    var mode = block.getFieldValue('MODE');
    
    try {
        validatePin(pin);
        
        if (mode !== 'INPUT' && mode !== 'OUTPUT' && mode !== 'INPUT_PULLUP') {
            throw new Error(`Invalid mode: ${mode}. Must be INPUT, OUTPUT, or INPUT_PULLUP.`);
        }
        
        // Add to setup section
        Blockly.Arduino.setups_[`setup_pin_${pin}`] = `pinMode(${pin}, ${mode});`;
        return ''; // No code in loop section
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// Digital State Generator
Blockly.Arduino['io_digital_state'] = function(block) {
    return [block.getFieldValue('STATE'), Blockly.Arduino.ORDER_ATOMIC];
};

// Pin Mode Options Generator
Blockly.Arduino['io_pin_mode'] = function(block) {
    return [block.getFieldValue('MODE'), Blockly.Arduino.ORDER_ATOMIC];
};

// Analog Pin Generator
Blockly.Arduino['io_analog_pin'] = function(block) {
    return [block.getFieldValue('PIN'), Blockly.Arduino.ORDER_ATOMIC];
};

// Digital Write Generator with Variable
Blockly.Arduino['io_digitalwrite_var'] = function(block) {
    var pin = block.getFieldValue('PIN');
    var state = Blockly.Arduino.valueToCode(block, 'STATE', Blockly.Arduino.ORDER_ATOMIC) || 'LOW';
    
    try {
        // Get the actual variable name from the workspace
        var variable = Blockly.Variables.getVariable(block.workspace, pin);
        if (variable) {
            pin = variable.name;
        }
        
        if (state !== 'HIGH' && state !== 'LOW') {
            throw new Error(`Invalid state: ${state}. Must be HIGH or LOW.`);
        }
        return `digitalWrite(${pin}, ${state});\n`;
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// Digital Write Generator with Number
Blockly.Arduino['io_digitalwrite_num'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '13';
    var state = Blockly.Arduino.valueToCode(block, 'STATE', Blockly.Arduino.ORDER_ATOMIC) || 'LOW';
    
    try {
        validatePin(pin);
        if (state !== 'HIGH' && state !== 'LOW') {
            throw new Error(`Invalid state: ${state}. Must be HIGH or LOW.`);
        }
        return `digitalWrite(${pin}, ${state});\n`;
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// PWM Write Generator with Variable
Blockly.Arduino['io_pwm_write_var'] = function(block) {
    var pin = block.getFieldValue('PIN');
    var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '128';
    
    try {
        // Get the actual variable name from the workspace
        var variable = Blockly.Variables.getVariable(block.workspace, pin);
        if (variable) {
            pin = variable.name;
        }
        
        const pwmValue = validatePWM(value);
        return `analogWrite(${pin}, ${pwmValue});\n`;
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// PWM Write Generator with Number
Blockly.Arduino['io_pwm_write_num'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '3';
    var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '128';
    
    try {
        validatePin(pin);
        const pwmValue = validatePWM(value);
        return `analogWrite(${pin}, ${pwmValue});\n`;
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// Digital Read Generator with Variable
Blockly.Arduino['io_digitalread_var'] = function(block) {
    var pin = block.getFieldValue('PIN');
    
    try {
        // Get the actual variable name from the workspace
        var variable = Blockly.Variables.getVariable(block.workspace, pin);
        if (variable) {
            pin = variable.name;
        }
        
        return [`digitalRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error(e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Digital Read Generator with Number
Blockly.Arduino['io_digitalread_num'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
    
    try {
        validatePin(pin);
        return [`digitalRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error(e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Analog Read Generator with Variable
Blockly.Arduino['io_analogread_var'] = function(block) {
    var pin = block.getFieldValue('PIN');
    
    try {
        // Get the actual variable name from the workspace
        var variable = Blockly.Variables.getVariable(block.workspace, pin);
        if (variable) {
            pin = variable.name;
        }
        
        return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error(e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Analog Read Generator with Number
Blockly.Arduino['io_analogread_num'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
    
    try {
        validatePin(pin, true);
        return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error(e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
}; 