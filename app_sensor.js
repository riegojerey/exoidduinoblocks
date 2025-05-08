/**
 * ExoiDuino - Sensor Block Definitions
 * Defines the visual appearance of sensor blocks.
 * Assumes HSL color constants are defined globally (e.g., in app.js).
 */

'use strict';

// Ensure Blockly is loaded before defining blocks
if (typeof Blockly === 'undefined') {
    throw new Error('Blockly core not loaded before app_sensor.js!');
}

// Use the global pin functions from app.js
function getDigitalPinOptions() {
    return window.getDigitalPinOptions ? window.getDigitalPinOptions() : [
        ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"],
        ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
    ];
}

function getAnalogPinOptions() {
    return window.getAnalogPinOptions ? window.getAnalogPinOptions() : [
        ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]
    ];
}

// Define SENSORS_HUE if not already defined
if (typeof window.SENSORS_HUE === 'undefined') {
    window.SENSORS_HUE = 40;
}

/**
 * Defines the visual appearance of all sensor blocks.
 */
function defineSensorBlocks() {
    // --- Sensor Block Definitions ---
    Blockly.Blocks['sensor_ultrasonic_init'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Setup Ultrasonic Sensor")
                .appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR");
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Trig Pin")
                .appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "TRIG_PIN");
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Echo Pin")
                .appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "ECHO_PIN");
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Max Distance (cm)")
                .appendField(new Blockly.FieldNumber(200, 1, 500, 1), "MAX_DIST");
            this.setInputsInline(false);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Initializes an ultrasonic sensor using the NewPing library. Set max distance in centimeters (1-500cm).");
            this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home");
        }
    };

    Blockly.Blocks['sensor_light_condition'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Light Sensor is")
                .appendField(new Blockly.FieldDropdown([["Light","LIGHT"], ["Dark","DARK"]]), "STATE");
            this.appendDummyInput()
                .appendField("on pin")
                .appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN");
            this.setInputsInline(true);
            this.setOutput(true, "Boolean");
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Checks if the light sensor reading is light (< 300) or dark (>= 300).");
            this.setHelpUrl("");
        }
    };

    Blockly.Blocks['sensor_light_value'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Light Sensor value on pin")
                .appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN");
            this.setInputsInline(true);
            this.setOutput(true, "Number");
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Reads the raw analog value (0-1023) from a light sensor.");
            this.setHelpUrl("");
        }
    };

    Blockly.Blocks['sensor_potentiometer'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Potentiometer value on pin")
                .appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN");
            this.appendDummyInput()
                .appendField("as")
                .appendField(new Blockly.FieldDropdown([["Value (0-1023)","VALUE"], ["Percentage (0-100)","PERCENTAGE"]]), "UNIT");
            this.setInputsInline(true);
            this.setOutput(true, "Number");
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Reads the value from a potentiometer, either raw (0-1023) or as a percentage (0-100).");
            this.setHelpUrl("");
        }
    };

    Blockly.Blocks['sensor_ultrasonic_read'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Distance in cm from sensor")
                .appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR");
            this.setInputsInline(true);
            this.setOutput(true, "Number");
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Reads the distance in centimeters from the specified ultrasonic sensor. Returns 0 if no echo.");
            this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home");
        }
    };

    Blockly.Blocks['sensor_ultrasonic_max_distance'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Max Distance of")
                .appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR");
            this.setOutput(true, "Number");
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Gets the maximum distance value (in cm) configured for this ultrasonic sensor.");
            this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home");
        }
    };

    // --- Encoder Block Definitions ---
    Blockly.Blocks['encoder_init'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Setup Encoder")
                .appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR");
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Clock Pin")
                .appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "CLK_PIN");
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Data Pin")
                .appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "DT_PIN");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Initializes a rotary encoder using the Encoder library.");
            this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html");
        }
    };

    Blockly.Blocks['encoder_read'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Read Encoder")
                .appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR");
            this.setInputsInline(true);
            this.setOutput(true, "Number");
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Reads the current count from the specified encoder.");
            this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html");
        }
    };

    Blockly.Blocks['encoder_write'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Set Encoder")
                .appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR");
            this.appendValueInput("VALUE")
                .setCheck("Number")
                .appendField("Value");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(window.SENSORS_HUE);
            this.setTooltip("Sets the internal count of the specified encoder.");
            this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html");
        }
    };
}

// Make defineSensorBlocks available globally so app.js can call it
window.defineSensorBlocks = defineSensorBlocks;

// Call defineSensorBlocks immediately
defineSensorBlocks();
