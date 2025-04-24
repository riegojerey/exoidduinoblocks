// app.js

/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Global variables (defined outside onload)
let workspace = null;
let serialPort = null;
let selectedBoard = 'uno';

/**
 * Main initialization function. Called by window.onload.
 */
function startApp() {
    console.log("window.onload fired. Attempting to initialize Blockly...");

    // Get DOM elements
    const toolbox = document.getElementById('toolbox');
    const blocklyDiv = document.getElementById('blocklyDiv');
    const codeDiv = document.getElementById('codeDiv');
    const boardSelector = document.getElementById('boardSelector');
    const uploadButton = document.getElementById('uploadButton');
    const serialButton = document.getElementById('serialButton');

    // --- Essential Library Checks ---
    if (typeof Blockly === 'undefined') {
         console.error("FATAL: Blockly core library not loaded.");
         blocklyDiv.innerHTML = "Error: Blockly core failed to load.";
         return;
    }
    // *** CRITICAL CHECK: Ensure Arduino generator is loaded ***
    if (typeof Blockly.Arduino === 'undefined') {
        console.error("FATAL: Blockly Arduino generator not loaded. Cannot proceed.");
        blocklyDiv.innerHTML = "Error: Blockly Arduino components failed to load. Check script tags, network, and console for other errors.";
        // Display a more user-friendly message on the page itself
        const errorMsg = document.createElement('p');
        errorMsg.style.color = 'red';
        errorMsg.style.fontWeight = 'bold';
        errorMsg.textContent = 'Error: Failed to load necessary Arduino components. Please check your internet connection and refresh the page. See console for details.';
        blocklyDiv.appendChild(errorMsg);
        return; // Stop initialization
    }
     if (typeof Prism === 'undefined' || typeof Prism.highlightElement === 'undefined') {
        console.warn("Prism syntax highlighter core not fully loaded.");
    } else if (!Prism.languages || !Prism.languages.clike || !Prism.languages.cpp) {
         console.warn("Prism C++/C-like languages not fully loaded.");
     }


    // --- Blockly Workspace Configuration ---
    const options = {
        toolbox: toolbox,
        renderer: 'zelos',
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
        trashcan: true
    };

    // --- Inject Blockly ---
    try {
        workspace = Blockly.inject(blocklyDiv, options);
        console.log("Blockly workspace injected successfully.");
    } catch (e) {
        console.error("Error injecting Blockly:", e);
        blocklyDiv.innerHTML = "Error loading Blockly workspace. Please check console.";
        return;
    }

    // --- Event Listener for Code Generation ---
    function updateCode() {
        // Generator check (should pass if initial check passed)
        if (typeof Blockly.Arduino === 'undefined') {
            console.warn("updateCode: Arduino generator missing.");
            codeDiv.textContent = "/* Error: Arduino generator missing. */";
            return;
        }

        try {
            // Generate Arduino C++ code
            const code = Blockly.Arduino.workspaceToCode(workspace);
            codeDiv.textContent = code || `/* Drag blocks here to generate code for ${selectedBoard} */`;

            // Re-highlight code using Prism.js
            if (window.Prism && Prism.highlightElement && Prism.languages && Prism.languages.clike && Prism.languages.cpp) {
                const elementToHighlight = document.getElementById('codeDiv');
                if (elementToHighlight) {
                    Prism.highlightElement(elementToHighlight);
                } else {
                    console.warn("updateCode: Could not find codeDiv for highlighting.");
                }
            } else {
                 console.warn("updateCode: Prism highlighting prerequisites not met.");
            }
        } catch (e) {
            console.error("Error during code generation or highlighting:", e);
            codeDiv.textContent = "/* Error generating code. Check console. */";
        }
    }

    // Add workspace change listener
    workspace.addChangeListener((event) => {
        if (event.isUiEvent) return;
        if (event.type === Blockly.Events.BLOCK_CHANGE ||
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.BLOCK_MOVE ||
            event.type === Blockly.Events.FINISHED_LOADING) {
            updateCode();
        }
    });

    // --- Board Selector Listener ---
    if (boardSelector) {
        boardSelector.addEventListener('change', (event) => {
            selectedBoard = event.target.value;
            console.log(`Board selected: ${selectedBoard}`);
            updateCode();
        });
        selectedBoard = boardSelector.value;
    } else {
        console.warn("Board selector element not found.");
    }

    // --- Upload Button Listener ---
    if (uploadButton) {
        uploadButton.addEventListener('click', async () => {
             if (typeof Blockly.Arduino === 'undefined') {
                alert("Error: Cannot generate code, Arduino components not ready.");
                return;
            }
            if (!("serial" in navigator)) {
                alert("Web Serial API not supported.");
                return;
            }

            console.log(`Attempting connection for ${selectedBoard}...`);
            let port;
            let baudRate = 115200;
            if (selectedBoard === 'esp32') baudRate = 115200;

            try {
                port = await navigator.serial.requestPort();
                console.log("Port selected:", port.getInfo());
                await port.open({ baudRate: baudRate });
                console.log("Port opened at", baudRate);

                const codeToUpload = Blockly.Arduino.workspaceToCode(workspace);
                if (!codeToUpload) {
                     alert("No code generated.");
                     if (port?.writable) await port.close();
                     console.log("Port closed (no code).");
                     return;
                }

                console.log(`Generated Code for ${selectedBoard}:\n`, codeToUpload);
                alert(`Web Serial connected for ${selectedBoard}! Compilation & upload protocol needed.`);
                console.log("Placeholder: Upload protocol needed here.", selectedBoard);

            } catch (error) {
                console.error("Web Serial Error:", error);
                if (error.name === 'NotFoundError') alert('Connection failed: No port selected.');
                else if (error.name === 'InvalidStateError') alert('Connection failed: Port busy.');
                else alert(`Serial connection error: ${error.message}`);
                port = null;
            } finally {
                if (port?.readable) {
                    try { await port.close(); console.log("Port closed."); }
                    catch (closeError) { if (!closeError.message.includes("closed")) console.error("Error closing port:", closeError); }
                }
            }
        });
    } else {
         console.warn("Upload button not found.");
    }

    // --- Serial Monitor Button Listener ---
    if (serialButton) {
        serialButton.addEventListener('click', async () => {
             if (!("serial" in navigator)) { alert("Web Serial API not supported."); return; }
             if (serialPort?.readable) { alert("Serial monitor already active (conceptually)."); return; }

             alert(`Serial monitor for ${selectedBoard} not fully implemented. Connecting...`);
             try {
                const port = await navigator.serial.requestPort();
                await port.open({ baudRate: 9600 });
                serialPort = port;
                alert(`Connected for monitor at 9600 baud. Reading/Writing TBD.`);
                console.log("Monitor port opened:", serialPort.getInfo());
                 // Placeholder: Implement reading/writing
             } catch (err) {
                 console.error("Monitor Port Error:", err);
                 alert(`Failed to open monitor port: ${err.message}`);
                 serialPort = null;
             }
        });
    } else {
         console.warn("Serial button not found.");
    }

    // --- Window Resize Handler ---
    function onResize() {
        const blocklyArea = document.getElementById('blocklyArea');
        const blocklyDivElement = document.getElementById('blocklyDiv');
        if (!blocklyArea || !blocklyDivElement) return;

        let element = blocklyDivElement;
        let x = 0, y = 0;
        if (element.offsetParent) {
           do { x += element.offsetLeft; y += element.offsetTop; element = element.offsetParent; } while (element);
        }
        blocklyDivElement.style.left = x + 'px';
        blocklyDivElement.style.top = y + 'px';
        blocklyDivElement.style.width = blocklyArea.offsetWidth + 'px';
        blocklyDivElement.style.height = blocklyArea.offsetHeight + 'px';
        if (workspace) Blockly.svgResize(workspace);
    }

    window.addEventListener('resize', onResize, false);
    onResize(); // Initial resize

    // --- Initial Code Generation ---
    // Called now that we are sure everything is loaded
    updateCode();
    console.log("Initial code generation performed.");

    console.log("Blockly initialization sequence complete.");
}

// --- Assign the main function to window.onload ---
// This ensures the entire page, including external scripts, is loaded
// before the app initialization logic runs.
window.onload = startApp;
