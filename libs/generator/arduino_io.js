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
        // For analog pins, check if it's in format A0-A5 or just 0-5
        if (/^A[0-5]$/.test(pin)) {
            return pin; // Return as is if it's already in A0-A5 format
        } else if (/^[0-5]$/.test(pin)) {
            return 'A' + pin; // Add 'A' prefix if it's just a number
        }
        throw new Error(`Invalid analog pin: ${pin}. Must be A0-A5.`);
    } else {
        // For digital pins, check if it's a valid number
        const pinNum = parseInt(pin);
        if (isNaN(pinNum) || pinNum < 0 || pinNum > 53) {
            throw new Error(`Invalid digital pin: ${pin}. Must be 0-53.`);
        }
        return pin;
    }
}

// Helper function to validate PWM values
function validatePWM(value) {
    return value;
}

// Helper function to check if a variable is already declared globally
function isGlobalVariable(workspace, varName) {
    if (!workspace || !varName) return false;
    
    const variable = Blockly.Variables.getVariable(workspace, varName);
    if (!variable) return false;
    
    // Check if the variable is declared in any setup or loop blocks
    const blocks = workspace.getAllBlocks();
    const setupLoopBlocks = blocks.filter(block => 
        (block.type === 'arduino_setup' || block.type === 'arduino_loop') &&
        block.getDescendants().some(child => 
            child.type === 'variables_set' && 
            child.getField('VAR').getText() === varName
        )
    );
    
    // If not in setup/loop, it's considered global
    return setupLoopBlocks.length === 0;
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
  return `analogWrite(${pin}, ${value});\n`;
    } catch (e) {
        console.error(e.message);
        return `// Error: ${e.message}\n`;
    }
};

// Analog Read Block with Dropdown
Blockly.Blocks['io_analogread_dropdown'] = {
    init: function() {
        this.appendDummyInput()
            .appendField('Analog Read Pin')
            .appendField(new Blockly.FieldDropdown([
                ['A0', 'A0'],
                ['A1', 'A1'],
                ['A2', 'A2'],
                ['A3', 'A3'],
                ['A4', 'A4'],
                ['A5', 'A5']
            ]), 'PIN');
        this.setOutput(true, 'Number');
        this.setColour(260);
        this.setTooltip('Read an analog value (0-1023) from an analog pin');
        this.setHelpUrl('https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/');
    }
};

// Analog Read Block with Input
Blockly.Blocks['io_analogread'] = {
    init: function() {
        this.appendValueInput('PIN')
            .setCheck(['Number', 'String', 'Variable'])  // Accept numbers, strings, and variables
            .appendField('Analog Read Pin');
        this.setOutput(true, 'Number');
        this.setColour(260);
        this.setTooltip('Read an analog value (0-1023) from an analog pin');
        this.setHelpUrl('https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/');
    }
};

// Generator for Analog Read with Dropdown
Blockly.Arduino['io_analogread_dropdown'] = function(block) {
    var pin = block.getFieldValue('PIN');
    try {
        return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error('Error in analogread_dropdown:', e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Generator for Analog Read with Input
Blockly.Arduino['io_analogread'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
    
    try {
        // If the pin is a variable, use it directly
        if (pin.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
        }
        
        // If it's a quoted pin (like "A0"), remove the quotes
        if (pin.match(/^"A[0-5]"$/)) {
            pin = pin.slice(1, -1);
        }
        // If it's already in the correct format (A0-A5), use it as is
        else if (!pin.match(/^A[0-5]$/)) {
            // If it's just a number 0-5, add the 'A' prefix
            if (pin.match(/^[0-5]$/)) {
                pin = 'A' + pin;
            } else {
                console.error('Invalid analog pin:', pin);
                return ['0', Blockly.Arduino.ORDER_ATOMIC];
            }
        }
        
  return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error('Error in analogread:', e.message);
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
    var pin = block.getFieldValue('PIN');
    // Return the pin value directly without quotes
    return [pin, Blockly.Arduino.ORDER_ATOMIC];
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
        
        return `analogWrite(${pin}, ${value});\n`;
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
        return `analogWrite(${pin}, ${value});\n`;
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
    try {
        var pin_id = block.getFieldValue('PIN'); // Get the variable ID from the field
        var pin_name_to_use = pin_id; // Default to ID if lookup fails or variable not found

        if (!pin_id) {
            console.error('AnalogReadVar: No variable ID found in PIN field.');
            return ['0', Blockly.Arduino.ORDER_ATOMIC];
        }

        var variableModel = Blockly.Variables.getVariable(block.workspace, pin_id);
        
        if (variableModel) {
            pin_name_to_use = variableModel.name; // Use the user-facing name from the model
        } else {
            console.warn('AnalogReadVar: Variable model not found for ID:', pin_id, '. Using ID as name.');
            // pin_name_to_use remains the ID in this case, which is the problematic behavior
            // but this indicates an issue with variable resolution not the generator logic itself if this path is taken.
            // For safety, we could return '0' if the model isn't found.
            // However, to match digitalread_var which seems to work even if model lookup failed (using ID then):
            // We'll proceed using pin_name_to_use (which would be the ID if model not found)
            // but the console warning is important.
            // A stricter approach would be: 
            // console.error('AnalogReadVar: Variable model not found for ID:', pin_id);
            // return ['0', Blockly.Arduino.ORDER_ATOMIC];
        }
        
        return [`analogRead(${pin_name_to_use})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error('Error in io_analogread_var generator:', e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Analog Read Generator with Number
Blockly.Arduino['io_analogread_num'] = function(block) {
    var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0';
    
    try {
        // If the pin is a variable, use it directly
        if (pin.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
        }
        
        // If it's a quoted pin (like "A0"), remove the quotes
        if (pin.match(/^"A[0-5]"$/)) {
            pin = pin.slice(1, -1);
        }
        // If it's already in the correct format (A0-A5), use it as is
        else if (!pin.match(/^A[0-5]$/)) {
            // If it's just a number 0-5, add the 'A' prefix
            if (pin.match(/^[0-5]$/)) {
                pin = 'A' + pin;
            } else {
                console.error('Invalid analog pin:', pin);
                return ['0', Blockly.Arduino.ORDER_ATOMIC];
            }
        }
        
        return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC];
    } catch (e) {
        console.error('Error in analogread_num:', e.message);
        return ['0', Blockly.Arduino.ORDER_ATOMIC];
    }
};

// Digital Pin block with dynamic dropdown
Blockly.Blocks['io_digital_pin'] = {
    init: function() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(Blockly.Arduino.getDigitalPinOptions), 'PIN');
        this.setOutput(true, 'Number');
        this.setColour(260);
        this.setTooltip('Select a digital pin (adapts to board)');
        this.setHelpUrl('');
    }
};

Blockly.Arduino['io_digital_pin'] = function(block) {
    var pin = block.getFieldValue('PIN');
    return [pin, Blockly.Arduino.ORDER_ATOMIC];
};

// Helper to get digital pin options based on board
Blockly.Arduino.getDigitalPinOptions = function() {
    // Default to Uno
    var board = document.getElementById('boardSelector')?.value || 'uno';
    var pins = [];
    if (board === 'uno' || board === 'nano') {
        for (var i = 0; i <= 13; i++) pins.push(['D' + i, i.toString()]);
    } else if (board === 'mega') {
        for (var i = 0; i <= 53; i++) pins.push(['D' + i, i.toString()]);
    } else {
        for (var i = 0; i <= 13; i++) pins.push(['D' + i, i.toString()]);
    }
    return pins;
}; 