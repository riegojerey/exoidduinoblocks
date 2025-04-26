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
 * This function should be called from app.js after app.js defines the HSL constants
 * and the pin dropdown functions (getDigitalPinOptions).
 */
function defineMotorBlocks() {
    console.log("Defining motor blocks...");

    // Check if HUE constants are available (optional safety check)
    // Use global constants defined in app.js or provide fallbacks
    const MOTOR_HUE = (typeof MOTORS_HUE !== 'undefined') ? MOTORS_HUE : "#FF6680";
    const SERVO_HUE = (typeof FUNCTIONS_HUE !== 'undefined') ? FUNCTIONS_HUE - 30 : 260; // Adjusted based on standard Function HUE
    const STEPPER_HUE = (typeof FUNCTIONS_HUE !== 'undefined') ? FUNCTIONS_HUE - 60 : 230; // Different color for Steppers


     // Check if the global pin function exists, and use it if available
     let pinOptionsFunc = function() { return [["13", "13"]]; }; // Default fallback
     if (typeof window.getDigitalPinOptions === 'function') {
        pinOptionsFunc = window.getDigitalPinOptions; // Use the global function
    } else {
        console.warn("Pin dropdown function (getDigitalPinOptions) not defined globally in app.js. Using fallback pins for motors/servos.");
    }
     let pwmPinOptionsFunc = function() { return [["3", "3"]]; }; // Default fallback
     if (typeof window.getPWMPinOptions === 'function') {
        pwmPinOptionsFunc = window.getPWMPinOptions; // Use the global function
    } else {
        console.warn("Pin dropdown function (getPWMPinOptions) not defined globally in app.js. Using fallback pins for motors/servos.");
    }


    // --- L298N Attach/Setup Block ---
    Blockly.Blocks['l298n_attach'] = {
        init: function() {
            this.appendDummyInput().appendField("Attach L298N").appendField(new Blockly.FieldVariable("myL298N"), "VAR");
            this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("enA").appendField(new Blockly.FieldDropdown(pwmPinOptionsFunc), "ENA").appendField("enB").appendField(new Blockly.FieldDropdown(pwmPinOptionsFunc), "ENB");
            this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("in1").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN1").appendField("in2").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN2");
            this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("in3").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN3").appendField("in4").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "IN4");
            this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(MOTOR_HUE); this.setTooltip("Defines the pins for an L298N motor driver instance."); this.setHelpUrl("");
        }
    };
    // --- L298N Set Direction Block ---
    Blockly.Blocks['l298n_set_direction'] = {
      init: function() {
        this.appendDummyInput().appendField("Set L298N").appendField(new Blockly.FieldVariable("myL298N"), "VAR").appendField("Motor").appendField(new Blockly.FieldDropdown([["A","A"], ["B","B"]]), "MOTOR_CHOICE").appendField("to").appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"], ["Stop","STOP"]]), "DIRECTION");
        this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(MOTOR_HUE); this.setTooltip("Sets the direction of a specific motor (A or B) connected to the L298N."); this.setHelpUrl("");
      }
    };
    // --- L298N Set Speed Block ---
    Blockly.Blocks['l298n_set_speed'] = {
      init: function() {
        this.appendDummyInput().appendField("Set L298N").appendField(new Blockly.FieldVariable("myL298N"), "VAR").appendField("Motor").appendField(new Blockly.FieldDropdown([["A","A"], ["B","B"]]), "MOTOR_CHOICE");
        this.appendDummyInput().appendField("Speed to").appendField(new Blockly.FieldNumber(255, 0, 255), "SPEED");
        this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(MOTOR_HUE); this.setTooltip("Sets the speed (0-255) of a specific motor (A or B) connected to the L298N."); this.setHelpUrl("");
      }
    };

    // --- Servo Block Definitions ---
    Blockly.Blocks['servo_attach'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Attach Servo")
            .appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR"); // Variable field
        this.appendDummyInput()
            .appendField("on Pin")
            .appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN"); // Pin dropdown
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(SERVO_HUE);
        this.setTooltip("Attaches a servo object to a specific pin.");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/attach/");
      }
    };

    Blockly.Blocks['servo_detach'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Detach Servo")
            .appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR"); // Variable field
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(SERVO_HUE);
        this.setTooltip("Detaches a servo object from its pin (allows pin to be used for other things).");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/detach/");
      }
    };

    Blockly.Blocks['servo_write'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Set Servo")
            .appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR");
        this.appendValueInput("DEGREE") // Value input for degrees
            .setCheck("Number")
            .appendField("to Degrees");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(SERVO_HUE);
        this.setTooltip("Sets the servo angle (0-180 degrees).");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/write/");
      }
    };

     Blockly.Blocks['servo_read'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Servo")
            .appendField(new Blockly.FieldVariable("myServo"), "SERVO_VAR")
            .appendField("Angle");
        this.setInputsInline(true);
        this.setOutput(true, "Number"); // Returns the angle
        this.setColour(SERVO_HUE);
        this.setTooltip("Reads the current angle of the servo (the last value written).");
        this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/servo/read/");
      }
    };

    // --- Stepper Block Definitions ---
    Blockly.Blocks['stepper_setup_2pin'] = {
      init: function() {
        this.appendDummyInput().appendField("Setup Stepper (2-pin)").appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Steps/Rev").appendField(new Blockly.FieldNumber(2048, 1), "STEPS");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Pin 1 (Step)").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN1");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Pin 2 (Dir)").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN2");
        this.setInputsInline(false); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(STEPPER_HUE); this.setTooltip("Initializes a 2-pin stepper motor (Step/Dir pins). Requires Stepper.h library."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/stepper/");
      }
    };
     Blockly.Blocks['stepper_setup_4pin'] = {
      init: function() {
        this.appendDummyInput().appendField("Setup Stepper (4-pin)").appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Steps/Rev").appendField(new Blockly.FieldNumber(2048, 1), "STEPS");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Pin 1 (IN1)").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN1");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Pin 2 (IN3)").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN3"); // Note order for library: 1,3,2,4
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Pin 3 (IN2)").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN2");
        this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Pin 4 (IN4)").appendField(new Blockly.FieldDropdown(pinOptionsFunc), "PIN4");
        this.setInputsInline(false); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(STEPPER_HUE); this.setTooltip("Initializes a 4-pin stepper motor (e.g., 28BYJ-48 with ULN2003 driver). Pin order: IN1, IN3, IN2, IN4. Requires Stepper.h library."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/stepper/");
      }
    };
     Blockly.Blocks['stepper_set_speed'] = {
      init: function() {
        this.appendDummyInput().appendField("Set Stepper").appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendDummyInput().appendField("Speed (RPM)").appendField(new Blockly.FieldNumber(60, 1), "SPEED");
        this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(STEPPER_HUE); this.setTooltip("Sets the speed of the stepper motor in revolutions per minute (RPM)."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/setspeed/");
      }
    };
    Blockly.Blocks['stepper_step'] = {
      init: function() {
        this.appendDummyInput().appendField("Stepper").appendField(new Blockly.FieldVariable("myStepper"), "STEPPER_VAR");
        this.appendValueInput("STEPS").setCheck("Number").appendField("Steps");
        this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(STEPPER_HUE); this.setTooltip("Moves the stepper motor a specific number of steps (positive or negative)."); this.setHelpUrl("https://www.arduino.cc/reference/en/libraries/stepper/step/");
      }
    };

    console.log("Motor block definitions complete.");
}

// Define the function globally so app.js can call it
window.defineMotorBlocks = defineMotorBlocks;
