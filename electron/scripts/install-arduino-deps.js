const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { createWriteStream } = require('fs');

const ARDUINO_DATA_DIR = path.join(__dirname, '../../arduino-data');
const ARDUINO_CLI_PATH = path.join(ARDUINO_DATA_DIR, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
const ARDUINO_CLI_VERSION = '0.21.1';

// Board Manager URLs
const BOARD_URLS = [
    'https://arduino.esp8266.com/stable/package_esp8266com_index.json',
    'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json'
];

// Arduino CLI download URLs
const DOWNLOAD_URLS = {
    win32: `https://downloads.arduino.cc/arduino-cli/arduino-cli_${ARDUINO_CLI_VERSION}_Windows_64bit.zip`,
    darwin: `https://downloads.arduino.cc/arduino-cli/arduino-cli_${ARDUINO_CLI_VERSION}_macOS_64bit.tar.gz`,
    linux: `https://downloads.arduino.cc/arduino-cli/arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz`
};

// List of required Arduino boards
const REQUIRED_BOARDS = [
    'arduino:avr', // For Uno, Nano, Mega
    'esp8266:esp8266', // ESP8266 support
    'esp32:esp32' // ESP32 support
];

// List of required libraries
const REQUIRED_LIBRARIES = [
    'Servo',
    'Stepper',
    'NewPing'
];

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(destPath);
        const request = https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlink(destPath, () => {
                    downloadFile(response.headers.location, destPath)
                        .then(resolve)
                        .catch(reject);
                });
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(destPath, () => {
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                });
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });

        request.on('error', (err) => {
            file.close();
            fs.unlink(destPath, () => {
                reject(err);
            });
        });
    });
}

async function extractArduinoCLI() {
    const downloadUrl = DOWNLOAD_URLS[process.platform];
    if (!downloadUrl) {
        throw new Error(`Unsupported platform: ${process.platform}`);
    }

    // Create arduino-data directory if it doesn't exist
    if (!fs.existsSync(ARDUINO_DATA_DIR)) {
        fs.mkdirSync(ARDUINO_DATA_DIR, { recursive: true });
    }

    const archivePath = path.join(ARDUINO_DATA_DIR, 'arduino-cli.zip');
    
    try {
        console.log('Downloading Arduino CLI...');
        await downloadFile(downloadUrl, archivePath);
        
        console.log('Extracting Arduino CLI...');
        // Use built-in Windows commands for extraction
        if (process.platform === 'win32') {
            // Try using tar command first (available in newer Windows versions)
            try {
                execSync(`tar -xf "${archivePath}" -C "${ARDUINO_DATA_DIR}"`);
            } catch (err) {
                // Fallback to using PowerShell
                const command = `
                    $ErrorActionPreference = 'Stop';
                    Add-Type -AssemblyName System.IO.Compression.FileSystem;
                    [System.IO.Compression.ZipFile]::ExtractToDirectory('${archivePath}', '${ARDUINO_DATA_DIR}');
                `;
                execSync(`powershell -Command "${command}"`, { stdio: 'inherit' });
            }
        } else {
            execSync(`tar -xf "${archivePath}" -C "${ARDUINO_DATA_DIR}"`);
        }
        
        // Cleanup
        fs.unlinkSync(archivePath);
        
        console.log('Arduino CLI installed successfully!');
    } catch (error) {
        console.error('Error installing Arduino CLI:', error);
        throw error;
    }
}

async function setupArduinoCLI() {
    try {
        // Check if Arduino CLI exists
        if (!fs.existsSync(ARDUINO_CLI_PATH)) {
            await extractArduinoCLI();
        }

        // Initialize Arduino CLI config with overwrite flag
        console.log('Initializing Arduino CLI...');
        execSync(`"${ARDUINO_CLI_PATH}" config init --overwrite`, { stdio: 'inherit' });
        
        // Add board manager URLs
        console.log('Adding board manager URLs...');
        for (const url of BOARD_URLS) {
            execSync(`"${ARDUINO_CLI_PATH}" config add board_manager.additional_urls ${url}`, { stdio: 'inherit' });
        }
        
        // Update indices
        execSync(`"${ARDUINO_CLI_PATH}" core update-index`, { stdio: 'inherit' });
        execSync(`"${ARDUINO_CLI_PATH}" lib update-index`, { stdio: 'inherit' });
    } catch (error) {
        console.error('Error setting up Arduino CLI:', error);
        throw error;
    }
}

async function installBoards() {
    console.log('Installing Arduino boards...');
    try {
        // Install each board package
        for (const board of REQUIRED_BOARDS) {
            console.log(`Installing board package: ${board}`);
            execSync(`"${ARDUINO_CLI_PATH}" core install ${board}`, { stdio: 'inherit' });
        }
        console.log('All board packages installed successfully!');
    } catch (error) {
        console.error('Error installing board packages:', error);
        throw error;
    }
}

async function installEncoderLibrary() {
    console.log('Installing Encoder library manually...');
    const libDir = path.join(ARDUINO_DATA_DIR, 'libraries', 'Encoder');
    
    // Create the library directory
    if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir, { recursive: true });
    }

    // Create library files
    const files = {
        'Encoder.h': `
#ifndef Encoder_h_
#define Encoder_h_
#include "Arduino.h"
class Encoder {
public:
    Encoder(uint8_t pin1, uint8_t pin2) {
        _pin1 = pin1;
        _pin2 = pin2;
        pinMode(_pin1, INPUT_PULLUP);
        pinMode(_pin2, INPUT_PULLUP);
        _position = 0;
    }
    int32_t read() { return _position; }
    void write(int32_t p) { _position = p; }
private:
    uint8_t _pin1, _pin2;
    volatile int32_t _position;
};
#endif
`,
        'Encoder.cpp': `
#include "Encoder.h"
`
    };

    // Write the files
    for (const [filename, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(libDir, filename), content.trim());
    }

    console.log('Encoder library installed manually.');
}

async function installLibraries() {
    console.log('Installing Arduino libraries...');
    try {
        // First update the library index
        execSync(`"${ARDUINO_CLI_PATH}" lib update-index`, { stdio: 'inherit' });
        
        // Install standard libraries
        for (const lib of REQUIRED_LIBRARIES) {
            console.log(`Installing library: ${lib}`);
            execSync(`"${ARDUINO_CLI_PATH}" lib install "${lib}"`, { stdio: 'inherit' });
        }

        // Install Encoder library manually
        await installEncoderLibrary();
        
        console.log('All libraries installed successfully!');
    } catch (error) {
        console.error('Error installing libraries:', error);
        throw error;
    }
}

// Run the installation
(async () => {
    try {
        await setupArduinoCLI();
        await installBoards();
        await installLibraries();
        console.log('Arduino dependencies installation completed successfully!');
    } catch (error) {
        console.error('Installation failed:', error);
        process.exit(1);
    }
})(); 