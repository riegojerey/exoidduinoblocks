/**
 * ExoiDuino - Blockly Web Editor for Arduino
 * Main application logic.
 * Assumes generator logic is loaded from separate files in libs/generator/.
 * Assumes motor block definitions are loaded from app_motors.js.
 * Defines visuals for standard Arduino blocks, Blink block, and Sensor blocks.
 * Uses DOMContentLoaded to ensure HTML is ready before initialize() runs.
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

// Function generators for dropdowns - Defined globally
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
const MOTORS_HUE = "#FF6680"; // Custom Color for Motors


// --- Main Initialization Function ---
function initialize() {
    console.log("DOM parsed. Attempting to initialize ExoiDuino...");
    const boardSelector = document.getElementById('boardSelector');
    selectedBoard = boardSelector ? boardSelector.value : 'uno';

    // --- Check for Web Serial API support ---
    if (!("serial" in navigator)) {
        showStatus("Warning: Web Serial API not supported by this browser. Connect/Serial features disabled.", "warning");
        disableElement('refreshPortsButton', true);
        disableElement('portSelector', true);
        disableElement('uploadButton', true);
        disableElement('serialButton', true);
    }

    // --- Register Block Definitions ---
    defineAllBlocks(); // Defines Base, IO, Time, Serial, Blink, AND Sensors
    // defineBaseBlocks(); // Renamed back for clarity
    if (typeof defineMotorBlocks === "function") {
        defineMotorBlocks(); // Call function from app_motors.js
    } else {
        console.error("defineMotorBlocks function not found. Ensure app_motors.js is loaded before app.js.");
        showStatus("Error: Motor block definitions failed to load.", "error");
    }


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

    } catch (e) {
        console.error("Error injecting Blockly or prerequisites missing:", e);
        showStatus(`FATAL ERROR: Could not initialize Blockly workspace: ${e.message}`, "error");
        blocklyDiv.innerHTML = `<p style='color:red; font-weight:bold;'>Error initializing Blockly: ${e.message}. Check console (F12) and ensure all library scripts loaded correctly.</p>`;
        return; // Stop initialization
    }

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
function handleBoardChange(event) {
    selectedBoard = event.target.value;
    console.log("Board changed to:", selectedBoard);
    showStatus(`Board set to ${selectedBoard}. Pin options updated.`, "info");

    // --- Update existing blocks ---
    if (workspace) {
        const blocksToUpdate = [
            'io_digitalwrite', 'io_digitalread', 'io_pwm_write',
            'io_analogread', 'io_pinmode',
            'sensor_light_condition', 'sensor_light_value', 'sensor_potentiometer',
            'sensor_ultrasonic_init', 'encoder_init',
            'l298n_setup' // Add L298N setup if its fields need updating (currently they don't)
        ];
        workspace.getAllBlocks(false).forEach(block => {
            if (blocksToUpdate.includes(block.type)) {
                // Update TRIG_PIN if it exists
                const trigPinField = block.getField('TRIG_PIN');
                 if (trigPinField instanceof Blockly.FieldDropdown) { updateDropdownField(trigPinField, getDigitalPinOptions()); }
                // Update ECHO_PIN if it exists
                const echoPinField = block.getField('ECHO_PIN');
                 if (echoPinField instanceof Blockly.FieldDropdown) { updateDropdownField(echoPinField, getDigitalPinOptions()); }
                 // Update CLK_PIN dropdown if it exists (for encoder)
                const clkPinField = block.getField('CLK_PIN');
                 if (clkPinField instanceof Blockly.FieldDropdown) { updateDropdownField(clkPinField, getDigitalPinOptions()); }
                 // Update DT_PIN dropdown if it exists (for encoder)
                const dtPinField = block.getField('DT_PIN');
                 if (dtPinField instanceof Blockly.FieldDropdown) { updateDropdownField(dtPinField, getDigitalPinOptions()); }
                // Update PIN if it exists
                const pinField = block.getField('PIN');
                if (pinField instanceof Blockly.FieldDropdown) {
                    let newOptions;
                    if (block.type === 'io_pwm_write') { newOptions = getPWMPinOptions(); }
                    else if (block.type === 'io_analogread' || block.type.startsWith('sensor_')) { newOptions = getAnalogPinOptions(); }
                    else { newOptions = getDigitalPinOptions(); }
                    updateDropdownField(pinField, newOptions);
                }
            }
        });
    }
     generateCodeAndUpdatePreview();
}

/**
 * Helper function to update options and value of a dropdown field.
 */
function updateDropdownField(field, newOptions) {
    const currentValue = field.getValue();
    let valueStillValid = newOptions.some(option => option[1] === currentValue);
    const validator = field.getValidator();
    field.setValidator(null); // Temporarily remove validator
    field.menuGenerator_ = newOptions; // Update options
    // Set value: keep if valid, otherwise set to first option
    if (!valueStillValid && newOptions.length > 0) {
        field.setValue(newOptions[0][1]);
    } else {
        // Force re-render even if value is the same, to show new options
        field.setValue('force_rerender_dummy_value'); // Temporary dummy value
        field.setValue(currentValue); // Set back to original (or first valid if it changed)
    }
    field.setValidator(validator); // Restore validator
}


/**
 * Handles changes in the Blockly workspace to regenerate code.
 */
function onWorkspaceChanged(event) {
    if (!workspace) return;
    if (event.isUiEvent || event.type == Blockly.Events.VIEWPORT_CHANGE || event.type == Blockly.Events.SELECTED) { return; }
    generateCodeAndUpdatePreview();
}

/**
 * Generates Arduino code from the workspace and updates the preview.
 */
function generateCodeAndUpdatePreview() {
     if (!workspace) return;
    if (typeof Blockly.Arduino === 'undefined') { console.error("generateCodeAndUpdatePreview: Blockly.Arduino generator object not found!"); showStatus("Error: Arduino code generator failed.", "error"); return; }
    try {
        currentCode = Blockly.Arduino.workspaceToCode(workspace);
        const codePreview = document.getElementById('codeDiv');
        if (codePreview) {
            codePreview.textContent = currentCode || '/* Add blocks to generate code */';
            if (window.Prism && typeof Prism.highlightElement === 'function' && Prism.languages && Prism.languages.clike && Prism.languages.cpp) {
                 const elementToHighlight = document.getElementById('codeDiv');
                 if (elementToHighlight) {
                    try { Prism.highlightElement(elementToHighlight); console.log("Prism highlighting applied."); }
                    catch(prismError) { console.error("Prism highlighting failed:", prismError); showStatus("Syntax highlighting error.", "warning"); }
                 }
            } else { console.warn("Prism or required languages not ready for highlighting."); }
        } else { console.error("Code preview element ('codeDiv') not found."); }
    } catch (e) {
        console.error("Error generating Arduino code:", e); showStatus("Error generating code. See console for details.", "error");
        const codePreview = document.getElementById('codeDiv'); if (codePreview) codePreview.textContent = `/* Error generating code: ${e.message}. Check blocks and console. */`; currentCode = '';
    }
}


/**
 * Populates the serial port selector dropdown.
 */
async function populatePortSelector() {
    const portSelector = document.getElementById('portSelector');
    if (!portSelector || !("serial" in navigator)) return;

    showStatus("Requesting serial ports...", "info");
    disableElement('refreshPortsButton', true);

    try {
        await navigator.serial.requestPort(); // Prompt user
        const ports = await navigator.serial.getPorts();
        portSelector.innerHTML = '<option value="">-- Select Port --</option>';

        if (ports.length === 0) {
            showStatus("No serial ports found or permitted. Connect device and click Refresh.", "warning");
            portSelector.disabled = true;
        } else {
            ports.forEach((port, index) => {
                const portInfo = port.getInfo();
                const option = document.createElement('option');
                const portId = `vid${portInfo.usbVendorId || 'undef'}_pid${portInfo.usbProductId || 'undef'}`;
                option.value = portId;
                option.textContent = `Port ${index}: ${portInfo.usbVendorId ? `VID:0x${portInfo.usbVendorId.toString(16)}` : ''} ${portInfo.usbProductId ? `PID:0x${portInfo.usbProductId.toString(16)}` : 'Unknown'}`;
                portSelector.appendChild(option);
            });
            portSelector.disabled = false;
            showStatus(`Found ${ports.length} permitted port(s). Select one.`, "success");
        }
    } catch (error) {
        if (error.name === 'NotFoundError') {
             showStatus("Port selection cancelled or no port chosen.", "info");
        } else {
            console.error("Error getting/requesting serial ports:", error);
            showStatus("Error accessing serial ports. Check browser permissions.", "error");
        }
        portSelector.disabled = true;
        portSelector.innerHTML = '<option value="">-- Select Port --</option>';
    } finally {
        disableElement('refreshPortsButton', false);
    }
}


/**
 * Handles the "Upload" button click.
 */
async function handleUpload() {
    const portSelector = document.getElementById('portSelector');
    const selectedPortValue = portSelector?.value;

    // 1. Check if a port is selected
    if (!selectedPortValue) {
        showStatus("Please select a serial port first.", "warning");
        alert("Please select a serial port from the dropdown.\nClick the refresh icon (<i class='fas fa-sync-alt'></i>) to list available ports.");
        return;
    }

    // 2. Regenerate code to ensure it's current
    generateCodeAndUpdatePreview();
    if (!currentCode) {
        showStatus("No code generated to upload.", "warning");
        alert("There are no blocks in the workspace to generate code from.");
        return;
    }

    // 3. Find the selected port object
    let selectedPort = null;
    try {
         const ports = await navigator.serial.getPorts();
         selectedPort = ports.find(port => {
             const portInfo = port.getInfo();
             const portId = `vid${portInfo.usbVendorId || 'undef'}_pid${portInfo.usbProductId || 'undef'}`;
             return portId === selectedPortValue;
         });

         if (!selectedPort) {
            showStatus("Selected port not found or permission revoked. Please re-select.", "warning");
            await populatePortSelector();
            alert("Could not find the selected port. Please refresh the list and select again.");
            return;
         }

    } catch (error) {
        console.error("Error getting permitted ports:", error);
        showStatus(`Error getting port list: ${error.message}`, "error");
        alert(`Could not get the list of permitted ports: ${error.message}`);
        return;
    }


    // 4. Attempt to connect
    showStatus(`Connecting to port...`, "info");
    try {
        const baudRate = 115200;
        await selectedPort.open({ baudRate: baudRate });
        console.log("Port opened successfully at", baudRate);
        showStatus(`Connected to port at ${baudRate} baud.`, "info");

        // --- CRITICAL EXPLANATION ---
        console.log("--- Generated Arduino Code ---");
        console.log(currentCode); // Log the generated code
        console.log("-----------------------------");
        console.log("Port Info:", selectedPort.getInfo());
        console.log("Placeholder: Actual upload protocol (e.g., STK500) needed here.");

        showStatus("Connected! Code generated (see console). Ready for external upload tool.", "success");
        alert("Web Serial Connected Successfully!\n\n" +
              "The Arduino code has been generated (check the browser console - F12).\n\n" + // Mention code again
              "IMPORTANT: This web tool CANNOT compile or flash the code directly to your Arduino.\n" +
              "You need to copy the generated code and use the Arduino IDE or Arduino CLI to compile and upload it to your board via the connected port.");

        serialPort = selectedPort;

        // Close the port immediately after demonstration
        await serialPort.close();
        console.log("Port closed after connection test.");
        showStatus("Port closed after connection test.", "info");
        serialPort = null;


    } catch (error) {
        console.error("Error opening or interacting with serial port:", error);
        showStatus(`Error connecting to port: ${error.message}`, "error");
        alert(`Failed to connect or interact with the serial port: ${error.message}\n\nIs the port already in use by another program (like Arduino IDE Serial Monitor)?`);
        if (selectedPort?.readable) {
            try { await selectedPort.close(); } catch (e) { /* Ignore close error */ }
        }
        serialPort = null;
    }
}

/**
 * Placeholder for Serial Monitor functionality.
 */
function handleSerialMonitor() {
    alert("Serial Monitor functionality is not yet implemented in this version.");
}


/**
 * Handles window resize event to resize Blockly SVG.
 */
function onResize() {
    const blocklyArea = document.getElementById('blocklyArea');
    const blocklyDiv = document.getElementById('blocklyDiv');
    if (!blocklyArea || !blocklyDiv || !workspace) return;

    let element = blocklyDiv;
    let x = 0, y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);

    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';

    Blockly.svgResize(workspace);
}

/**
 * Displays status messages to the user.
 */
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessages');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-messages status-${type}`;
        console.log(`Status [${type}]: ${message}`);
    } else {
        console.warn("Status message element not found.");
    }
}

/**
 * Disables or enables a DOM element.
 */
function disableElement(elementId, disabled) {
     const element = document.getElementById(elementId);
     if (element) {
         element.disabled = disabled;
     }
}


// --- Block Definitions ---
// Defines the visual appearance and fields of blocks
function defineAllBlocks() { // Renamed from defineBaseBlocks
    // HSL Colors are defined globally above

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
    Blockly.Blocks['sensor_light_condition'] = { init: function() { this.appendDummyInput().appendField("Light Sensor is").appendField(new Blockly.FieldDropdown([["Light","LIGHT"], ["Dark","DARK"]]), "STATE"); this.appendDummyInput().appendField("on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(SENSORS_HUE); this.setTooltip("Checks if the light sensor reading is light (< 300) or dark (>= 300)."); this.setHelpUrl(""); } };
    Blockly.Blocks['sensor_light_value'] = { init: function() { this.appendDummyInput().appendField("Light Sensor value on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the raw analog value (0-1023) from a light sensor."); this.setHelpUrl(""); } };
    Blockly.Blocks['sensor_potentiometer'] = { init: function() { this.appendDummyInput().appendField("Potentiometer value on pin").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); this.appendDummyInput().appendField("as").appendField(new Blockly.FieldDropdown([["Value (0-1023)","VALUE"], ["Percentage (0-100)","PERCENTAGE"]]), "UNIT"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the value from a potentiometer, either raw (0-1023) or as a percentage (0-100)."); this.setHelpUrl(""); } };
    Blockly.Blocks['sensor_ultrasonic_init'] = { init: function() { this.appendDummyInput().appendField("Setup Ultrasonic Sensor").appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Trig Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "TRIG_PIN"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Echo Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "ECHO_PIN"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Initializes an ultrasonic sensor using the NewPing library."); this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home"); } };
    Blockly.Blocks['sensor_ultrasonic_read'] = { init: function() { this.appendDummyInput().appendField("Distance in").appendField(new Blockly.FieldDropdown([["cm","CM"], ["inch","INCH"]]), "UNIT"); this.appendDummyInput().appendField("from sensor").appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the distance (using NewPing library) from the specified ultrasonic sensor. Returns 0 if no echo."); this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home"); } };
    Blockly.Blocks['encoder_init'] = { init: function() { this.appendDummyInput().appendField("Setup Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Clock Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "CLK_PIN"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Data Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "DT_PIN"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Initializes a rotary encoder using the Encoder library."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html"); } };
    Blockly.Blocks['encoder_read'] = { init: function() { this.appendDummyInput().appendField("Read Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the current count from the specified encoder."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html"); } };
    Blockly.Blocks['encoder_write'] = { init: function() { this.appendDummyInput().appendField("Set Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR"); this.appendValueInput("VALUE").setCheck("Number").appendField("Value"); this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Sets the internal count of the specified encoder."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html"); } };

    // --- Standard Block Definitions (Logic, Loops, Math, Text) ---
    // REMOVED - Relying on blocks.min.js from CDN for these standard visuals


} // end defineAllBlocks


// --- Initialize the Application ---
// Wait for the DOM to be fully loaded before calling initialize
document.addEventListener('DOMContentLoaded', initialize);
