const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');

const ARDUINO_DATA_DIR = path.join(__dirname, '../../arduino-data');
const ARDUINO_CLI_PATH = path.join(ARDUINO_DATA_DIR, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
const ARDUINO_CONFIG_PATH = path.join(ARDUINO_DATA_DIR, 'arduino-cli.yaml');

// Required board packages and libraries
const REQUIRED_BOARDS = [
    'arduino:avr',  // For Uno, Nano, Mega
    'arduino:megaavr' // For Nano Every
];

const REQUIRED_LIBRARIES = [
    'Servo',
    'Stepper',
    'Wire',
    'SPI',
    'EEPROM',
    'Firmata'
];

async function downloadFile(url, outputPath) {
    console.log(`Downloading from ${url}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
    const buffer = await response.buffer();
    fs.writeFileSync(outputPath, buffer);
    console.log(`Downloaded to ${outputPath}`);
}

async function prepareBuildFiles() {
    console.log('Preparing build files...');
    
    // Create arduino-data directory if it doesn't exist
    if (!fs.existsSync(ARDUINO_DATA_DIR)) {
        fs.mkdirSync(ARDUINO_DATA_DIR, { recursive: true });
    }

    // Download and extract Arduino CLI if needed
    if (!fs.existsSync(ARDUINO_CLI_PATH)) {
        console.log('Downloading Arduino CLI...');
        const cliUrl = 'https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip';
        const zipPath = path.join(ARDUINO_DATA_DIR, 'arduino-cli.zip');
        await downloadFile(cliUrl, zipPath);
        
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(ARDUINO_DATA_DIR, true);
        fs.unlinkSync(zipPath);
    }

    // Create custom Arduino CLI config
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

    // Initialize Arduino CLI with custom config
    console.log('Initializing Arduino CLI...');
    execSync(`"${ARDUINO_CLI_PATH}" config init --config-file "${ARDUINO_CONFIG_PATH}"`, { stdio: 'inherit' });
    execSync(`"${ARDUINO_CLI_PATH}" core update-index --config-file "${ARDUINO_CONFIG_PATH}"`, { stdio: 'inherit' });

    // Install required board packages
    console.log('Installing board packages...');
    for (const board of REQUIRED_BOARDS) {
        console.log(`Installing ${board}...`);
        execSync(`"${ARDUINO_CLI_PATH}" core install ${board} --config-file "${ARDUINO_CONFIG_PATH}"`, { stdio: 'inherit' });
    }

    // Install required libraries
    console.log('Installing libraries...');
    for (const lib of REQUIRED_LIBRARIES) {
        console.log(`Installing ${lib}...`);
        execSync(`"${ARDUINO_CLI_PATH}" lib install "${lib}" --config-file "${ARDUINO_CONFIG_PATH}"`, { stdio: 'inherit' });
    }

    // Create directories for user sketches and data
    const userDirs = [
        path.join(ARDUINO_DATA_DIR, 'user'),
        path.join(ARDUINO_DATA_DIR, 'downloads'),
        path.join(ARDUINO_DATA_DIR, 'temp')
    ];

    userDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    console.log('Build files prepared successfully!');
}

// Run the preparation
prepareBuildFiles().catch(error => {
    console.error('Error preparing build files:', error);
    process.exit(1);
}); 