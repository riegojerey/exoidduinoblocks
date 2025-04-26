/**
 * ExoiDuino - Motor Block Definitions (L298N, Servo, Stepper)
 * Defines the visual appearance of motor blocks.
 */

'use strict';

// Ensure Blockly is loaded before defining blocks
if (typeof Blockly === 'undefined') {
    throw new Error('Blockly core not loaded before app_motors.js!');
}

// HSL Color constants and pin dropdown functions are assumed to be defined globally in app.js

/**
 * Defines the visual appearance of all motor blocks.
 * This function should be called from app.js after app.js defines the HSL constants.
 */
function defineMotorBlocks() {
    console.log("Defining motor blocks...");

    // Check if HUE constants are available (optional safety check)
    const MOTOR_HUE = MOTORS_HUE || "#FF6680"; // Use global or fallback
    const SERVO_HUE = (typeof FUNCTIONS_HUE !== 'undefined') ? FUNCTIONS_HUE - 30 : 260; // Slightly different color for Servos
    const STEPPER_HUE = (typeof FUNCTIONS_HUE !== 'undefined') ? FUNCTIONS_HUE - 60 : 230; // Different color for Steppers


    // Create a local fallback for pin options if the global function is missing
    let pinOptionsFunc = function() { return [["13", "13"]]; }; // Default fallback

    // Check if the global pin function exists, and use it if available
    if (typeof window.getDigitalPinOptions === 'function') {
        pinOptionsFunc = window.getDigitalPinOptions; // Use the global function
    } else {
        console.warn("Pin dropdown function (getDigitalPinOptions) not defined globally in app.js. Using fallback pins for motors/servos.");
    }

    // --- L298N Setup Block ---
    Blockly.Blocks['l298n_setup'] = {
        init: function() {
            this.appendDummyInput().appendField("Setup DC Motors (L298N)");
            this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Motor A:").appendField("ENA").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "ENA").appendField("IN1").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN1").appendField("IN2").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN2");
            this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Motor B:").appendField("ENB").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "ENB").appendField("IN3").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN3").appendField("IN4").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN4");
            this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(MOTOR_HUE); this.setTooltip("Defines the Arduino pins connected to the L298N driver."); this.setHelpUrl("");
        }
    };
    // --- L298N Motor Control Block ---
    Blockly.Blocks['l298n_motor'] = {
      init: function() {
        this.appendValueInput("SPEED").setCheck("Number").appendField("Set Motor").appendField(new Blockly.FieldDropdown([["A","A"], ["B","B"]]), "MOTOR_CHOICE").appendField("Direction").appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"], ["Stop","STOP"]]), "DIRECTION").appendField("Speed (0-255)");
        this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(MOTOR_HUE); this.setTooltip("Controls the direction and speed of one motor (A or B)."); this.setHelpUrl("");
      }
    };
    // --- L298N Stop Motors Block ---
    Blockly.Blocks['l298n_stop_motors'] = {
      init: function() { this.appendDummyInput().appendField("Stop Both Motors"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(MOTOR_HUE); this.setTooltip("Stops both motors A and B."); this.setHelpUrl(""); }
    };

    // --- Servo Block Definitions ---
    Blockly.Blocks['servo_attach'] = {
      init: function() {
        this.appendDummyInput().appendField("Attach Servo").appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR");
        this.appendDummyInput().appendField("on Pin").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN");
        this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SERVO_HUE); this.setTooltip("Attaches a servo object to a specific pin."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/attach/");
      }
    };
    Blockly.Blocks['servo_detach'] = {
      init: function() {
        this.appendDummyInput().appendField("Detach Servo").appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR");
        this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SERVO_HUE); this.setTooltip("Detaches a servo object from its pin."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/detach/");
      }
    };
    Blockly.Blocks['servo_write'] = {
      init: function() {
        this.appendDummyInput().appendField("Set Servo").appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR");
        this.appendValueInput("DEGREE").setCheck("Number").appendField("to Degrees");
        this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SERVO_HUE); this.setTooltip("Sets the servo angle (0-180 degrees)."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/write/");
      }
    };
     Blockly.Blocks['servo_read'] = {
      init: function() {
        this.appendDummyInput().appendField("Servo").appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR").appendField("Angle");
        this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SERVO_HUE); this.setTooltip("Reads the current angle of the servo (the last value written)."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/read/");
      }
    };

    // --- NEW Stepper Block Definitions ---
    Blockly.Blocks['stepper_setup_2pin'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Setup Stepper")
            .appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Steps/Rev")
            .appendField(new Blockly.FieldNumber(2048, 1), "STEPS"); // Default 2048 for common 28BYJ-48
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Pin 1")
            .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN1");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Pin 2")
            .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN2");
        this.setInputsInline(false); // Keep inputs on separate lines for clarity
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(STEPPER_HUE);
        this.setTooltip("Initializes a 2-pin stepper motor (e.g., using EasyDriver/A4988 Step/Dir pins).");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/stepper/");
      }
    };

     Blockly.Blocks['stepper_setup_4pin'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Setup Stepper")
            .appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Steps/Rev")
            .appendField(new Blockly.FieldNumber(2048, 1), "STEPS"); // Default 2048
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Pin 1")
            .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN1");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Pin 2")
            .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN2");
         this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Pin 3")
            .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN3");
        this.appendDummyInput()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Pin 4")
            .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN4");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(STEPPER_HUE);
        this.setTooltip("Initializes a 4-pin stepper motor (e.g., 28BYJ-48 with ULN2003 driver).");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/stepper/");
      }
    };

     Blockly.Blocks['stepper_set_speed'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Set Stepper")
            .appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendValueInput("SPEED")
            .setCheck("Number")
            .appendField("Speed (RPM)");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(STEPPER_HUE);
        this.setTooltip("Sets the speed of the stepper motor in revolutions per minute (RPM).");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/setspeed/");
      }
    };

    Blockly.Blocks['stepper_step'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Stepper")
            .appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendValueInput("STEPS")
            .setCheck("Number")
            .appendField("Steps");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(STEPPER_HUE);
        this.setTooltip("Moves the stepper motor a specific number of steps (positive or negative).");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/step/");
      }
    };


    console.log("Motor block definitions complete.");
}

// Define the function globally so app.js can call it
window.defineMotorBlocks = defineMotorBlocks;
