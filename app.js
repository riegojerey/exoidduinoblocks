/**
 * ExoiDuino - Blockly Web Editor for Arduino
 */

'use strict';

// --- Global Variables ---
let workspace = null; // Blockly workspace instance
let currentCode = ''; // Stores the latest generated Arduino code
let serialPort = null; // Holds the currently selected serial port object
let serialWriter = null; // For writing to the serial port (if needed)
let serialReader = null; // For reading from the serial port (if needed)

// --- DOM Ready ---
// The 'defer' attribute in the script tag ensures this runs after HTML parsing
function initialize() {
    console.log("DOM parsed. Attempting to initialize ExoiDuino...");

    // --- Check for Web Serial API support ---
    if (!("serial" in navigator)) {
        showStatus("Warning: Web Serial API not supported by this browser. Connect/Serial features disabled.", "warning");
        disableElement('refreshPortsButton', true);
        disableElement('portSelector', true);
        disableElement('uploadButton', true);
        disableElement('serialButton', true);
    }

    // --- Register Custom Blocks (Visual Definition) ---
    defineCustomBlocks();

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
        // Crucial Check: Ensure Blockly and YOUR Arduino generator are loaded
        if (typeof Blockly === 'undefined') {
             throw new Error("Blockly core library not loaded.");
        }
        // Check if your custom generator successfully created Blockly.Arduino
        if (typeof Blockly.Arduino === 'undefined') {
             throw new Error("Custom Arduino generator (blockly-arduino.js) failed to load or define Blockly.Arduino.");
        }

        // --- Define Arduino Code Generators for Custom Blocks ---
        // REMOVED - Assuming blockly-arduino.js now handles ALL generators
        // defineCustomArduinoGenerators();

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
    // Blockly workspace change listener (generates code)
    workspace.addChangeListener(onWorkspaceChanged);

    // Button listeners
    document.getElementById('refreshPortsButton')?.addEventListener('click', populatePortSelector);
    document.getElementById('uploadButton')?.addEventListener('click', handleUpload); // Changed button text back to Upload
    document.getElementById('serialButton')?.addEventListener('click', handleSerialMonitor); // Placeholder

    // Handle window resizing for Blockly
    window.addEventListener('resize', onResize, false);
    onResize(); // Call initially to set size

    // Initial code generation
    generateCodeAndUpdatePreview(); // Generate code for the initial state

    console.log("ExoiDuino Initialization complete.");
    showStatus("Ready. Add blocks, select a port, and generate code.", "info");
}

/**
 * Handles changes in the Blockly workspace to regenerate code.
 * @param {Blockly.Events.Abstract} event The Blockly event.
 */
function onWorkspaceChanged(event) {
    // Don't generate code for UI events like zoom, drag, select
    if (event.isUiEvent || event.type == Blockly.Events.VIEWPORT_CHANGE || event.type == Blockly.Events.SELECTED) {
        return;
    }
    // Regenerate code for block changes/moves/creation/deletion
    generateCodeAndUpdatePreview();
}


/**
 * Generates Arduino code from the workspace and updates the preview.
 */
function generateCodeAndUpdatePreview() {
    // Ensure generator is available (safety check)
    if (typeof Blockly.Arduino === 'undefined') {
        console.error("generateCodeAndUpdatePreview: Blockly.Arduino generator not loaded!");
        showStatus("Error: Arduino code generator failed.", "error");
        return;
    }
    try {
        // Use the workspaceToCode function provided by your generator
        currentCode = Blockly.Arduino.workspaceToCode(workspace);
        const codePreview = document.getElementById('codeDiv');
        if (codePreview) {
            codePreview.textContent = currentCode || '/* Add blocks to generate code */';
            // Apply syntax highlighting if Prism is loaded and ready
            if (window.Prism && Prism.highlightElement && Prism.languages && Prism.languages.clike && Prism.languages.cpp) {
                Prism.highlightElement(codePreview);
            } else if (window.Prism) {
                 console.warn("Prism core loaded, but C++/Clike languages might not be ready yet.");
            }
        } else {
            console.error("Code preview element ('codeDiv') not found.");
        }
    } catch (e) {
        console.error("Error generating Arduino code:", e);
        showStatus("Error generating code. See console for details.", "error");
        const codePreview = document.getElementById('codeDiv');
        if (codePreview) codePreview.textContent = "/* Error generating code. Check blocks and console. */";
        currentCode = ''; // Reset code on error
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
 * Generates code, connects to the selected port via Web Serial,
 * and explains that compilation/flashing is not performed.
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


// --- Custom Block Definitions ---
// Defines the visual appearance and fields of custom blocks
function defineCustomBlocks() {
    // --- L298N Setup Block ---
    Blockly.Blocks['l298n_setup'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Setup L298N Motor Driver");
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Motor A:")
                .appendField("ENA")
                .appendField(new Blockly.FieldNumber(5), "ENA")
                .appendField("IN1")
                .appendField(new Blockly.FieldNumber(7), "IN1")
                .appendField("IN2")
                .appendField(new Blockly.FieldNumber(8), "IN2");
            this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField("Motor B:")
                .appendField("ENB")
                .appendField(new Blockly.FieldNumber(6), "ENB")
                .appendField("IN3")
                .appendField(new Blockly.FieldNumber(9), "IN3")
                .appendField("IN4")
                .appendField(new Blockly.FieldNumber(10), "IN4");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#FF6680");
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
            .appendField(new Blockly.FieldDropdown([["Forward","FORWARD"], ["Backward","BACKWARD"], ["Stop","STOP"]]), "DIRECTION")
            .appendField("Speed (0-255)");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF6680");
        this.setTooltip("Controls the direction and speed of one motor (A or B).");
        this.setHelpUrl("");
      }
    };

    // --- L298N Stop Motors Block ---
     Blockly.Blocks['l298n_stop_motors'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Stop Both Motors");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF6680");
        this.setTooltip("Stops both motors A and B.");
        this.setHelpUrl("");
      }
    };

    // Add standard Arduino blocks that might be missing from blocks_compressed.js
    // but are expected by the custom generator (e.g., setup/loop structure)
     Blockly.Blocks['arduino_setup'] = {
        init: function() {
            this.appendStatementInput("SETUP")
                .appendField("Arduino Setup");
            this.setColour("%{BKY_ARDUINO_GENERAL_HUE}");
            this.setTooltip("Code in here runs once at the start.");
            this.setHelpUrl(""); // Add relevant help URL
        }
    };

    Blockly.Blocks['arduino_loop'] = {
        init: function() {
            this.appendStatementInput("LOOP")
                .appendField("Arduino Loop Forever");
            this.setColour("%{BKY_ARDUINO_GENERAL_HUE}");
            this.setTooltip("Code in here repeats forever.");
            this.setHelpUrl(""); // Add relevant help URL
        }
    };


} // end defineCustomBlocks


// --- Arduino Code Generators for Custom Blocks ---
// REMOVED - Assuming blockly-arduino.js now handles ALL generators
// function defineCustomArduinoGenerators() { ... }


// --- Initialize the Application ---
// This call starts everything when the script runs (due to 'defer')
initialize();
