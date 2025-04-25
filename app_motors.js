/**
 * ExoiDuino - Motor Block Definitions (L298N)
 * Defines the visual appearance of motor blocks.
 * Uses Dropdowns for pin selection.
 */
'use strict';

// Ensure Blockly is loaded before defining blocks
if (typeof Blockly === 'undefined') {
    throw new Error('Blockly core not loaded before app_motors.js!');
}

/**
 * Defines the visual appearance of all motor blocks.
 * This function should be called from app.js after app.js defines the HSL constants
 * and the pin dropdown functions (getDigitalPinOptions).
 */
function defineMotorBlocks() {
    console.log("Defining motor blocks...");

    // Custom Color for motor blocks
    const MOTOR_HUE = "#FF6680";

    // Create a local fallback for pin options if the global function is missing
    let pinOptionsFunc = function() { return [["13", "13"]]; }; // Default fallback

    // Check if the global pin function exists, and use it if available
    if (typeof window.getDigitalPinOptions === 'function') {
        pinOptionsFunc = window.getDigitalPinOptions; // Use the global function
    } else {
        console.warn("Pin dropdown function (getDigitalPinOptions) not defined globally in app.js. Using fallback pins for motors.");
    }

    // --- L298N Setup Block ---
    Blockly.Blocks['l298n_setup'] = {
        init: function() {
            this.appendDummyInput().appendField("Setup DC Motors (L298N)");

            // Use dropdowns for pin selection
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Motor A:")
                .appendField("ENA")
                .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "ENA") // Use function reference
                .appendField("IN1")
                .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN1") // Use function reference
                .appendField("IN2")
                .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN2"); // Use function reference

            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Motor B:")
                .appendField("ENB")
                .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "ENB") // Use function reference
                .appendField("IN3")
                .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN3") // Use function reference
                .appendField("IN4")
                .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN4"); // Use function reference

            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(MOTOR_HUE);
            this.setTooltip("Defines the Arduino pins connected to the L298N driver.");
            this.setHelpUrl("");
        }
    };

    // --- L298N Motor Control Block ---
    Blockly.Blocks['l298n_motor'] = {
        init: function() {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("Set Motor")
                .appendField(new Blockly.FieldDropdown([["A","A"], ["B","B"]]), "MOTOR_CHOICE")
                .appendField("Direction")
                .appendField(new Blockly.FieldDropdown([
                    ["Forward","FORWARD"],
                    ["Backward","BACKWARD"],
                    ["Stop","STOP"]
                ]), "DIRECTION")
                .appendField("Speed (0-255)");

            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(MOTOR_HUE);
            this.setTooltip("Controls the direction and speed of one motor (A or B).");
            this.setHelpUrl("");
        }
    };

    // --- L298N Stop Motors Block ---
    Blockly.Blocks['l298n_stop_motors'] = {
        init: function() {
            this.appendDummyInput().appendField("Stop Both Motors");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(MOTOR_HUE);
            this.setTooltip("Stops both motors A and B.");
            this.setHelpUrl("");
        }
    };

    console.log("Motor block definitions complete.");
}

// Define the function globally so app.js can call it
window.defineMotorBlocks = defineMotorBlocks;
