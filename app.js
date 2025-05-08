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
const WORKSPACE_VERSION = '1.0'; // Add version tracking

// --- Correct IPC Renderer Setup ---
let ipcRenderer = null;
try {
    // First check if we're in Electron
    const isElectron = window && window.process && window.process.type === 'renderer';
    console.log('Environment check - isElectron:', isElectron);
    
    if (!isElectron) {
        throw new Error('Not running in Electron environment');
    }
    
    // This is the correct way to get ipcRenderer in the renderer process
    const electron = require('electron');
    console.log('Electron module loaded:', !!electron);
    
    ipcRenderer = electron.ipcRenderer;
    console.log('IPC Renderer obtained:', !!ipcRenderer);
    
    if (!ipcRenderer) {
        throw new Error('ipcRenderer object is null or undefined after require.');
    }
    
    // Test IPC functionality
    ipcRenderer.send('renderer-ready');
    console.log('app.js: Electron ipcRenderer loaded successfully and test message sent.');
    ipcRenderer.isElectron = true;
} catch (e) {
    console.error('app.js: Failed to load Electron ipcRenderer:', e);
    // Fallback for web environment
    ipcRenderer = {
        listPorts: async () => { console.warn('IPC Fallback: listPorts'); return []; },
        detectBoard: async () => { console.warn('IPC Fallback: detectBoard'); return null; },
        uploadCode: async () => { console.warn('IPC Fallback: uploadCode'); throw new Error('Upload not available in web mode'); },
        invoke: async (channel, ...args) => {
            console.warn('IPC Fallback: invoke called for channel:', channel);
            return [];
        },
        send: (channel, ...args) => {
            console.warn('IPC Fallback: send called for channel:', channel);
        },
        isElectron: false
    };
}

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

// Function generators for dropdowns - Define them in the global scope
window.getDigitalPinOptions = function() { 
    return boardPins[selectedBoard]?.digital || boardPins['uno'].digital; 
};

window.getAnalogPinOptions = function() { 
    return boardPins[selectedBoard]?.analog || boardPins['uno'].analog; 
};

window.getPWMPinOptions = function() { 
    return boardPins[selectedBoard]?.pwm || boardPins['uno'].pwm; 
};

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

    // --- Check for Electron IPC ---
    if (!ipcRenderer.isElectron) {
        showStatus("Running in web mode. Hardware features are disabled.", "warning");
        disableElement('refreshPortsButton', true);
        disableElement('portSelector', true);
        disableElement('uploadButton', true);
        disableElement('serialButton', true);
    } else {
        showStatus("Running in Electron mode. Hardware features are enabled.", "info");
        // Enable hardware-dependent buttons
        disableElement('refreshPortsButton', false);
        disableElement('portSelector', false);
        disableElement('uploadButton', false);
        disableElement('serialButton', false);
    }

    // --- Ensure Arduino Generator is initialized ---
    if (typeof Blockly === 'undefined') {
        showStatus("Error: Blockly core not loaded.", "error");
        return;
    }
    
    if (typeof Blockly.Arduino === 'undefined' || !(Blockly.Arduino instanceof Blockly.Generator)) {
        console.log("Arduino generator not initialized. Initializing now...");
        try {
            initializeArduinoGenerator();
        } catch (e) {
            console.error("Failed to initialize Arduino generator:", e);
            showStatus("Error: Failed to initialize Arduino code generator.", "error");
            return;
        }
    }

    // --- Register Block Definitions ---
    console.log("Initializing block definitions...");
    defineAllBlocks();
    
    // Initialize sensor blocks first
    if (typeof defineSensorBlocks === "function") {
        console.log("Initializing sensor blocks...");
        defineSensorBlocks();
    } else {
        console.error("defineSensorBlocks function not found. Ensure app_sensor.js is loaded before app.js.");
        showStatus("Error: Sensor block definitions failed to load.", "error");
    }
    
    // Then initialize motor blocks
    if (typeof defineMotorBlocks === "function") {
        console.log("Initializing motor blocks...");
        defineMotorBlocks();
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
        maxInstances: {
            'arduino_setup': 1,
            'arduino_loop': 1
        },
        maxBlocks: 1000, // Prevent excessive block count
        trashcan: true,
        maxTrashcanContents: 50, // Limit undo stack size
        move: {
            scrollbars: true,
            drag: true,
            wheel: true
        }
    };

    try {
        // Inject the workspace
        workspace = Blockly.inject(blocklyDiv, blocklyOptions);
        console.log("Blockly workspace injected.");

        // Add default blocks with shadow blocks
        const setupBlock = workspace.newBlock('arduino_setup');
        setupBlock.initSvg();
        setupBlock.render();

        const loopBlock = workspace.newBlock('arduino_loop');
        loopBlock.initSvg();
        loopBlock.render();

        // Load saved workspace if it exists
        const savedWorkspace = localStorage.getItem('arduinoWorkspace');
        if (savedWorkspace) {
            try {
                const workspaceData = JSON.parse(savedWorkspace);
                // Check workspace version
                if (workspaceData.version && workspaceData.version !== WORKSPACE_VERSION) {
                    console.warn(`Workspace version mismatch: ${workspaceData.version} vs ${WORKSPACE_VERSION}`);
                    showStatus("Workspace version mismatch. Some blocks may not work correctly.", "warning");
                }
                Blockly.serialization.workspaces.load(workspaceData, workspace);
                console.log("Restored saved workspace");
            } catch (e) {
                console.error("Failed to restore workspace:", e);
                showStatus("Failed to restore workspace: " + e.message, "error");
                // If restore fails, proceed with default blocks
                createDefaultBlocks();
            }
        } else {
            // If no saved workspace, create default blocks
            createDefaultBlocks();
        }

    } catch (e) {
        console.error("Error injecting Blockly or prerequisites missing:", e);
        showStatus(`FATAL ERROR: Could not initialize Blockly workspace: ${e.message}`, "error");
        blocklyDiv.innerHTML = `<p style='color:red; font-weight:bold;'>Error initializing Blockly: ${e.message}. Check console (F12) and ensure all library scripts loaded correctly.</p>`;
        return; // Stop initialization
    }

    // --- Setup Event Listeners ---
    workspace.addChangeListener(onWorkspaceChanged);
    workspace.addChangeListener(saveWorkspace);
    boardSelector?.addEventListener('change', handleBoardChange);
    document.getElementById('refreshPortsButton')?.addEventListener('click', populatePortSelector);
    document.getElementById('uploadButton')?.addEventListener('click', handleUpload);
    document.getElementById('serialButton')?.addEventListener('click', handleSerialMonitor);
    document.getElementById('cleanupButton')?.addEventListener('click', cleanupWorkspace);
    document.getElementById('resetButton')?.addEventListener('click', resetWorkspace);
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
            'io_digitalread', 'io_pwm_write',
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
    
    // Update the options
    field.menuGenerator_ = newOptions;
    
    // If the current value is not valid with new options, set to first option
    if (!valueStillValid && newOptions.length > 0) {
        field.setValue(newOptions[0][1]);
    } else {
        // Force refresh without using dummy value
        field.forceRerender();
    }
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
    
    // Check if Arduino generator is properly initialized
    if (typeof Blockly.Arduino === 'undefined' || !(Blockly.Arduino instanceof Blockly.Generator)) {
        console.error("Arduino generator not properly initialized. Attempting to reinitialize...");
        try {
            initializeArduinoGenerator();
        } catch (e) {
            console.error("Failed to initialize Arduino generator:", e);
            showStatus("Error: Arduino code generator failed to initialize.", "error");
            return;
        }
    }

    try {
        currentCode = Blockly.Arduino.workspaceToCode(workspace);
        const codePreview = document.getElementById('codeDiv');
        if (codePreview) {
            codePreview.textContent = currentCode || '/* Add blocks to generate code */';
            if (window.Prism && typeof Prism.highlightElement === 'function' && Prism.languages && Prism.languages.clike && Prism.languages.cpp) {
                 const elementToHighlight = document.getElementById('codeDiv');
                 if (elementToHighlight) {
                    try { 
                        Prism.highlightElement(elementToHighlight); 
                        console.log("Prism highlighting applied."); 
                    } catch(prismError) { 
                        console.error("Prism highlighting failed:", prismError); 
                        showStatus("Syntax highlighting error.", "warning"); 
                    }
                 }
            } else { 
                console.warn("Prism or required languages not ready for highlighting."); 
            }
        } else { 
            console.error("Code preview element ('codeDiv') not found."); 
        }
    } catch (e) {
        console.error("Error generating Arduino code:", e);
        showStatus("Error generating code: " + e.message, "error");
        const codePreview = document.getElementById('codeDiv');
        if (codePreview) {
            codePreview.textContent = `/* Error generating code: ${e.message}. Check blocks and console. */`;
        }
        currentCode = '';
    }
}


/**
 * Populates the serial port selector dropdown.
 */
async function populatePortSelector() {
    console.log('app.js: populatePortSelector function called.');
    const portSelector = document.getElementById('portSelector');
    const refreshButton = document.getElementById('refreshPortsButton');
    if (!portSelector || !refreshButton) return;

    try {
        // Disable the refresh button and show loading state
        refreshButton.disabled = true;
        refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        showStatus("Scanning for Arduino boards...", "info");
        
        const ports = await ipcRenderer.invoke('list-ports');
        
        // Clear existing options
        portSelector.innerHTML = '<option value="">-- Select Port --</option>';

        if (ports.length === 0) {
            showStatus("No Arduino boards found. Please check your connection.", "warning");
            portSelector.innerHTML += '<option value="" disabled>No ports available</option>';
        } else {
            // Add new options
            ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port.path;
                
                // Create a descriptive label
                let label = port.path;
                if (port.manufacturer) {
                    label += ` - ${port.manufacturer}`;
                }
                if (port.vendorId && port.productId) {
                    label += ` (VID:${port.vendorId} PID:${port.productId})`;
                }
                
                option.textContent = label;
                portSelector.appendChild(option);
            });

            showStatus(`Found ${ports.length} Arduino ${ports.length === 1 ? 'board' : 'boards'}`, "success");
            
            // If there's only one port, select it automatically
            if (ports.length === 1) {
                portSelector.value = ports[0].path;
            }
        }

        portSelector.disabled = false;
    } catch (error) {
        console.error('Error listing ports:', error);
        showStatus("Failed to scan ports: " + error.message, "error");
        portSelector.disabled = true;
        portSelector.innerHTML = '<option value="">-- Error Scanning Ports --</option>';
    } finally {
        // Re-enable the refresh button and restore its original state
        refreshButton.disabled = false;
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
    }
}


/**
 * Handles the "Upload" button click.
 */
async function handleUpload() {
    console.log('app.js: uploadCode function called.');
    const portSelector = document.getElementById('portSelector');
    const uploadButton = document.getElementById('uploadButton');
    
    if (!portSelector || !portSelector.value) {
        showStatus("Please select a port first", "error");
        return;
    }

    // Create a progress indicator for long-running uploads
    let uploadStage = 1;
    const stages = ['Detecting board', 'Compiling code', 'Uploading to board', 'Finalizing'];
    let progressTimer = null;
    
    try {
        // Disable the upload button and show loading state
        uploadButton.disabled = true;
        uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        showStatus("Starting upload process...", "info");
        
        const selectedPort = portSelector.value;
        const code = Blockly.Arduino.workspaceToCode(workspace);
        
        // Start progress updates
        progressTimer = setInterval(() => {
            if (uploadStage < stages.length) {
                showStatus(`${stages[uploadStage]}... (this may take a while)`, "info");
                uploadStage++;
            } else {
                uploadStage = 1; // Reset for next cycle if needed
            }
        }, 5000); // Update status every 5 seconds
        
        try {
            // First detect the board
            showStatus("Detecting board...", "info");
            const boardInfo = await ipcRenderer.invoke('detect-board', selectedPort);
            
            if (!boardInfo) {
                clearInterval(progressTimer);
                progressTimer = null;
                showStatus("Could not detect board. Is it connected properly?", "error");
                return;
            }
            
            // Handle different response formats from board detection
            let fqbn;
            if (boardInfo.matching_boards && boardInfo.matching_boards.length > 0) {
                // New format from our code changes
                fqbn = boardInfo.matching_boards[0].fqbn;
            } else if (boardInfo.boards && boardInfo.boards.length > 0) {
                // Old format that might still be in use
                fqbn = boardInfo.boards[0].fqbn;
            } else {
                // Fallback to default board for FTDI devices
                const boardSelector = document.getElementById('boardSelector');
                const selectedBoardValue = boardSelector ? boardSelector.value : 'nano';
                fqbn = getBoardFqbn(selectedBoardValue);
                console.log('Using fallback FQBN:', fqbn);
            }
            
            if (!fqbn) {
                clearInterval(progressTimer);
                progressTimer = null;
                showStatus("Could not determine board type. Using Arduino Nano with old bootloader.", "warning");
                fqbn = 'arduino:avr:nano:cpu=atmega328old';
            }
            
            console.log('Using FQBN for upload:', fqbn);
            showStatus("Starting compilation and upload...", "info");

            // Upload the code - the backend handles compilation and upload together
            try {
                const result = await ipcRenderer.invoke('upload-code', { code, port: selectedPort, board: fqbn });
                
                // Clear the progress timer
                if (progressTimer) {
                    clearInterval(progressTimer);
                    progressTimer = null;
                }
                
                if (result && result.success) {
                    showStatus(result.message, "success");
                } else if (result) {
                    showStatus("Upload failed: " + result.message, "error");
                    console.error('Upload error details:', result.error);
                } else {
                    showStatus("Upload failed: No response from upload process", "error");
                }
            } catch (uploadError) {
                // Clear the progress timer
                if (progressTimer) {
                    clearInterval(progressTimer);
                    progressTimer = null;
                }
                console.error('Upload error:', uploadError);
                showStatus("Upload failed: " + uploadError.message, "error");
            }
    } catch (error) {
            // Clear the progress timer
            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }
            console.error('Upload error:', error);
            showStatus("Upload failed: " + error.message, "error");
        }
    } catch (error) {
        // Clear the progress timer
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
        console.error('Upload process error:', error);
        showStatus("Upload process error: " + error.message, "error");
    } finally {
        // Always re-enable the upload button
        if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.innerHTML = '<i class="fas fa-upload"></i> Upload';
        }
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
     Blockly.Blocks['arduino_setup'] = {
       init: function() {
         this.appendDummyInput()
             .appendField("Arduino Setup");
         this.appendDummyInput()
             .appendField("Serial Rate")
             .appendField(new Blockly.FieldDropdown([
                 ["9600", "9600"],
                 ["115200", "115200"],
                 ["57600", "57600"],
                 ["38400", "38400"],
                 ["19200", "19200"],
                 ["4800", "4800"],
                 ["2400", "2400"],
                 ["1200", "1200"],
                 ["300", "300"]
             ]), "BAUD_RATE");
         this.appendStatementInput("SETUP");
         this.setColour(ARDUINO_GENERAL_HUE);
         this.setTooltip("Code in here runs once at the start.");
         this.setHelpUrl("");
       }
     };
    Blockly.Blocks['arduino_loop'] = { init: function() { this.appendStatementInput("LOOP").appendField("Arduino Loop Forever"); this.setColour(ARDUINO_GENERAL_HUE); this.setTooltip("Code in here repeats forever."); this.setHelpUrl(""); } };

    // --- Standard Arduino IO Block Definitions (Using Fields) ---
    // Remove or comment out the conflicting block definition
    // Blockly.Blocks['io_digitalwrite'] = { init: function() { ... } };
    Blockly.Blocks['io_digitalread'] = { init: function() { this.appendDummyInput().appendField("Digital Read Pin#").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "PIN"); this.setInputsInline(true); this.setOutput(true, "Boolean"); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Read HIGH or LOW from a digital pin."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_pwm_write'] = { init: function() { this.appendDummyInput().appendField("Set PWM Pin#").appendField(new Blockly.FieldDropdown(getPWMPinOptions), "PIN"); this.appendValueInput("VALUE").setCheck("Number").appendField("to"); this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Write an analog value (PWM) to a specific PWM pin."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_analogread'] = { init: function() { this.appendDummyInput().appendField("Analog Read Pin#").appendField(new Blockly.FieldDropdown(getAnalogPinOptions), "PIN"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Read an analog value (0-1023) from an analog pin."); this.setHelpUrl(""); } };
    Blockly.Blocks['io_highlow'] = { init: function() { this.appendDummyInput().appendField(new Blockly.FieldDropdown([["HIGH","HIGH"], ["LOW","LOW"]]), "STATE"); this.setOutput(true, "Boolean"); this.setColour(ARDUINO_IO_HUE); this.setTooltip("Represents HIGH (1) or LOW (0) state."); this.setHelpUrl(""); } };

    // --- Standard Arduino Time Block Definitions ---
    // Remove the duplicate time_delay block definition since it's now in arduino_time.js
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
        this.setPreviousStatement(true, null); 
        this.setNextStatement(true, null); 
        this.setColour(SENSORS_HUE); 
        this.setTooltip("Initializes an ultrasonic sensor using the NewPing library. Set max distance in centimeters (1-500cm)."); 
        this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home"); 
      } 
    };
    Blockly.Blocks['sensor_ultrasonic_read'] = { init: function() { this.appendDummyInput().appendField("Distance in").appendField(new Blockly.FieldDropdown([["cm","CM"], ["inch","INCH"]]), "UNIT"); this.appendDummyInput().appendField("from sensor").appendField(new Blockly.FieldVariable("mySonar"), "SONAR_VAR"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the distance (using NewPing library) from the specified ultrasonic sensor. Returns 0 if no echo."); this.setHelpUrl("https://bitbucket.org/teckel12/arduino-new-ping/wiki/Home"); } };
    Blockly.Blocks['encoder_init'] = { init: function() { this.appendDummyInput().appendField("Setup Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Clock Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "CLK_PIN"); this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Data Pin").appendField(new Blockly.FieldDropdown(getDigitalPinOptions), "DT_PIN"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Initializes a rotary encoder using the Encoder library."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html"); } };
    Blockly.Blocks['encoder_read'] = { init: function() { this.appendDummyInput().appendField("Read Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR"); this.setInputsInline(true); this.setOutput(true, "Number"); this.setColour(SENSORS_HUE); this.setTooltip("Reads the current count from the specified encoder."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html"); } };
    Blockly.Blocks['encoder_write'] = { init: function() { this.appendDummyInput().appendField("Set Encoder").appendField(new Blockly.FieldVariable("myEncoder"), "ENCODER_VAR"); this.appendValueInput("VALUE").setCheck("Number").appendField("Value"); this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setColour(SENSORS_HUE); this.setTooltip("Sets the internal count of the specified encoder."); this.setHelpUrl("https://www.pjrc.com/teensy/td_libs_Encoder.html"); } };

    // --- Standard Block Definitions (Logic, Loops, Math, Text) ---
    // REMOVED - Relying on blocks.min.js from CDN for these standard visuals


} // end defineAllBlocks

/**
 * Creates and connects default blocks with shadow blocks
 */
function createDefaultBlocks() {
    if (!workspace) return;

    try {
        // Clear existing blocks
        workspace.clear();

        // Create setup block
        const setupBlock = workspace.newBlock('arduino_setup');
        setupBlock.initSvg();
        setupBlock.render();
        setupBlock.moveBy(50, 50);

        // Create loop block
        const loopBlock = workspace.newBlock('arduino_loop');
        loopBlock.initSvg();
        loopBlock.render();
        loopBlock.moveBy(50, 200);  // Position it below setup block

        // Add a default delay block to loop
        const delayBlock = workspace.newBlock('time_delay');
        delayBlock.setFieldValue(1000, 'DELAY_TIME_MILI');
        delayBlock.initSvg();
        delayBlock.render();

        // Connect delay to loop block
        const loopConnection = loopBlock.getInput('LOOP').connection;
        if (loopConnection) {
            loopConnection.connect(delayBlock.previousConnection);
        }

        // Center the blocks
        workspace.scrollCenter();
        
        workspace.render();
    } catch (e) {
        console.error("Failed to create default blocks:", e);
        showStatus("Failed to create default blocks: " + e.message, "error");
    }
}

/**
 * Resets the workspace to default state
 */
function resetWorkspace() {
    if (!workspace) return;
    
    try {
        createDefaultBlocks();
        saveWorkspace();
        showStatus("Workspace reset to default state", "success");
    } catch (e) {
        console.error("Failed to reset workspace:", e);
        showStatus("Failed to reset workspace: " + e.message, "error");
    }
}

/**
 * Saves the workspace to localStorage
 */
function saveWorkspace(event) {
    // Don't save after every UI event
    if (event && (event.isUiEvent || event.type == Blockly.Events.VIEWPORT_CHANGE || event.type == Blockly.Events.SELECTED)) {
        return;
    }
    
    try {
        // Save workspace with version tracking
        const workspaceState = Blockly.serialization.workspaces.save(workspace);
        workspaceState.version = WORKSPACE_VERSION;
        localStorage.setItem('arduinoWorkspace', JSON.stringify(workspaceState));
        console.log("Workspace saved");
        showStatus("Workspace saved successfully", "success");
    } catch (e) {
        console.error("Failed to save workspace:", e);
        showStatus("Failed to save workspace: " + e.message, "error");
    }
}

/**
 * Cleans up the workspace by organizing blocks
 */
function cleanupWorkspace() {
    if (!workspace) return;
    
    try {
        // Start a compound change to group the cleanup operation
        if (Blockly.Events) {
            Blockly.Events.setGroup(true);
        }
        
        // Organize the blocks
        workspace.cleanUp();
        
        // End the compound change
        if (Blockly.Events) {
            Blockly.Events.setGroup(false);
        }
        
        // Save the cleaned workspace
        saveWorkspace();
        showStatus("Workspace cleaned up successfully", "success");
    } catch (e) {
        console.error("Failed to cleanup workspace:", e);
        showStatus("Failed to cleanup workspace: " + e.message, "error");
    }
}

// Add cleanup function to window for toolbar access
window.cleanupWorkspace = cleanupWorkspace;

// --- Initialize the Application ---
// Wait for the DOM to be fully loaded before calling initialize
document.addEventListener('DOMContentLoaded', initialize);

// Add styles for header
const styles = `
h1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    margin: 0;
}

.social-links {
    display: flex;
    gap: 15px;
    align-items: center;
}

.social-icon {
    color: white;
    text-decoration: none;
    transition: transform 0.3s ease;
}

.social-icon:hover {
    transform: scale(1.1);
    color: rgba(255, 255, 255, 0.8);
}

.social-icon i {
    font-size: 20px;
}
`;

// Add the styles and modify the title when the document loads
document.addEventListener('DOMContentLoaded', function() {
    // Add our custom styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Find the h1 element
    const title = document.querySelector('h1');
    if (title) {
        // Create social links
        const socialLinks = document.createElement('div');
        socialLinks.className = 'social-links';
        socialLinks.innerHTML = `
            <a href="https://www.exoidrobotics.com" class="social-icon" target="_blank" title="Website">
                <i class="fas fa-globe"></i>
            </a>
            <a href="https://www.facebook.com/exoidrobotics" class="social-icon" target="_blank" title="Facebook">
                <i class="fab fa-facebook"></i>
            </a>
            <a href="https://www.instagram.com/exoidrobotics/" class="social-icon" target="_blank" title="Instagram">
                <i class="fab fa-instagram"></i>
            </a>
            <a href="https://github.com/ExoidRoboticsPH" class="social-icon" target="_blank" title="GitHub">
                <i class="fab fa-github"></i>
            </a>
        `;

        // Wrap the existing text in a span
        const titleText = title.textContent;
        title.textContent = '';
        const textSpan = document.createElement('span');
        textSpan.textContent = titleText;
        title.appendChild(textSpan);
        
        // Add social links to the title
        title.appendChild(socialLinks);
    }
});

// Export functionality
document.getElementById('exportButton')?.addEventListener('click', () => {
    const code = Blockly.Arduino.workspaceToCode(workspace);
    if (!code) {
        showStatus("No code to export. Add some blocks!", "warning");
        return;
    }

    let userFilename = window.prompt("Enter filename for export (e.g., my_sketch):", "arduino_sketch");

    if (userFilename === null) { // User pressed cancel
        showStatus("Export cancelled by user.", "info");
        return;
    }

    userFilename = userFilename.trim();
    if (userFilename === "") {
        userFilename = "arduino_sketch"; // Default if empty
        showStatus("No filename entered, using default: arduino_sketch.ino", "info");
    }

    // Sanitize filename: replace invalid characters with underscore, ensure .ino extension
    let sanitizedFilename = userFilename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    
    // Ensure .ino extension
    if (sanitizedFilename.toLowerCase().endsWith('.ino')) {
        // Already has .ino, remove it to prevent duplication if user typed it
        sanitizedFilename = sanitizedFilename.substring(0, sanitizedFilename.length - 4);
    }
    // Remove other common extensions to avoid sketch.txt.ino etc.
    const commonExtensions = ['.txt', '.js', '.cpp', '.c', '.h'];
    commonExtensions.forEach(ext => {
        if (sanitizedFilename.toLowerCase().endsWith(ext)) {
            sanitizedFilename = sanitizedFilename.substring(0, sanitizedFilename.length - ext.length);
        }
    });
    sanitizedFilename += '.ino';

    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizedFilename;
    a.click();
    window.URL.revokeObjectURL(url);
    showStatus(`Code exported as ${sanitizedFilename}`, "success");
});

// Ensure functions like refreshPorts and uploadCode use the ipcRenderer defined at the top
async function refreshPorts() { 
    console.log('app.js: refreshPorts function called.');
    const portSelector = document.getElementById('portSelector');
    const refreshButton = document.getElementById('refreshPortsButton');
    portSelector.innerHTML = '<option value="">Scanning...</option>';
    portSelector.disabled = true;
    refreshButton.disabled = true;

    try {
        if (!ipcRenderer || typeof ipcRenderer.invoke !== 'function') { // Check if ipcRenderer is valid
            throw new Error('ipcRenderer is not available or invalid.');
        }
        console.log('app.js: Calling ipcRenderer.invoke("list-ports")');
        const ports = await ipcRenderer.invoke('list-ports');
        console.log('app.js: Received ports from main process:', ports);
        
        portSelector.innerHTML = '<option value="">-- Select Port --</option>';
        if (ports && ports.length > 0) {
            ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port.path;
                // Try to create a more descriptive name
                let friendlyName = port.friendlyName || port.path;
                if (port.manufacturer) friendlyName += ` (${port.manufacturer})`;
                option.textContent = friendlyName;
                portSelector.appendChild(option);
            });
            portSelector.disabled = false;
        } else {
            portSelector.innerHTML = '<option value="">No ports found</option>';
            portSelector.disabled = true;
        }
    } catch (error) {
        console.error('app.js: Error listing ports:', error);
        portSelector.innerHTML = '<option value="">Error listing</option>';
        portSelector.disabled = true;
        // Display error to user
        updateStatus(`Error listing ports: ${error.message}`, 'error'); 
    } finally {
        refreshButton.disabled = false;
    }
}

// Ensure the event listener for the refresh button also logs
document.getElementById('refreshPortsButton').addEventListener('click', () => {
    console.log('app.js: Refresh Ports Button clicked.');
    refreshPorts();
});

// Add logging where the initial port refresh might happen (e.g., on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    console.log('app.js: DOMContentLoaded event fired.');
    // Any initial calls like refreshPorts() should happen here or after
    // Example:
    // if (window.isElectron) { // Only refresh if in Electron
    //     refreshPorts(); 
    // }
});

// Add logging inside the upload function
async function uploadCode() {
    console.log('app.js: uploadCode function called.');
    const portSelector = document.getElementById('portSelector'); // Define portSelector here
    const selectedPort = portSelector ? portSelector.value : null;
    const boardSelector = document.getElementById('boardSelector'); // Define boardSelector
    const selectedBoardValue = boardSelector ? boardSelector.value : 'uno'; // Get selected board value
    const code = Blockly.Arduino.workspaceToCode(workspace); // Ensure code is defined
    const fqbn = getBoardFqbn(selectedBoardValue); // Ensure fqbn is defined

    if (!selectedPort) {
        showStatus("Please select a port first", "error");
        return;
    }
    if (!fqbn) {
        showStatus(`Board definition not found for ${selectedBoardValue}`, "error");
        return;
    }

    try {
        if (!ipcRenderer || typeof ipcRenderer.invoke !== 'function') { // Check if ipcRenderer is valid
            throw new Error('ipcRenderer is not available or invalid.');
        }
        console.log('app.js: Calling ipcRenderer.invoke("upload-code")');
        const result = await ipcRenderer.invoke('upload-code', { code, port: selectedPort, board: fqbn }); // Use selectedPort
        console.log('app.js: Received upload result:', result);
        if (result.success) {
             showStatus(result.message || 'Upload successful!', 'success');
         } else {
             showStatus(result.message || 'Upload failed.', 'error');
         }
    } catch (error) {
        console.error('app.js: Error uploading code:', error);
        showStatus(`Upload failed: ${error.message}`, 'error');
    }
}

// Make sure the upload button listener logs
document.getElementById('uploadButton').addEventListener('click', () => {
    console.log('app.js: Upload button clicked.');
    uploadCode();
});

// Function to update status messages (ensure it exists)
function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessages');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status-messages status-${type}`;
        console.log(`app.js: Status update (${type}): ${message}`);
    } else {
        console.error('app.js: statusMessages element not found!');
    }
}

// Initial setup or calls on load
console.log('app.js: Script loaded and running.');
// Ensure refreshPorts is called on load if needed, e.g.:
// document.addEventListener('DOMContentLoaded', refreshPorts); // Or similar logic

// Add getBoardFqbn helper function (if not already present)
function getBoardFqbn(boardId) {
    // Map simple board IDs to Arduino CLI FQBNs
    const boardMap = {
        uno: 'arduino:avr:uno',
        nano: 'arduino:avr:nano:cpu=atmega328old', // Use old bootloader by default for Nano
        mega: 'arduino:avr:mega'  // Assuming Mega 2560
    };
    return boardMap[boardId] || null;
}
