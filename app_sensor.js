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

// HSL Color constants are assumed to be defined globally in app.js
// Example: const SENSORS_HUE = 40;

/**
 * Defines the visual appearance of all sensor blocks.
 * This function should be called from app.js after app.js defines the HSL constants
 * and the pin dropdown functions (getAnalogPinOptions, getDigitalPinOptions).
 */
function defineSensorBlocks() {
    console.log("Defining sensor blocks...");

    // Check if HUE constant is available (optional safety check)
     if (typeof SENSORS_HUE === 'undefined') {
        console.warn("SENSORS_HUE not defined globally. Using default color.");
        // Use a default color if the constant is missing
        var SENSORS_HUE = 40; // Fallback color
    }
     if (typeof getAnalogPinOptions !== 'function' || typeof getDigitalPinOptions !== 'function') {
         console.error("Pin dropdown functions (getAnalogPinOptions/getDigitalPinOptions) not defined globally.");
         // Provide fallback empty arrays to prevent errors, though dropdowns won't work
         var getAnalogPinOptions = function() { return [["A0","A0"]]; }; // Basic fallback
         var getDigitalPinOptions = function() { return [["13","13"]]; }; // Basic fallback
     }


    // --- Sensor Block Definitions ---
    Blockly.Blocks['sensor_light_condition'] = {
      init: function() {
        this.appendDummyInput().appendField("Light Sensor is").appendField(new Blockly.FieldDropdown([["Light","LIGHT"], ["Dark","DARK"]]), "STATE");
        this.appendDummyInput().appendField("on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); // Uses global function
        this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(SENSORS_HUE); this.setTooltip("Checks if the light sensor reading is light (< 300) or dark (>= 300)."); this.setHelpUrl("");
      }
    };
    Blockly.Blocks['sensor_light_value'] = {
      init: function() {
        this.appendDummyInput().appendField("Light Sensor value on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); // Uses global function
        this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the raw analog value (0-1023) from a light sensor."); this.setHelpUrl("");
      }
    };
    Blockly.Blocks['sensor_potentiometer'] = {
      init: function() {
        this.appendDummyInput().appendField("Potentiometer value on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); // Uses global function
        this.appendDummyInput().appendField("as").appendField(new Blockly.FieldDropdown([["Value (0-1023)","VALUE"], ["Percentage (0-100)","PERCENTAGE"]]), "UNIT");
        this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the value from a potentiometer, either raw (0-1023) or as a percentage (0-100)."); this.setHelpUrl("");
      }
    };
    Blockly.Blocks['sensor_ultrasonic_init'] = {
      init: function() {
        this.appendDummyInput().appendField("Setup Ultrasonic Sensor").appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Trig Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "TRIG_PIN"); // Uses global function
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Echo Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "ECHO_PIN"); // Uses global function
        this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Initializes an ultrasonic sensor using the NewPing library."); this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home");
      }
    };
    Blockly.Blocks['sensor_ultrasonic_read'] = {
      init: function() {
        this.appendDummyInput().appendField("Distance in").appendField(new Blockly.FieldDropdown([["cm","CM"], ["inch","INCH"]]), "UNIT");
        this.appendDummyInput().appendField("from sensor").appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR");
        this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the distance (using NewPing library) from the specified ultrasonic sensor. Returns 0 if no echo."); this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home");
      }
    };

    // --- Encoder Block Definitions ---
    Blockly.Blocks['encoder_init'] = {
      init: function() {
        this.appendDummyInput().appendField("Setup Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Clock Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "CLK_PIN"); // Uses global function
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Data Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "DT_PIN"); // Uses global function
        this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Initializes a rotary encoder using the Encoder library."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html");
      }
    };
    Blockly.Blocks['encoder_read'] = {
      init: function() {
        this.appendDummyInput().appendField("Read Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR");
        this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the current count from the specified encoder."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html");
      }
    };
     Blockly.Blocks['encoder_write'] = {
      init: function() {
        this.appendDummyInput().appendField("Set Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR");
        this.appendValueInput("VALUE").setCheck("Number").appendField("Value");
        this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Sets the internal count of the specified encoder."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html");
      }
    };

    console.log("Sensor block definitions complete.");
}

// Define the function globally so app.js can call it
window.defineSensorBlocks = defineSensorBlocks;
