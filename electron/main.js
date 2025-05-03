const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const fs = require('fs');
const { execSync } = require('child_process');

const isDev = process.env.NODE_ENV === 'development';
const ARDUINO_DATA_DIR = path.join(app.getPath('userData'), 'arduino-data');
const ARDUINO_CLI_PATH = path.join(ARDUINO_DATA_DIR, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');

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

// Handle Serial Port operations
ipcMain.handle('list-ports', async () => {
    try {
        const ports = await SerialPort.list();
        return ports;
    } catch (error) {
        console.error('Error listing ports:', error);
        throw error;
    }
});

// Handle Arduino board detection
ipcMain.handle('detect-board', async (event, portPath) => {
    try {
        const result = execSync(`"${ARDUINO_CLI_PATH}" board list --format json`).toString();
        const boards = JSON.parse(result);
        const board = boards.find(b => b.port.address === portPath);
        return board || null;
    } catch (error) {
        console.error('Error detecting board:', error);
        throw error;
    }
});

// Handle code compilation and upload
ipcMain.handle('upload-code', async (event, { code, port, board }) => {
    try {
        // Create temporary sketch directory
        const sketchDir = path.join(app.getPath('temp'), 'ExoiDuinoSketch');
        if (!fs.existsSync(sketchDir)) {
            fs.mkdirSync(sketchDir, { recursive: true });
        }

        // Write the code to a .ino file
        const sketchPath = path.join(sketchDir, 'ExoiDuinoSketch.ino');
        fs.writeFileSync(sketchPath, code);

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
    } catch (error) {
        console.error('Error during upload:', error);
        throw error;
    }
});

// Handle library installation
ipcMain.handle('install-library', async (event, libraryName) => {
    try {
        execSync(`"${ARDUINO_CLI_PATH}" lib install "${libraryName}"`, {
            stdio: 'inherit'
        });
        return { success: true, message: `Library ${libraryName} installed successfully!` };
    } catch (error) {
        console.error('Error installing library:', error);
        throw error;
    }
});

// Handle board package installation
ipcMain.handle('install-board', async (event, boardPackage) => {
    try {
        execSync(`"${ARDUINO_CLI_PATH}" core install "${boardPackage}"`, {
            stdio: 'inherit'
        });
        return { success: true, message: `Board package ${boardPackage} installed successfully!` };
    } catch (error) {
        console.error('Error installing board package:', error);
        throw error;
    }
}); 