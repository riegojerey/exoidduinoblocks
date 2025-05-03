/**
 * Input/Output blocks for Arduino
 * Designed for kids' block programming
 */

'use strict';

// Digital State Block (HIGH/LOW)
Blockly.Blocks['io_digital_state'] = {
    init: function() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["HIGH", "HIGH"],
                ["LOW", "LOW"]
            ]), "STATE");
        this.setOutput(true, "State");
        this.setColour(260);
        this.setTooltip("Select HIGH (on) or LOW (off) for digital pins");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/");
    }
};

// Pin Mode Block (INPUT/OUTPUT/INPUT_PULLUP)
Blockly.Blocks['io_pin_mode'] = {
    init: function() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["INPUT", "INPUT"],
                ["OUTPUT", "OUTPUT"],
                ["INPUT_PULLUP", "INPUT_PULLUP"]
            ]), "MODE");
        this.setOutput(true, "Mode");
        this.setColour(260);
        this.setTooltip("Select pin mode:\n- INPUT: Read digital signals\n- OUTPUT: Write digital signals\n- INPUT_PULLUP: Read with internal pull-up resistor");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/");
    }
};

// Analog Pin Block (A0-A5)
Blockly.Blocks['io_analog_pin'] = {
    init: function() {
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["A0", "A0"],
                ["A1", "A1"],
                ["A2", "A2"],
                ["A3", "A3"],
                ["A4", "A4"],
                ["A5", "A5"]
            ]), "PIN");
        this.setOutput(true, "Pin");
        this.setColour(260);
        this.setTooltip("Select an analog pin (A0-A5) for reading analog values (0-1023)");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/");
    }
};

// Digital Write Block
Blockly.Blocks['io_digitalwrite'] = {
    init: function() {
        this.appendValueInput("PIN")
            .setCheck(['Number', 'Pin'])  // Accept numbers and pin type
            .appendField("Digital Write Pin");
        this.appendValueInput("STATE")
            .setCheck(['Number', 'Boolean', 'State'])  // Accept numbers, booleans, and state type
            .appendField("State");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Write HIGH (on) or LOW (off) to a digital pin\nPin must be 0-53\nState must be HIGH or LOW");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/");
    }
};

// Digital Read Block
Blockly.Blocks['io_digitalread'] = {
    init: function() {
        this.appendValueInput("PIN")
            .setCheck(['Number', 'Pin'])  // Accept numbers and pin type
            .appendField("Digital Read Pin");
        this.setOutput(true, "Number");
        this.setColour(260);
        this.setTooltip("Read HIGH (1) or LOW (0) from a digital pin\nPin must be 0-53");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/");
    }
};

// PWM Write Block
Blockly.Blocks['io_pwm_write'] = {
    init: function() {
        this.appendValueInput("PIN")
            .setCheck(['Number', 'Pin'])  // Accept numbers and pin type
            .appendField("Analog Write Pin");
        this.appendValueInput("VALUE")
            .setCheck('Number')  // Only accept numbers
            .appendField("to");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Write an analog value (PWM) to a pin\nPin must be 3,5,6,9,10,11\nValue must be 0-255");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/");
    }
};

// Analog Read Block with Input
Blockly.Blocks['io_analogread_num'] = {
    init: function() {
        this.appendValueInput('PIN')
            .setCheck(['Number', 'Pin'])  // Accept numbers and pin type
            .appendField('Analog Read Pin');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setColour(260);
        this.setTooltip('Read an analog value (0-1023) from an analog pin');
        this.setHelpUrl('https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/');
    }
};

// Analog Read Block with Variable
Blockly.Blocks['io_analogread_var'] = {
    init: function() {
        this.appendDummyInput()
            .appendField('Analog Read Pin')
            .appendField(new Blockly.FieldVariable('pin'), 'PIN');
        this.setOutput(true, 'Number');
        this.setColour(260);
        this.setTooltip('Read an analog value (0-1023) from an analog pin using a variable');
        this.setHelpUrl('https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/');
    }
};

// Pin Mode Block (INPUT/OUTPUT/INPUT_PULLUP)
Blockly.Blocks['io_pinmode'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Set Pin")
            .appendField(new Blockly.FieldVariable("pin"), "PIN");
        this.appendDummyInput()
            .appendField("Mode to")
            .appendField(new Blockly.FieldDropdown([
                ["INPUT", "INPUT"],
                ["OUTPUT", "OUTPUT"],
                ["INPUT_PULLUP", "INPUT_PULLUP"]
            ]), "MODE");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("Set a pin to INPUT, OUTPUT, or INPUT_PULLUP mode\nPin must be 0-53 or a variable\nPLACE THIS BLOCK IN SETUP!");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/");
    }
};

// Pin Mode Block with Variable (INPUT/OUTPUT/INPUT_PULLUP)
Blockly.Blocks['io_pinmode_var'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Set Pin")
            .appendField(new Blockly.FieldVariable("pin"), "PIN");
        this.appendDummyInput()
            .appendField("Mode to")
            .appendField(new Blockly.FieldDropdown([
                ["INPUT", "INPUT"],
                ["OUTPUT", "OUTPUT"],
                ["INPUT_PULLUP", "INPUT_PULLUP"]
            ]), "MODE");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("Set a pin to INPUT, OUTPUT, or INPUT_PULLUP mode using a variable\nPLACE THIS BLOCK IN SETUP!");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/");
    }
};

// Pin Mode Block with Direct Number (INPUT/OUTPUT/INPUT_PULLUP)
Blockly.Blocks['io_pinmode_num'] = {
    init: function() {
        this.appendValueInput("PIN")
            .setCheck('Number')
            .appendField("Set Pin");
        this.appendDummyInput()
            .appendField("Mode to")
            .appendField(new Blockly.FieldDropdown([
                ["INPUT", "INPUT"],
                ["OUTPUT", "OUTPUT"],
                ["INPUT_PULLUP", "INPUT_PULLUP"]
            ]), "MODE");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("Set a pin to INPUT, OUTPUT, or INPUT_PULLUP mode using a direct number (0-53)\nPLACE THIS BLOCK IN SETUP!");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/");
    }
};

// Digital Write Block with Variable
Blockly.Blocks['io_digitalwrite_var'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Digital Write Pin")
            .appendField(new Blockly.FieldVariable("pin"), "PIN");
        this.appendValueInput("STATE")
            .setCheck(['Number', 'Boolean', 'State'])
            .appendField("State");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Write HIGH (on) or LOW (off) to a digital pin using a variable");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/");
    }
};

// Digital Write Block with Number
Blockly.Blocks['io_digitalwrite_num'] = {
    init: function() {
        this.appendValueInput("PIN")
            .setCheck('Number')
            .appendField("Digital Write Pin");
        this.appendValueInput("STATE")
            .setCheck(['Number', 'Boolean', 'State'])
            .appendField("State");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Write HIGH (on) or LOW (off) to a digital pin using a number (0-53)");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/");
    }
};

// PWM Write Block with Variable
Blockly.Blocks['io_pwm_write_var'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Analog Write Pin")
            .appendField(new Blockly.FieldVariable("pin"), "PIN");
        this.appendValueInput("VALUE")
            .setCheck('Number')
            .appendField("to");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Write an analog value (0-255) to a pin using a variable. Uses analogWrite() for PWM output.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/");
    }
};

// PWM Write Block with Number
Blockly.Blocks['io_pwm_write_num'] = {
    init: function() {
        this.appendValueInput("PIN")
            .setCheck('Number')
            .appendField("Analog Write Pin");
        this.appendValueInput("VALUE")
            .setCheck('Number')
            .appendField("to");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(260);
        this.setTooltip("Write an analog value (0-255) to a pin using a number (3,5,6,9,10,11). Uses analogWrite() for PWM output.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/");
    }
};

// Digital Read Block with Variable
Blockly.Blocks['io_digitalread_var'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Digital Read Pin")
            .appendField(new Blockly.FieldVariable("pin"), "PIN");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(260);
        this.setTooltip("Read HIGH (1) or LOW (0) from a digital pin using a variable");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/");
    }
};

// Digital Read Block with Number
Blockly.Blocks['io_digitalread_num'] = {
    init: function() {
        this.appendValueInput("PIN")
            .setCheck('Number')
            .appendField("Digital Read Pin");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(260);
        this.setTooltip("Read HIGH (1) or LOW (0) from a digital pin using a number (0-53)");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/digital-io/digitalread/");
    }
};

// Time Delay Block
Blockly.Blocks['time_delay'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Delay (ms)")
            .appendField(new Blockly.FieldNumber(1000, 0), "DELAY_TIME_MILI");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("Pause the program for a specified number of milliseconds");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/time/delay/");
    }
};

// --- Standard Arduino Structure Blocks ---
Blockly.Blocks['arduino_loop'] = {
    init: function() {
        this.appendStatementInput("LOOP")
            .setCheck(null)
            .appendField("Arduino Loop Forever");
        this.setColour(ARDUINO_GENERAL_HUE);
        this.setTooltip("Code in here repeats forever.");
        this.setHelpUrl("");
    }
}; 