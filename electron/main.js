const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

const isDev = process.env.NODE_ENV === 'development';
const USER_DATA_DIR = app.getPath('userData');
const RESOURCE_PATH = isDev ? path.join(__dirname, '..') : process.resourcesPath;
const ARDUINO_DATA_DIR = isDev ? 
    path.join(__dirname, '..', 'arduino-data') : 
    path.join(USER_DATA_DIR, 'arduino-data');
const ARDUINO_CLI_PATH = path.join(ARDUINO_DATA_DIR, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
const ARDUINO_CONFIG_PATH = path.join(ARDUINO_DATA_DIR, 'arduino-cli.yaml');
const TEMP_SKETCH_DIR = path.join(os.tmpdir(), 'ExoiDuinoSketch');

// First launch setup for production
async function setupProductionEnvironment() {
    if (isDev) return; // Skip in development

    console.log('Setting up production environment...');
    
    // Create arduino-data directory if it doesn't exist
    if (!fs.existsSync(ARDUINO_DATA_DIR)) {
        fs.mkdirSync(ARDUINO_DATA_DIR, { recursive: true });
        
        // Copy Arduino CLI and data from resources
        const resourceArduinoDir = path.join(RESOURCE_PATH, 'arduino-data');
        if (fs.existsSync(resourceArduinoDir)) {
            console.log('Copying Arduino data from resources...');
            fs.cpSync(resourceArduinoDir, ARDUINO_DATA_DIR, { recursive: true });
        }
    }

    // Ensure config exists
    if (!fs.existsSync(ARDUINO_CONFIG_PATH)) {
        const configContent = {
            directories: {
                data: ARDUINO_DATA_DIR,
                downloads: path.join(ARDUINO_DATA_DIR, 'downloads'),
                user: path.join(ARDUINO_DATA_DIR, 'user')
            },
            library: {
                enable_unsafe_install: false
            },
            logging: {
                file: "",
                format: "text",
                level: "info"
            },
            board_manager: {
                additional_urls: []
            },
            daemon: {
                port: "50051"
            },
            installation: {
                built_in_libraries_dir: path.join(ARDUINO_DATA_DIR, 'libraries'),
                packages_dir: path.join(ARDUINO_DATA_DIR, 'packages')
            }
        };
        fs.writeFileSync(ARDUINO_CONFIG_PATH, JSON.stringify(configContent, null, 2));
    }
}

// Ensure Arduino CLI exists and is properly configured
function checkArduinoCLI() {
    if (!fs.existsSync(ARDUINO_CLI_PATH)) {
        throw new Error('Arduino CLI not found. Please restart the application.');
    }
    if (!fs.existsSync(ARDUINO_CONFIG_PATH)) {
        throw new Error('Arduino CLI configuration not found. Please restart the application.');
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

app.whenReady().then(async () => {
    try {
        await setupProductionEnvironment();
        createWindow();
    } catch (error) {
        console.error('Startup error:', error);
        // You might want to show an error dialog here
    }

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
            
            // Filter for likely Arduino ports with broader detection
            const arduinoPorts = ports.filter(port => {
                const { manufacturer, vendorId, productId, pnpId } = port;
                return (
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
        checkArduinoCLI();
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
        const result = execSync(`"${ARDUINO_CLI_PATH}" board list --config-file "${ARDUINO_CONFIG_PATH}" --format json`).toString();
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
            execSync(`"${ARDUINO_CLI_PATH}" compile --config-file "${ARDUINO_CONFIG_PATH}" --fqbn ${board} "${sketchPath}"`, {
                stdio: 'inherit'
            });

            // Upload the compiled code
            console.log('Uploading to board...');
            execSync(`"${ARDUINO_CLI_PATH}" upload --config-file "${ARDUINO_CONFIG_PATH}" -p ${port} --fqbn ${board} "${sketchPath}"`, {
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