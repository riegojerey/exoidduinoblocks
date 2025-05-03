const { ipcRenderer } = require('electron');

// Timeout for IPC calls (30 seconds)
const IPC_TIMEOUT = 30000;

// Check if running in Electron
const isElectron = !!window.require;

// Wrapper for IPC calls with timeout
async function invokeWithTimeout(channel, ...args) {
    if (!isElectron) {
        throw new Error('Not running in Electron environment');
    }

    return Promise.race([
        ipcRenderer.invoke(channel, ...args),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`IPC call to ${channel} timed out`)), IPC_TIMEOUT)
        )
    ]);
}

// Port listing
async function listPorts() {
    try {
        return await invokeWithTimeout('list-ports');
    } catch (error) {
        console.error('Error listing ports:', error);
        throw new Error(`Failed to list ports: ${error.message}`);
    }
}

// Board detection
async function detectBoard(portPath) {
    try {
        if (!portPath) {
            throw new Error('Port path is required');
        }
        return await invokeWithTimeout('detect-board', portPath);
    } catch (error) {
        console.error('Error detecting board:', error);
        throw new Error(`Failed to detect board: ${error.message}`);
    }
}

// Code upload
async function uploadCode(code, port, board) {
    try {
        if (!code || !port || !board) {
            throw new Error('Code, port, and board are required');
        }
        return await invokeWithTimeout('upload-code', { code, port, board });
    } catch (error) {
        console.error('Error uploading code:', error);
        throw new Error(`Failed to upload code: ${error.message}`);
    }
}

// Library installation
async function installLibrary(libraryName) {
    try {
        if (!libraryName) {
            throw new Error('Library name is required');
        }
        return await invokeWithTimeout('install-library', libraryName);
    } catch (error) {
        console.error('Error installing library:', error);
        throw new Error(`Failed to install library: ${error.message}`);
    }
}

// Board package installation
async function installBoard(boardPackage) {
    try {
        if (!boardPackage) {
            throw new Error('Board package is required');
        }
        return await invokeWithTimeout('install-board', boardPackage);
    } catch (error) {
        console.error('Error installing board package:', error);
        throw new Error(`Failed to install board package: ${error.message}`);
    }
}

module.exports = {
    listPorts,
    detectBoard,
    uploadCode,
    installLibrary,
    installBoard,
    isElectron
}; 