const { ipcRenderer } = require('electron');

// Port listing
async function listPorts() {
    try {
        return await ipcRenderer.invoke('list-ports');
    } catch (error) {
        console.error('Error listing ports:', error);
        throw error;
    }
}

// Board detection
async function detectBoard(portPath) {
    try {
        return await ipcRenderer.invoke('detect-board', portPath);
    } catch (error) {
        console.error('Error detecting board:', error);
        throw error;
    }
}

// Code upload
async function uploadCode(code, port, board) {
    try {
        return await ipcRenderer.invoke('upload-code', { code, port, board });
    } catch (error) {
        console.error('Error uploading code:', error);
        throw error;
    }
}

// Library installation
async function installLibrary(libraryName) {
    try {
        return await ipcRenderer.invoke('install-library', libraryName);
    } catch (error) {
        console.error('Error installing library:', error);
        throw error;
    }
}

// Board package installation
async function installBoard(boardPackage) {
    try {
        return await ipcRenderer.invoke('install-board', boardPackage);
    } catch (error) {
        console.error('Error installing board package:', error);
        throw error;
    }
}

module.exports = {
    listPorts,
    detectBoard,
    uploadCode,
    installLibrary,
    installBoard
}; 