const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development';
const ARDUINO_DATA_DIR = path.join(app.getPath('userData'), 'arduino-data');
const ARDUINO_CLI_PATH = path.join(ARDUINO_DATA_DIR, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
const TEMP_SKETCH_DIR = path.join(os.tmpdir(), 'ExoiDuinoSketch');

// Ensure Arduino CLI exists
function checkArduinoCLI() {
    if (!fs.existsSync(ARDUINO_CLI_PATH)) {
        throw new Error('Arduino CLI not found. Please run setup-arduino script first.');
    }
}

// Clean up temporary files
function cleanupTempFiles() {
    if (fs.existsSync(TEMP_SKETCH_DIR)) {
        fs.rmSync(TEMP_SKETCH_DIR, { recursive: true, force: true });
    }
}

// Validate board FQBN
function validateBoardFQBN(fqbn) {
    const fqbnPattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/;
    if (!fqbnPattern.test(fqbn)) {
        throw new Error('Invalid board FQBN format');
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Load the index.html file
    if (isDev) {
        mainWindow.loadFile('index.html');
    } else {
        // In production, load from the correct path
        mainWindow.loadFile(path.join(app.getAppPath(), 'index.html'));
    }

    // Enable DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Handle any navigation errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });
}

// Enable logging
app.on('ready', () => {
    console.log('App is ready');
    console.log('App path:', app.getAppPath());
    console.log('User Data path:', app.getPath('userData'));
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Enhanced port detection with retries
async function listPortsWithRetry(maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const ports = await SerialPort.list();
            console.log('Available ports:', ports);
            
            // Filter for likely Arduino ports
            const arduinoPorts = ports.filter(port => {
                const { manufacturer, vendorId, productId } = port;
                return (
                    // Common Arduino manufacturers
                    (manufacturer && /arduino|wch|ftdi/i.test(manufacturer)) ||
                    // Common Arduino vendor IDs
                    (vendorId && /2341|1a86|0403/i.test(vendorId)) ||
                    // If no manufacturer but has COM or tty in path
                    (!manufacturer && (port.path.toLowerCase().includes('com') || 
                                     port.path.toLowerCase().includes('tty')))
                );
            });

            console.log('Detected Arduino ports:', arduinoPorts);
            return arduinoPorts;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`Failed to list ports after ${maxRetries} attempts: ${lastError.message}`);
}

// Update the list-ports handler
ipcMain.handle('list-ports', async () => {
    try {
        const ports = await listPortsWithRetry();
        return ports;
    } catch (error) {
        console.error('Error listing ports:', error);
        throw new Error(`Failed to list ports: ${error.message}`);
    }
});

// Handle Arduino board detection
ipcMain.handle('detect-board', async (event, portPath) => {
    try {
        checkArduinoCLI();
        if (!portPath) {
            throw new Error('Port path is required');
        }
        const result = execSync(`"${ARDUINO_CLI_PATH}" board list --format json`).toString();
        const boards = JSON.parse(result);
        const board = boards.find(b => b.port.address === portPath);
        return board || null;
    } catch (error) {
        console.error('Error detecting board:', error);
        throw new Error(`Failed to detect board: ${error.message}`);
    }
});

// Handle code compilation and upload
ipcMain.handle('upload-code', async (event, { code, port, board }) => {
    try {
        checkArduinoCLI();
        validateBoardFQBN(board);

        // Clean up any existing temp files
        cleanupTempFiles();

        // Create temporary sketch directory
        fs.mkdirSync(TEMP_SKETCH_DIR, { recursive: true });

        // Write the code to a .ino file
        const sketchPath = path.join(TEMP_SKETCH_DIR, 'ExoiDuinoSketch.ino');
        fs.writeFileSync(sketchPath, code);

        try {
            // Compile the code
            console.log('Compiling sketch...');
            execSync(`"${ARDUINO_CLI_PATH}" compile --fqbn ${board} "${sketchPath}"`, {
                stdio: 'inherit'
            });

            // Upload the compiled code
            console.log('Uploading to board...');
            execSync(`"${ARDUINO_CLI_PATH}" upload -p ${port} --fqbn ${board} "${sketchPath}"`, {
                stdio: 'inherit'
            });

            return { success: true, message: 'Upload completed successfully!' };
        } finally {
            // Clean up temp files
            cleanupTempFiles();
        }
    } catch (error) {
        console.error('Error during upload:', error);
        cleanupTempFiles();
        throw new Error(`Failed to upload code: ${error.message}`);
    }
});

// Handle library installation
ipcMain.handle('install-library', async (event, libraryName) => {
    try {
        checkArduinoCLI();
        if (!libraryName) {
            throw new Error('Library name is required');
        }
        execSync(`"${ARDUINO_CLI_PATH}" lib install "${libraryName}"`, {
            stdio: 'inherit'
        });
        return { success: true, message: `Library ${libraryName} installed successfully!` };
    } catch (error) {
        console.error('Error installing library:', error);
        throw new Error(`Failed to install library: ${error.message}`);
    }
});

// Handle board package installation
ipcMain.handle('install-board', async (event, boardPackage) => {
    try {
        checkArduinoCLI();
        if (!boardPackage) {
            throw new Error('Board package is required');
        }
        execSync(`"${ARDUINO_CLI_PATH}" core install "${boardPackage}"`, {
            stdio: 'inherit'
        });
        return { success: true, message: `Board package ${boardPackage} installed successfully!` };
    } catch (error) {
        console.error('Error installing board package:', error);
        throw new Error(`Failed to install board package: ${error.message}`);
    }
}); 