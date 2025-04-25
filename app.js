/**
 * ExoiDuino - Blockly Web Editor for Arduino
 * This version assumes generator logic is loaded from separate files
 * in libs/generator/ via the HTML.
 * Defines visuals for custom blocks AND standard Arduino blocks with field inputs.
 * Added Sensor Blocks.
 */

'use strict';

// --- Global Variables ---
let workspace = null;
let currentCode = '';
let serialPort = null;
let serialWriter = null;
let serialReader = null;
let selectedBoard = 'uno'; // Default board

// --- Board Pin Definitions ---
const boardPins = {
    uno: {
        digital: [["0 (RX)", "0"], ["1 (TX)", "1"], ["2", "2"], ["3 (PWM)", "3"], ["4", "4"], ["5 (PWM)", "5"], ["6 (PWM)", "6"], ["7", "7"], ["8", "8"], ["9 (PWM)", "9"], ["10 (PWM)", "10"], ["11 (PWM)", "11"], ["12", "12"], ["13 (LED)", "13"], ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]],
        pwm: [ ["3", "3"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"] ],
        analog: [ ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"] ]
    },
    nano: { // Often same as Uno
        digital: [["0 (RX)", "0"], ["1 (TX)", "1"], ["2", "2"], ["3 (PWM)", "3"], ["4", "4"], ["5 (PWM)", "5"], ["6 (PWM)", "6"], ["7", "7"], ["8", "8"], ["9 (PWM)", "9"], ["10 (PWM)", "10"], ["11 (PWM)", "11"], ["12", "12"], ["13 (LED)", "13"], ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"], ["A6", "A6"], ["A7", "A7"]],
        pwm: [ ["3", "3"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"] ],
        analog: [ ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"], ["A6", "A6"], ["A7", "A7"] ] // Nano has more analog inputs
    },
    mega: {
        digital: [
            ["0 (RX)", "0"], ["1 (TX)", "1"], ["2 (PWM)", "2"], ["3 (PWM)", "3"], ["4 (PWM)", "4"], ["5 (PWM)", "5"], ["6 (PWM)", "6"], ["7 (PWM)", "7"], ["8 (PWM)", "8"], ["9 (PWM)", "9"], ["10 (PWM)", "10"], ["11 (PWM)", "11"], ["12 (PWM)", "12"], ["13 (PWM/LED)", "13"],
            ["14 (TX3)", "14"], ["15 (RX3)", "15"], ["16 (TX2)", "16"], ["17 (RX2)", "17"], ["18 (TX1)", "18"], ["19 (RX1)", "19"], ["20 (SDA)", "20"], ["21 (SCL)", "21"],
            ["22", "22"], ["23", "23"], ["24", "24"], ["25", "25"], ["26", "26"], ["27", "27"], ["28", "28"], ["29", "29"], ["30", "30"], ["31", "31"], ["32", "32"], ["33", "33"], ["34", "34"], ["35", "35"], ["36", "36"], ["37", "37"], ["38", "38"], ["39", "39"], ["40", "40"], ["41", "41"], ["42", "42"], ["43", "43"],
            ["44 (PWM)", "44"], ["45 (PWM)", "45"], ["46 (PWM)", "46"], ["47", "47"], ["48", "48"], ["49", "49"], ["50 (MISO)", "50"], ["51 (MOSI)", "51"], ["52 (SCK)", "52"], ["53 (SS)", "53"],
            ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"], ["A6", "A6"], ["A7", "A7"], ["A8", "A8"], ["A9", "A9"], ["A10", "A10"], ["A11", "A11"], ["A12", "A12"], ["A13", "A13"], ["A14", "A14"], ["A15", "A15"]
        ],
        pwm: [ ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"], ["44", "44"], ["45", "45"], ["46", "46"] ],
        analog: [ ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"], ["A6", "A6"], ["A7", "A7"], ["A8", "A8"], ["A9", "A9"], ["A10", "A10"], ["A11", "A11"], ["A12", "A12"], ["A13", "A13"], ["A14", "A14"], ["A15", "A15"] ]
    }
};

// Function generators for dropdowns
function getDigitalPinOptions() { return boardPins[selectedBoard]?.digital || boardPins['uno'].digital; }
function getPWMPinOptions() { return boardPins[selectedBoard]?.pwm || boardPins['uno'].pwm; }
function getAnalogPinOptions() { return boardPins[selectedBoard]?.analog || boardPins['uno'].analog; }

// --- Define HSL Colors Globally ---
const LOGIC_HUE = 210;
const LOOPS_HUE = 120;
const MATH_HUE = 230;
const TEXTS_HUE = 160;
const LISTS_HUE = 260;
const COLOUR_HUE = 20;
const VARIABLES_HUE = 330;
const FUNCTIONS_HUE = 290;
const ARDUINO_IO_HUE = 260; // Violet
const ARDUINO_TIME_HUE = 140; // Lime Green
const ARDUINO_GENERAL_HUE = 180; // Teal/Cyan
const ARDUINO_SERIAL_HUE = 170; // Teal/Blue
const SENSORS_HUE = 40; // New color for Sensors (Orange/Yellow)


// --- Main Initialization Function ---
function initialize() {
    console.log("DOM parsed. Attempting to initialize ExoiDuino...");
    const boardSelector = document.getElementById('boardSelector');
    selectedBoard = boardSelector ? boardSelector.value : 'uno';

    // --- Check for Web Serial API support ---
    if (!("serial" in navigator)) { /* ... check ... */ }

    // --- Register Custom Blocks (Visual Definition) ---
    defineCustomBlocks(); // Defines L298N, Blink, AND standard Arduino blocks

    // --- Configure and Inject Blockly ---
    const blocklyDiv = document.getElementById('blocklyDiv');
    const toolbox = document.getElementById('toolbox');
    const blocklyOptions = {
        toolbox: toolbox,
        renderer: 'zelos',
        theme: Blockly.Themes.Classic,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
        trashcan: true
    };

    try {
        // Crucial Check
        if (typeof Blockly === 'undefined') { throw new Error("Blockly core library not loaded."); }
        if (typeof Blockly.Arduino === 'undefined') { throw new Error("Arduino generator framework (arduino_generator_init.js) failed to load or define Blockly.Arduino."); }

        // Inject the workspace
        workspace = Blockly.inject(blocklyDiv, blocklyOptions);
        console.log("Blockly workspace injected.");

    } catch (e) { /* ... error handling ... */ return; }

    // --- Setup Event Listeners ---
    workspace.addChangeListener(onWorkspaceChanged);
    boardSelector?.addEventListener('change', handleBoardChange);
    document.getElementById('refreshPortsButton')?.addEventListener('click', populatePortSelector);
    document.getElementById('uploadButton')?.addEventListener('click', handleUpload);
    document.getElementById('serialButton')?.addEventListener('click', handleSerialMonitor);
    window.addEventListener('resize', onResize, false);
    onResize();

    // --- Initial Code Generation - Moved to window.onload ---
    // generateCodeAndUpdatePreview(); // Don't call immediately

    console.log("ExoiDuino Initialization complete (Blockly injected). Waiting for window load for initial code gen.");
    showStatus("Ready. Add blocks, select a port, and generate code.", "info");
}

// --- Run Initial Code Generation AFTER everything loads ---
window.addEventListener('load', () => {
     console.log("Window fully loaded. Performing initial code generation and highlighting.");
    if (workspace) {
        generateCodeAndUpdatePreview();
    } else {
        console.error("Cannot perform initial code generation: Blockly workspace not initialized.");
        showStatus("Error: Workspace initialization failed.", "error");
    }
 });

/**
 * Handles board selection change. Updates global variable and block fields.
 */
function handleBoardChange(event) { /* ... function remains the same ... */ }

/**
 * Handles changes in the Blockly workspace to regenerate code.
 */
function onWorkspaceChanged(event) { /* ... function remains the same ... */ }

/**
 * Generates Arduino code from the workspace and updates the preview.
 */
function generateCodeAndUpdatePreview() { /* ... function remains the same ... */ }

/**
 * Populates the serial port selector dropdown.
 */
async function populatePortSelector() { /* ... function remains the same ... */ }

/**
 * Handles the "Upload" button click.
 */
async function handleUpload() { /* ... function remains the same ... */ }

/**
 * Placeholder for Serial Monitor functionality.
 */
function handleSerialMonitor() { /* ... function remains the same ... */ }

/**
 * Handles window resize event to resize Blockly SVG.
 */
function onResize() { /* ... function remains the same ... */ }

/**
 * Displays status messages to the user.
 */
function showStatus(message, type = 'info') { /* ... function remains the same ... */ }

/**
 * Disables or enables a DOM element.
 */
function disableElement(elementId, disabled) { /* ... function remains the same ... */ }


// --- Custom Block Definitions ---
// Defines the visual appearance and fields of custom blocks
function defineCustomBlocks() {
    // HSL Colors are defined globally above

    // --- L298N Setup Block ---
    Blockly.Blocks['l298n_setup'] = { init: function() { this.appendDummyInput().appendField("Setup L298N Motor Driver"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Motor A:").appendField("ENA").appendField(new Blockly.FieldNumber(5), "ENA").appendField("IN1").appendField(new Blockly.FieldNumber(7), "IN1").appendField("IN2").appendField(new Blockly.FieldNumber(8), "IN2"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Motor B:").appendField("ENB").appendField(new Blockly.FieldNumber(6), "ENB").appendField("IN3").appendField(new Blockly.FieldNumber(9), "IN3").appendField("IN4").appendField(new Blockly.FieldNumber(10), "IN4"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour("#FF6680"); this.setTooltip("Defines the Arduino pins connected to the L298N driver."); this.setHelpUrl(""); } };
    // --- L298N Motor Control Block ---
    Blockly.Blocks['l298n_motor'] = { init: function() { this.appendValueInput("SPEED").setCheck("Number").appendField("Set Motor").appendField(new Blockly.FieldDropdown([["A","A"], ["B","B"]]), "MOTOR_CHOICE").appendField("Direction").appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"], ["Stop","STOP"]]), "DIRECTION").appendField("Speed (0-255)"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour("#FF6680"); this.setTooltip("Controls the direction and speed of one motor (A or B)."); this.setHelpUrl(""); } };
    // --- L298N Stop Motors Block ---
    Blockly.Blocks['l298n_stop_motors'] = { init: function() { this.appendDummyInput().appendField("Stop Both Motors"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour("#FF6680"); this.setTooltip("Stops both motors A and B."); this.setHelpUrl(""); } };
    // --- Blink Built-in LED Block ---
    Blockly.Blocks['inout_buildin_led_blink'] = { init: function() { this.appendDummyInput().appendField("Blink Built-in LED (Pin 13)"); this.appendValueInput("DELAY_TIME").setCheck("Number").appendField("Delay (ms)"); this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Blinks the LED on Pin 13 with the specified delay."); this.setHelpUrl(""); } };

    // --- Standard Arduino Structure Blocks ---
     Blockly.Blocks['arduino_setup'] = { init: function() { this.appendStatementInput("SETUP").appendField("Arduino Setup"); this.setColour(ARDUINO_GENERAL_HUE); this.setTooltip("Code in here runs once at the start."); this.setHelpUrl(""); } };
    Blockly.Blocks['arduino_loop'] = { init: function() { this.appendStatementInput("LOOP").appendField("Arduino Loop Forever"); this.setColour(ARDUINO_GENERAL_HUE); this.setTooltip("Code in here repeats forever."); this.setHelpUrl(""); } };

    // --- Standard Arduino IO Block Definitions (Using Fields) ---
    Blockly.Blocks['io_digitalwrite'] = { init: function() { this.appendDummyInput().appendField("Digital Write Pin#").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "PIN"); this.appendDummyInput().appendField("State").appendField(new Blockly.FieldDropdown([["HIGH","HIGH"], ["LOW","LOW"]]), "STATE"); this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Write HIGH or LOW to a digital pin."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_digitalread'] = { init: function() { this.appendDummyInput().appendField("Digital Read Pin#").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "PIN"); this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Read HIGH or LOW from a digital pin."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_pwm_write'] = { init: function() { this.appendDummyInput().appendField("Set PWM Pin#").appendField(new Blockly.FieldDropdown(getPWMPinOptions), "PIN"); this.appendValueInput("VALUE").setCheck("Number").appendField("Value (0-255)"); this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Write an analog value (PWM) to a specific PWM pin."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_analogread'] = { init: function() { this.appendDummyInput().appendField("Analog Read Pin#").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Read an analog value (0-1023) from an analog pin."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_highlow'] = { init: function() { this.appendDummyInput().appendField(new Blockly.FieldDropdown([["HIGH","HIGH"], ["LOW","LOW"]]), "STATE"); this.setOutput(true, "Boolean"); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Represents HIGH (1) or LOW (0) state."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_pinmode'] = { init: function() { this.appendDummyInput().appendField("Set Pin# Mode").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "PIN"); this.appendDummyInput().appendField(new Blockly.FieldDropdown([["INPUT","INPUT"], ["OUTPUT","OUTPUT"], ["INPUT_PULLUP","INPUT_PULLUP"]]), "MODE"); this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Set a pin to INPUT, OUTPUT, or INPUT_PULLUP."); this.setHelpUrl(""); } };

    // --- Standard Arduino Time Block Definitions ---
    Blockly.Blocks['time_delay'] = { init: function() { this.appendValueInput("DELAY_TIME_MILI").setCheck("Number").appendField("Delay (ms)"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_TIME_HUE); this.setTooltip("Wait for a specified time in milliseconds."); this.setHelpUrl(""); } };
    Blockly.Blocks['time_delaymicros'] = { init: function() { this.appendValueInput("DELAY_TIME_MICRO").setCheck("Number").appendField("Delay Microseconds"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_TIME_HUE); this.setTooltip("Wait for a specified time in microseconds."); this.setHelpUrl(""); } };
    Blockly.Blocks['time_millis'] = { init: function() { this.appendDummyInput().appendField("Milliseconds since start"); this.setOutput(true, "Number"); this.setColour(ARDUINO_TIME_HUE); this.setTooltip("Number of milliseconds since the program started."); this.setHelpUrl(""); } };
    Blockly.Blocks['time_micros'] = { init: function() { this.appendDummyInput().appendField("Microseconds since start"); this.setOutput(true, "Number"); this.setColour(ARDUINO_TIME_HUE); this.setTooltip("Number of microseconds since the program started."); this.setHelpUrl(""); } };

    // --- Standard Arduino Serial Block Definitions ---
    Blockly.Blocks['serial_setup'] = { init: function() { this.appendDummyInput().appendField("Serial Begin Rate").appendField(new Blockly.FieldDropdown([["9600","9600"], ["300","300"], ["1200","1200"], ["2400","2400"], ["4800","4800"], ["14400","14400"], ["19200","19200"], ["28800","28800"], ["38400","38400"], ["57600","57600"], ["115200","115200"]]), "BAUD"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_SERIAL_HUE); this.setTooltip("Initialize serial communication."); this.setHelpUrl(""); } };
    Blockly.Blocks['serial_print'] = { init: function() { this.appendValueInput("CONTENT").appendField("Serial Print"); this.appendDummyInput().appendField("Newline?").appendField(new Blockly.FieldCheckbox("TRUE"), "NEW_LINE"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_SERIAL_HUE); this.setTooltip("Prints data to the serial monitor, optionally adding a new line."); this.setHelpUrl(""); } };
    Blockly.Blocks['serial_available'] = { init: function() { this.appendDummyInput().appendField("Serial Available Bytes"); this.setOutput(true, "Number"); this.setColour(ARDUINO_SERIAL_HUE); this.setTooltip("Number of bytes available for reading from serial port."); this.setHelpUrl(""); } };
    Blockly.Blocks['serial_read'] = { init: function() { this.appendDummyInput().appendField("Serial Read Byte"); this.setOutput(true, "Number"); this.setColour(ARDUINO_SERIAL_HUE); this.setTooltip("Reads incoming serial data (one byte)."); this.setHelpUrl(""); } };

    // --- Sensor Block Definitions ---
    Blockly.Blocks['sensor_light_condition'] = {
      init: function() {
        this.appendDummyInput().appendField("Light Sensor is").appendField(new Blockly.FieldDropdown([["Light","LIGHT"], ["Dark","DARK"]]), "STATE");
        this.appendDummyInput().appendField("on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN");
        this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(SENSORS_HUE); this.setTooltip("Checks if the light sensor reading is light (< 300) or dark (>= 300)."); this.setHelpUrl("");
      }
    };
    Blockly.Blocks['sensor_light_value'] = {
      init: function() {
        this.appendDummyInput().appendField("Light Sensor value on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN");
        this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the raw analog value (0-1023) from a light sensor."); this.setHelpUrl("");
      }
    };
     Blockly.Blocks['sensor_potentiometer'] = {
      init: function() {
        this.appendDummyInput().appendField("Potentiometer value on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN");
        this.appendDummyInput().appendField("as").appendField(new Blockly.FieldDropdown([["Value (0-1023)","VALUE"], ["Percentage (0-100)","PERCENTAGE"]]), "UNIT");
        this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the value from a potentiometer, either raw (0-1023) or as a percentage (0-100)."); this.setHelpUrl("");
      }
    };

    // --- Standard Block Definitions (Logic, Loops, Math, Text) ---
    // We *don't* need to define these here if blocks.min.js is loading correctly from CDN.
    // If blocks still disappear, uncommenting these might be necessary.
    // Blockly.Blocks['controls_if'] = Blockly.Blocks['controls_if'] || { init: function() { /*...*/ this.setColour(LOGIC_HUE); /*...*/ } };
    // ... etc for Logic, Loops, Math, Text ...


} // end defineCustomBlocks


// --- Initialize the Application ---
initialize();
