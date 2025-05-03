const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const ARDUINO_DATA_DIR = path.join(__dirname, '../../arduino-data');
const OFFLINE_RESOURCES_DIR = path.join(__dirname, '../../offline-resources');
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

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function prepareBuildFiles() {
    console.log('Preparing build files...');
    
    // Create arduino-data directory if it doesn't exist
    if (!fs.existsSync(ARDUINO_DATA_DIR)) {
        fs.mkdirSync(ARDUINO_DATA_DIR, { recursive: true });
    }

    // Extract Arduino CLI from offline resources if needed
    if (!fs.existsSync(ARDUINO_CLI_PATH)) {
        console.log('Extracting Arduino CLI from offline resources...');
        const offlineCliPath = path.join(OFFLINE_RESOURCES_DIR, 'arduino-cli.zip');
        
        if (!fs.existsSync(offlineCliPath)) {
            throw new Error('Arduino CLI offline package not found. Please run download_deps.ps1 first.');
        }
        
        const zip = new AdmZip(offlineCliPath);
        zip.extractAllTo(ARDUINO_DATA_DIR, true);
    }

    // Create directories
    const dirs = [
        path.join(ARDUINO_DATA_DIR, 'packages'),
        path.join(ARDUINO_DATA_DIR, 'libraries'),
        path.join(ARDUINO_DATA_DIR, 'downloads'),
        path.join(ARDUINO_DATA_DIR, 'user')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    // Create Arduino CLI config
    const configContent = `
board_manager:
  additional_urls: []
daemon:
  port: "50051"
directories:
  data: "${ARDUINO_DATA_DIR.replace(/\\/g, '/')}"
  downloads: "${path.join(ARDUINO_DATA_DIR, 'downloads').replace(/\\/g, '/')}"
  user: "${path.join(ARDUINO_DATA_DIR, 'user').replace(/\\/g, '/')}"
logging:
  file: ""
  format: "text"
  level: "info"
`;

    // Write config file
    fs.writeFileSync(ARDUINO_CONFIG_PATH, configContent);

    // Initialize Arduino CLI
    console.log('Initializing Arduino CLI...');
    execSync(`"${ARDUINO_CLI_PATH}" config init --overwrite --config-file "${ARDUINO_CONFIG_PATH}"`, { stdio: 'inherit' });

    // Copy offline board packages
    console.log('Installing board packages from offline resources...');
    const offlineBoardsDir = path.join(OFFLINE_RESOURCES_DIR, 'boards');
    if (!fs.existsSync(offlineBoardsDir)) {
        throw new Error('Offline board packages not found. Please run download_deps.ps1 first.');
    }

    copyDirectory(offlineBoardsDir, path.join(ARDUINO_DATA_DIR, 'packages'));

    // Copy offline libraries
    console.log('Installing libraries from offline resources...');
    const offlineLibsDir = path.join(OFFLINE_RESOURCES_DIR, 'libraries');
    if (!fs.existsSync(offlineLibsDir)) {
        throw new Error('Offline libraries not found. Please run download_deps.ps1 first.');
    }

    copyDirectory(offlineLibsDir, path.join(ARDUINO_DATA_DIR, 'libraries'));

    console.log('Build files prepared successfully!');
}

// Run the preparation
prepareBuildFiles().catch(error => {
    console.error('Error preparing build files:', error);
    process.exit(1);
}); 