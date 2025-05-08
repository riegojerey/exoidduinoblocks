const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const os = require('os');
const log = require('electron-log');

// Configure logging
// Use resolvePathFn for new versions
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
log.transports.file.level = 'info'; // Log info level and above to file
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'; // Show more in dev console

// Log any uncaught exceptions using the new API
// log.catchErrors(); // Deprecated
log.errorHandler.startCatching();

// Optionally override console methods (keep as is or remove if not needed)
// Object.assign(console, log.functions);

log.info('App starting...');

const isDev = !app.isPackaged;
const USER_DATA_DIR = app.getPath('userData');
log.info(`User data directory: ${USER_DATA_DIR}`);

// --- Corrected Resource Path Calculation ---
// In development, resources are relative to project root.
// In production (packaged), resources are in process.resourcesPath.
const RESOURCES_DIR = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');

// Arduino CLI and data are expected inside the resources directory in production
const ARDUINO_DATA_DIR = path.join(RESOURCES_DIR, 'arduino-data');
const ARDUINO_CLI_PATH = path.join(ARDUINO_DATA_DIR, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
const ARDUINO_CONFIG_PATH = path.join(ARDUINO_DATA_DIR, 'arduino-cli.yaml');
const TEMP_SKETCH_DIR = path.join(os.tmpdir(), 'ExoiDuinoSketch');

log.info('-- Resource Paths --');
log.info(`isDev: ${isDev}`);
log.info(`RESOURCES_DIR: ${RESOURCES_DIR}`);
log.info(`ARDUINO_DATA_DIR: ${ARDUINO_DATA_DIR}`);
log.info(`ARDUINO_CLI_PATH: ${ARDUINO_CLI_PATH}`);
log.info(`ARDUINO_CONFIG_PATH: ${ARDUINO_CONFIG_PATH}`);
log.info('---------------------');

// Helper function to copy directories recursively
function copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const entries = fs.readdirSync(source, { withFileTypes: true });
    entries.forEach(entry => {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}

// Update checkArduinoCLI to use the directly calculated paths
function checkArduinoCLI() {
    log.info('checkArduinoCLI using direct paths:', { 
        cliPath: ARDUINO_CLI_PATH, 
        configPath: ARDUINO_CONFIG_PATH 
    });

    if (!ARDUINO_CLI_PATH) { // Should not happen with direct calculation
        const errorMsg = 'Arduino CLI path constant is not set.';
        log.error(errorMsg);
        throw new Error(errorMsg);
    }
    if (!fs.existsSync(ARDUINO_CLI_PATH)) {
        const errorMsg = `Arduino CLI not found at expected path: ${ARDUINO_CLI_PATH}. Build might be incomplete or resource path incorrect.`;
        log.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    if (!ARDUINO_CONFIG_PATH) { // Should not happen
        const errorMsg = 'Arduino CLI config path constant is not set.';
        log.error(errorMsg);
        throw new Error(errorMsg);
    }
    if (!fs.existsSync(ARDUINO_CONFIG_PATH)) {
        const errorMsg = `Arduino CLI configuration not found at expected path: ${ARDUINO_CONFIG_PATH}. Build might be incomplete or resource path incorrect.`;
        log.error(errorMsg);
        throw new Error(errorMsg);
    }
    log.info('Arduino CLI checks passed using direct paths.');
}

// Clean up temporary files
function cleanupTempFiles() {
    if (fs.existsSync(TEMP_SKETCH_DIR)) {
        try {
            fs.rmSync(TEMP_SKETCH_DIR, { recursive: true, force: true });
            log.info(`Cleaned up temp directory: ${TEMP_SKETCH_DIR}`);
        } catch (err) {
            log.error('Error cleaning up temp files:', err);
        }
    }
}

// Function to validate FQBN format (e.g., arduino:avr:nano or arduino:avr:nano:cpu=atmega328old)
function validateFQBNFormat(fqbn) {
    if (!fqbn) return false;
    
    // Allow standard FQBN format with optional parameters
    // Updated regex to support both formats: 
    // - arduino:avr:nano 
    // - arduino:avr:nano:cpu=atmega328old
    const fqbnRegex = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+(:[a-zA-Z0-9_-]+=.*)?$/;
    
    if (fqbnRegex.test(fqbn)) {
        log.info(`FQBN format validated: ${fqbn}`);
        return true;
    }
    
    log.error(`Invalid FQBN format: ${fqbn}`);
    return false;
}

function createWindow() {
    log.info('Creating main window...');
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // enableRemoteModule: true, // Deprecated and potentially insecure
            preload: path.join(__dirname, 'preload.js') // Recommended: Use a preload script
        }
    });

    // Load the index.html file
    const indexHtmlPath = path.join(__dirname, '..', 'index.html'); // Simplified path for both dev/prod
    log.info(`Loading index.html from: ${indexHtmlPath}`);
    mainWindow.loadFile(indexHtmlPath);

    // Enable DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
        log.info('DevTools opened in development mode');
    }

    // Handle any navigation errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        log.error('Failed to load main window:', { errorCode, errorDescription });
    });

    // Log when the window is ready
    mainWindow.webContents.on('did-finish-load', () => {
        log.info('Main window loaded successfully');
    });

    log.info('Main window created.');
    return mainWindow;
}

// Enable logging
app.on('ready', () => {
    log.info('App is ready event fired');
    log.info(`App path: ${app.getAppPath()}`);
    log.info(`User Data path: ${app.getPath('userData')}`); // Log again here just in case
});

app.whenReady().then(async () => {
    log.info('App whenReady promise resolved');
    try {
        // Check if the essential bundled CLI exists before creating the window
        checkArduinoCLI(); 
        createWindow();
    } catch (error) {
        log.error('Critical startup error during CLI check:', error);
        // Consider showing an error dialog to the user here
        // dialog.showErrorBox('Fatal Error', 'Required Arduino components are missing or corrupted. Please reinstall the application.\n\nDetails: ' + error.message);
        app.quit();
    }

    app.on('activate', function () {
        log.info('App activate event fired');
        if (BrowserWindow.getAllWindows().length === 0) {
            try {
                 checkArduinoCLI(); // Re-check on activate if creating new window
                 createWindow();
            } catch (error) {
                 log.error('Critical activate error during CLI check:', error);
                 // dialog.showErrorBox(...);
                 app.quit();
            }
        }
    });
});

app.on('window-all-closed', function () {
    log.info('App window-all-closed event fired');
    if (process.platform !== 'darwin') {
         cleanupTempFiles(); // Clean up temp sketch folder on exit
         app.quit();
    }
});

app.on('quit', () => {
     log.info('App quit event fired');
     cleanupTempFiles(); // Ensure cleanup happens on quit as well
});

// Keep track of open ports
const openPorts = new Map();

// Function to close all open ports
async function closeAllPorts() {
    log.info('Closing all open serial ports...');
    for (const [portPath, port] of openPorts.entries()) {
        try {
            if (port.isOpen) {
                await new Promise((resolve, reject) => {
                    port.close(err => {
                        if (err) {
                            log.warn(`Error closing port ${portPath}: ${err.message}`);
                            reject(err);
                        } else {
                            log.info(`Closed port ${portPath}`);
                            resolve();
                        }
                    });
                });
            }
        } catch (error) {
            log.error(`Error closing port ${portPath}:`, error);
        }
    }
    openPorts.clear();
}

// Add cleanup on app quit
app.on('before-quit', async () => {
    await closeAllPorts();
});

// Enhanced port detection with retries and better error handling
async function listPortsWithRetry(maxRetries = 3, delay = 1000) {
    // First, close any open ports
    await closeAllPorts();
    
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            log.info(`Attempt ${i + 1} to list ports...`);
            const ports = await SerialPort.list();
            log.info('Raw available ports:', JSON.stringify(ports, null, 2));
            
            // Filter for likely Arduino ports with broader detection
            const arduinoPorts = ports.filter(port => {
                const { manufacturer, vendorId, productId, pnpId } = port;
                const isArduino = (
                    // Common Arduino manufacturers
                    (manufacturer && /arduino|wch|ftdi|silicon_labs|qinheng/i.test(manufacturer)) ||
                    // Common Arduino vendor IDs (including CH340)
                    (vendorId && /2341|1a86|0403|10c4/i.test(vendorId)) ||
                    // CH340 specific product IDs
                    (productId && /7523|5523/i.test(productId)) ||
                    // If no manufacturer but has COM or tty in path
                    (!manufacturer && (port.path.toLowerCase().includes('com') || 
                                     port.path.toLowerCase().includes('tty'))) ||
                    // Check PNP ID for CH340
                    (pnpId && /ch340/i.test(pnpId))
                );
                log.debug(`Port ${port.path} isArduino:`, isArduino, {manufacturer, vendorId, productId, pnpId});
                return isArduino;
            });

            log.info('Filtered Arduino ports:', arduinoPorts);
            return arduinoPorts;
        } catch (error) {
            log.error(`Attempt ${i + 1} failed to list ports:`, error);
            lastError = error;
            if (!isDev) {
                // More detailed logging for production errors
                log.error('Production SerialPort.list Error Details:', {
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                });
            }
            if (i < maxRetries - 1) {
                log.warn(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    // Throw the last captured error if all retries fail
    log.error(`Failed to list ports after ${maxRetries} attempts.`);
    throw lastError || new Error(`Failed to list ports after ${maxRetries} attempts.`);
}

// Update the list-ports handler with better error handling
ipcMain.handle('list-ports', async () => {
    log.info('IPC Handler: list-ports invoked');
    try {
        // Ensure environment is set up first
        log.info('list-ports: Ensuring setup...');
        await checkArduinoCLI();
        log.info('list-ports: Setup confirmed.');
        
        const ports = await listPortsWithRetry();
        log.info('Available ports:', ports);
        return ports;
    } catch (error) {
        log.error('Error in list-ports handler:', error);
        // Rethrow the error so the renderer process knows something went wrong
        throw error; 
    }
});

// Improved serial port connection handling
async function openSerialPort(portPath, options = {}) {
    // First, close the port if it's already open
    if (openPorts.has(portPath)) {
        const existingPort = openPorts.get(portPath);
        try {
            if (existingPort.isOpen) {
                await new Promise((resolve, reject) => {
                    existingPort.close(err => {
                        if (err) {
                            log.warn(`Error closing existing port ${portPath}: ${err.message}`);
                            reject(err);
                        } else {
                            log.info(`Closed existing port ${portPath}`);
                            resolve();
                        }
                    });
                });
            }
        } catch (error) {
            log.error(`Error closing existing port ${portPath}:`, error);
        }
        openPorts.delete(portPath);
    }

    const defaultOptions = {
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
    };

    const port = new SerialPort({
        path: portPath,
        ...defaultOptions,
        ...options
    });

    return new Promise((resolve, reject) => {
        port.on('error', (err) => {
            log.error('Serial port error:', err);
            reject(err);
        });

        port.open((err) => {
            if (err) {
                log.error('Failed to open port:', err);
                reject(err);
                return;
            }
            log.info('Port opened successfully:', portPath);
            openPorts.set(portPath, port);
            resolve(port);
        });
    });
}

// Handle serial port operations
ipcMain.handle('open-port', async (event, portPath, options) => {
    log.info('Opening port:', portPath, 'with options:', options);
    try {
        const port = await openSerialPort(portPath, options);
        
        // Setup parser
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        
        // Handle incoming data
        parser.on('data', (data) => {
            log.info('Received:', data);
            event.sender.send('serial-data', { port: portPath, data });
        });

        return { success: true, message: 'Port opened successfully' };
    } catch (error) {
        log.error('Failed to open port:', error);
        throw error;
    }
});

// Handle Arduino board detection
ipcMain.handle('detect-board', async (event, portPath) => {
    log.info('IPC Handler: detect-board invoked', { portPath });
    try {
        // Ensure setup is complete first
        log.info('detect-board: Ensuring setup...');
        await checkArduinoCLI(); 
        log.info('detect-board: Setup confirmed.');

        if (!portPath) {
            throw new Error('Port path is required');
        }

        // Properly quote paths for the command - Use working directory paths!
        const cliPath = `"${ARDUINO_CLI_PATH}"`; // Already uses global
        const configPath = `"${ARDUINO_CONFIG_PATH}"`; // Already uses global
        
        log.info('Executing board detection command...', { cliPath, configPath });
        
        try {
            const result = execSync(`${cliPath} board list --config-file ${configPath} --format json`, {
                timeout: 10000 // 10 second timeout
            }).toString();
            
            // Need to handle potential empty output from board list
            let boards = [];
            if (result && result.trim() !== '') {
                try {
                    boards = JSON.parse(result);
                    log.info('Parsed board list:', boards);
                } catch (parseError) {
                    log.error('Error parsing board detection result JSON:', parseError, 'Raw result:', result);
                    throw new Error(`Failed to parse board detection result: ${parseError.message}`);
                }
            } else {
                log.info('Board list command returned empty result.');
            }
            
            // Handle both array and object responses (though CLI usually returns array)
            const boardList = Array.isArray(boards) ? boards : (boards ? [boards] : []); // Ensure boardList is always an array
            
            // Find the board associated with the specific port
            const detectedBoardInfo = boardList.find(b => b.port?.address === portPath);

            if (!detectedBoardInfo) {
                log.info('No matching board found directly for port:', portPath, 'Checking VID/PID...');
                
                // Attempt to get port details from serialport listing again if needed
                let portInfo = null;
                try {
                    const allPorts = await SerialPort.list();
                    portInfo = allPorts.find(p => p.path === portPath);
                    log.info('Port details:', portInfo);
                } catch (listErr) {
                    log.warn('Could not list ports again during board detection:', listErr);
                }

                // Check if it's an FTDI-based board (common for Nanos)
                if (portInfo?.vendorId === '0403' && portInfo?.productId === '6001') {
                    log.info('Detected FTDI-based board, likely Arduino Nano');
                    return {
                        // Return structure matching CLI output even if inferred
                        matching_boards: [{ name: "Arduino Nano", fqbn: "arduino:avr:nano:cpu=atmega328old" }],
                        port: { address: portPath, protocol: "serial" } 
                    };
                }
                
                // For CH340 USB chips (commonly used with clones)
                if (portInfo?.vendorId === '1a86') {
                    log.info('Detected CH340-based board, likely Arduino Nano clone');
                    return {
                        matching_boards: [{ name: "Arduino Nano (CH340)", fqbn: "arduino:avr:nano:cpu=atmega328old" }],
                        port: { address: portPath, protocol: "serial" } 
                    };
                }
                
                // For generic Arduinos when detection fails, use the simple default
                log.warn('Board not specifically identified, using default Arduino Nano configuration');
                return {
                     matching_boards: [{ name: "Arduino Nano (default)", fqbn: "arduino:avr:nano:cpu=atmega328old" }],
                     port: { address: portPath, protocol: "serial" } 
                };
            } else {
                log.info('Found matching board via CLI:', detectedBoardInfo);
                // Ensure the returned board object has the expected structure for the frontend
                
                // For Nano boards specifically, force the old bootloader FQBN
                if (detectedBoardInfo.matching_boards && detectedBoardInfo.matching_boards.length > 0) {
                    const matchingBoard = detectedBoardInfo.matching_boards[0];
                    if (matchingBoard.name.toLowerCase().includes('nano')) {
                        log.info('Detected Arduino Nano, forcing old bootloader FQBN');
                        matchingBoard.fqbn = 'arduino:avr:nano:cpu=atmega328old';
                    }
                }
                
                return detectedBoardInfo;
            }
        } catch (cmdError) {
            log.error('Error executing board detection command:', cmdError);
            
            // Attempt to get port details from serialport listing as fallback
            try {
                const allPorts = await SerialPort.list();
                const portInfo = allPorts.find(p => p.path === portPath);
                log.info('Port details (fallback):', portInfo);
                
                // Assume it's a Nano in the fallback scenario 
                // (most likely case for our target application)
                return {
                    matching_boards: [{ name: "Arduino Nano (fallback)", fqbn: "arduino:avr:nano:cpu=atmega328old" }],
                    port: { address: portPath, protocol: "serial" } 
                };
            } catch (listErr) {
                log.error('Could not list ports in fallback:', listErr);
                throw new Error(`Failed to detect board: ${cmdError.message}`);
            }
        }
    } catch (error) {
        log.error('Error in detect-board handler:', error);
        throw error;
    }
});

// Add this helper function for running commands asynchronously
function runCommandAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
        log.info(`Running command asynchronously: ${command}`);
        
        // Don't try to parse the command - use simple shell execution instead
        const process = spawn(command, [], {
            ...options,
            shell: true,
            windowsVerbatimArguments: true
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            const dataStr = data.toString();
            stdout += dataStr;
            log.info(`Command output: ${dataStr.trim()}`);
        });
        
        process.stderr.on('data', (data) => {
            const dataStr = data.toString();
            stderr += dataStr;
            log.error(`Command error: ${dataStr.trim()}`);
        });
        
        process.on('close', (code) => {
            log.info(`Command exited with code ${code}`);
            
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
        });
        
        process.on('error', (error) => {
            log.error(`Failed to start command: ${error.message}`);
            reject(error);
        });
        
        // Handle timeout
        if (options.timeout) {
            setTimeout(() => {
                process.kill();
                reject(new Error(`Command timed out after ${options.timeout}ms`));
            }, options.timeout);
        }
    });
}

// Add this function to force kill any processes using the COM port
async function forceReleasePort(port) {
    log.info(`Attempting to force release ${port}`);
    
    if (process.platform === 'win32') {
        try {
            // Get the COM port number
            const portNumber = port.replace(/\D/g, '');
            
            // Use PowerShell to find and kill processes using the COM port
            const psCommand = `Get-CimInstance -ClassName Win32_Process | Where-Object { $_.CommandLine -like '*${port}*' -or $_.CommandLine -like '*COM${portNumber}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
            
            await runCommandAsync('powershell -Command "' + psCommand + '"', {
                timeout: 10000
            });
            
            log.info(`Force released ${port}`);
            // Wait a moment after killing processes
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            log.warn(`Error during force release of ${port}:`, error);
        }
    }
}

// Add this function to check if a port is actually available
async function isPortAvailable(port) {
    try {
        const tempPort = new SerialPort({
            path: port,
            baudRate: 9600,
            autoOpen: false
        });

        return new Promise((resolve) => {
            tempPort.open((err) => {
                if (err) {
                    log.warn(`Port ${port} is not available:`, err.message);
                    resolve(false);
                } else {
                    tempPort.close(() => {
                        log.info(`Port ${port} is available`);
                        resolve(true);
                    });
                }
            });
        });
    } catch (error) {
        log.warn(`Error checking port availability:`, error);
        return false;
    }
}

// Update the ensurePortIsAvailable function
async function ensurePortIsAvailable(port) {
    log.info(`Ensuring port ${port} is available before upload`);
    
    // First, close any existing connections we have
    await closeAllPorts();
    
    // Check initial port availability
    let isAvailable = await isPortAvailable(port);
    
    if (!isAvailable) {
        log.info(`Port ${port} is not immediately available, attempting to force release...`);
        
        // Force release the port
        await forceReleasePort(port);
        
        // Try resetting the Arduino by toggling DTR
        try {
            log.info(`Attempting DTR toggle reset on ${port}`);
            const resetPort = new SerialPort({
                path: port,
                baudRate: 1200,
                autoOpen: false
            });
            
            await new Promise((resolve) => {
                resetPort.open((err) => {
                    if (!err) {
                        // Toggle DTR
                        resetPort.set({ dtr: true }, () => {
                            setTimeout(() => {
                                resetPort.set({ dtr: false }, () => {
                                    setTimeout(() => {
                                        resetPort.close(() => {
                                            resolve();
                                        });
                                    }, 100);
                                });
                            }, 100);
                        });
                    } else {
                        resolve();
                    }
                });
            });
            
            // Wait for the board to reset
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            log.warn(`Error during DTR reset:`, error);
        }
        
        // Check availability again
        isAvailable = await isPortAvailable(port);
        
        if (!isAvailable) {
            log.warn(`Port ${port} is still not available after reset attempts`);
            // One final force release attempt
            await forceReleasePort(port);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Final availability check
    isAvailable = await isPortAvailable(port);
    if (!isAvailable) {
        throw new Error(`Could not free port ${port}. Please try manually disconnecting and reconnecting the board.`);
    }
    
    log.info(`Port ${port} is now available`);
}

// Replace the upload-code handler with this asynchronous version
ipcMain.handle('upload-code', async (event, { code, port, board }) => {
    log.info('IPC Handler: upload-code invoked', { port, board });
    try {
        // Ensure setup is complete first
        log.info('upload-code: Ensuring setup...');
        await checkArduinoCLI(); 
        log.info('upload-code: Setup confirmed.');

        // Log the state of globals right before check
        log.info('>>> Checking global paths before use in upload-code:', { 
            cliPath: ARDUINO_CLI_PATH, 
            configPath: ARDUINO_CONFIG_PATH, 
            workDir: ARDUINO_DATA_DIR 
        });

        checkArduinoCLI(); // Will throw if paths are bad
        
        // Validate FQBN
        if (!validateFQBNFormat(board)) {
            throw new Error(`Invalid board FQBN format: ${board}`);
        }
        log.info(`FQBN format validated: ${board}`);
        
        // Ensure the port is available before proceeding
        await ensurePortIsAvailable(port);
        
        // Check for FTDI-based Arduino Nano
        let fqbnToUse = board;
        if (board === 'arduino:avr:nano') {
            try {
                const ports = await listPortsWithRetry();
                const targetPort = ports.find(p => p.path === port);
                if (targetPort && (targetPort.vendorId === '0403' || (targetPort.manufacturer && targetPort.manufacturer.includes('FTDI')))) {
                    log.info('Detected FTDI-based Arduino Nano, using old bootloader FQBN');
                    // Use correct FQBN for old bootloader (atmega328old)
                    fqbnToUse = 'arduino:avr:nano:cpu=atmega328old';
                    log.info(`Selected FQBN for FTDI board: ${fqbnToUse}`);
                } else {
                    // For non-FTDI boards, use the default (no cpu option)
                    // The test showed that atmega328p is not a valid option
                    fqbnToUse = 'arduino:avr:nano';
                    log.info(`Selected FQBN for non-FTDI board: ${fqbnToUse}`);
                }
            } catch (err) {
                log.warn('Error checking for FTDI board:', err.message);
                // Fallback to old bootloader for safety
                fqbnToUse = 'arduino:avr:nano:cpu=atmega328old';
                log.info(`Fallback FQBN: ${fqbnToUse}`);
            }
        }
        log.info(`Using FQBN for upload: ${fqbnToUse}`);

        // Create sketch in the OS temporary directory
        const sketchDir = TEMP_SKETCH_DIR; // Use OS temp dir
        fs.mkdirSync(sketchDir, { recursive: true });
        const sketchPath = path.join(sketchDir, 'upload.ino');
        
        // Write the code
        fs.writeFileSync(sketchPath, code || 'void setup() {}\nvoid loop() {}');
        log.info(`Wrote sketch to: ${sketchPath}`);
  
        // Compile the code asynchronously
        log.info('Compiling sketch...');
        // Use double quotes for all paths on Windows
        const cliPathQuoted = `"${ARDUINO_CLI_PATH}"`;
        const configPathQuoted = `"${ARDUINO_CONFIG_PATH}"`;
        const sketchDirQuoted = `"${sketchDir}"`;
        
        const compileCmd = `${cliPathQuoted} compile --config-file ${configPathQuoted} --fqbn ${fqbnToUse} ${sketchDirQuoted}`; 
        log.info('Compile command:', compileCmd);
        
        try {
            // Run compilation asynchronously
            await runCommandAsync(compileCmd, { 
                cwd: ARDUINO_DATA_DIR,
                timeout: 30000 // 30 second timeout
            });
            
            log.info('Compile successful.');
            
            // Upload the compiled code asynchronously
            log.info('Uploading to board...');
            const uploadCmd = `${cliPathQuoted} upload -p ${port} --config-file ${configPathQuoted} --fqbn ${fqbnToUse} --verbose ${sketchDirQuoted}`;
            log.info('Upload command:', uploadCmd);
            
            try {
                await runCommandAsync(uploadCmd, { 
                    cwd: ARDUINO_DATA_DIR,
                    timeout: 60000 // 60 second timeout
                });
                
                log.info('Upload successful.');
        return { success: true, message: 'Upload completed successfully!' };
            } catch (uploadError) {
                log.error('Upload failed:', uploadError.message);
                
                // Check for common access denied errors
                if (uploadError.message.includes("Access is denied") || 
                    uploadError.message.includes("access denied") || 
                    uploadError.message.includes("being used by another process")) {
                    
                    log.error('Serial port access denied. Port might be in use by another program.');
                    
                    // Try to reset the port once more
                    try {
                        await ensurePortIsAvailable(port);
                        
                        // Try one more time to upload with a delay
                        log.info('Retrying upload after port reset...');
                        
                        // Use proper promise-based approach instead of setTimeout
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        try {
                            await runCommandAsync(uploadCmd, { 
                                cwd: ARDUINO_DATA_DIR,
                                timeout: 60000 // 60 second timeout
                            });
                            
                            log.info('Upload successful on retry.');
                            return { success: true, message: 'Upload completed successfully on retry!' };
                        } catch (retryError) {
                            log.error('Retry upload also failed:', retryError.message);
                            return {
                                success: false,
                                message: `Serial port COM${port.replace(/\D/g, '')} is in use. Please close any other programs using this port, disconnect and reconnect your Arduino, then try again.`,
                                error: retryError.message || 'Serial port access error'
                            };
                        }
                    } catch (resetError) {
                        log.error('Port reset failed:', resetError.message);
                        return {
                            success: false,
                            message: `Serial port COM${port.replace(/\D/g, '')} is in use. Please close any other programs using this port, disconnect and reconnect your Arduino, then try again.`,
                            error: uploadError.message || 'Serial port access error'
                        };
                    }
                } 
                // If upload fails with old bootloader, try with regular bootloader
                else if (fqbnToUse.includes('atmega328old')) {
                    log.info('Retrying with standard bootloader...');
                    // Use base FQBN without options
                    const altFqbn = 'arduino:avr:nano';
                    const altUploadCmd = `${cliPathQuoted} upload -p ${port} --config-file ${configPathQuoted} --fqbn ${altFqbn} --verbose ${sketchDirQuoted}`;
                    log.info('Alternative upload command:', altUploadCmd);
                    
                    try {
                        await runCommandAsync(altUploadCmd, { 
                            cwd: ARDUINO_DATA_DIR,
                            timeout: 60000 // 60 second timeout
                        });
                        
                        log.info('Upload with standard bootloader successful.');
                        return { success: true, message: 'Upload completed successfully with standard bootloader!' };
                    } catch (altUploadError) {
                        log.error('Alternative upload also failed:', altUploadError.message);
                        return {
                            success: false,
                            message: `Upload failed: ${altUploadError.message}`,
                            error: altUploadError.message || 'Unknown error'
                        };
                    }
                } else {
                    return {
                        success: false,
                        message: `Upload failed: ${uploadError.message}`,
                        error: uploadError.message || 'Unknown error'
                    };
                }
            }
        } catch (compileError) {
            log.error('Compilation failed:', compileError.message);
            
            // If compilation fails with old bootloader, try with standard bootloader 
            if (fqbnToUse.includes('atmega328old')) {
                log.info('Retrying compilation with standard bootloader...');
                // Use the base FQBN without any options
                const altFqbn = 'arduino:avr:nano';
                const altCompileCmd = `${cliPathQuoted} compile --config-file ${configPathQuoted} --fqbn ${altFqbn} ${sketchDirQuoted}`;
                log.info('Alternative compile command:', altCompileCmd);
                
                try {
                    await runCommandAsync(altCompileCmd, { 
                        cwd: ARDUINO_DATA_DIR,
                        timeout: 30000 // 30 second timeout
                    });
                    
                    log.info('Compilation with standard bootloader successful.');
                    
                    // Now try uploading with the standard bootloader
                    const altUploadCmd = `${cliPathQuoted} upload -p ${port} --config-file ${configPathQuoted} --fqbn ${altFqbn} --verbose ${sketchDirQuoted}`;
                    
                    try {
                        await runCommandAsync(altUploadCmd, { 
                            cwd: ARDUINO_DATA_DIR,
                            timeout: 60000 // 60 second timeout
                        });
                        
                        log.info('Upload with standard bootloader successful.');
                        return { success: true, message: 'Upload completed successfully with standard bootloader!' };
                    } catch (altUploadError) {
                        log.error('Alternative upload failed:', altUploadError.message);
                        return {
                            success: false,
                            message: `Compilation failed: ${altCompileError.message}`,
                            error: altCompileError.message || 'Unknown error'
                        };
                    }
                } catch (altCompileError) {
                    log.error('Alternative compilation also failed:', altCompileError.message);
                    return {
                        success: false,
                        message: `Compilation failed: ${altCompileError.message}`,
                        error: altCompileError.message || 'Unknown error'
                    };
                }
            } else {
                return {
                    success: false,
                    message: `Compilation failed: ${compileError.message}`,
                    error: compileError.message || 'Unknown error'
                };
            }
        }
    } catch (error) {
        log.error('Error during upload process:', error);
        
        // Return appropriate error structure for frontend
        return {
            success: false,
            message: `Upload failed: ${error.message}`,
            error: error.message || 'Unknown error'
        };
    }
});

// Handle library installation
ipcMain.handle('install-library', async (event, libraryName) => {
    log.info('IPC Handler: install-library invoked', { libraryName });
    try {
        checkArduinoCLI();
        if (!libraryName) {
            throw new Error('Library name is required');
        }
        // Add --config-file argument
        execSync(`"${ARDUINO_CLI_PATH}" lib install --config-file "${ARDUINO_CONFIG_PATH}" "${libraryName}"`, {
            stdio: 'inherit'
        });
        return { success: true, message: `Library ${libraryName} installed successfully!` };
    } catch (error) {
        log.error('Error installing library:', error);
        throw new Error(`Failed to install library: ${error.message}`);
    }
});

// Handle board package installation
ipcMain.handle('install-board', async (event, boardPackage) => {
    log.info('IPC Handler: install-board invoked', { boardPackage });
    try {
        checkArduinoCLI();
        if (!boardPackage) {
            throw new Error('Board package is required');
        }
        // Add --config-file argument
        execSync(`"${ARDUINO_CLI_PATH}" core install --config-file "${ARDUINO_CONFIG_PATH}" "${boardPackage}"`, {
            stdio: 'inherit'
        });
        return { success: true, message: `Board package ${boardPackage} installed successfully!` };
    } catch (error) {
        log.error('Error installing board package:', error);
        throw new Error(`Failed to install board package: ${error.message}`);
    }
});

// Setup IPC handlers
function setupIPC() {
    log.info('Setting up IPC handlers...');
    
    // Handle renderer ready message
    ipcMain.on('renderer-ready', (event) => {
        log.info('Renderer process ready');
        event.reply('main-acknowledge');
    });
    
    // Log all IPC calls
    const originalHandle = ipcMain.handle.bind(ipcMain);
    ipcMain.handle = (channel, listener) => {
        return originalHandle(channel, async (...args) => {
            log.info(`IPC handler called: ${channel}`);
            try {
                const result = await listener(...args);
                log.info(`IPC handler ${channel} completed successfully`);
                return result;
            } catch (error) {
                log.error(`IPC handler ${channel} failed:`, error);
        throw error;
    }
        });
    };
}

setupIPC(); // Call to register handlers 