/**
 * Arduino CLI Setup Script
 * This script installs and configures Arduino CLI for ExoiDuino
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Define paths
const userDataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'exoiduino');
const arduinoWorkDir = path.join(userDataDir, 'arduino-work');
const cliPath = path.join(arduinoWorkDir, 'arduino-cli.exe');
const configPath = path.join(arduinoWorkDir, 'arduino-cli.yaml');
const sourceCLIPath = path.join(__dirname, 'arduino-data', 'arduino-cli.exe');

console.log('====== Arduino CLI Setup ======');
console.log('User data directory:', userDataDir);
console.log('Arduino work directory:', arduinoWorkDir);
console.log('Source CLI path:', sourceCLIPath);

// Create directories
console.log('\nCreating directories...');
const requiredDirs = [
    '',
    'data',
    'downloads',
    'user',
    'libraries',
    'packages',
    'sketches',
    'test-sketch'
];

for (const dir of requiredDirs) {
    const dirPath = path.join(arduinoWorkDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    } else {
        console.log(`Directory already exists: ${dirPath}`);
    }
}

// Copy Arduino CLI
console.log('\nCopying Arduino CLI...');
if (!fs.existsSync(sourceCLIPath)) {
    console.error('ERROR: Arduino CLI not found at:', sourceCLIPath);
    process.exit(1);
}

if (!fs.existsSync(cliPath)) {
    fs.copyFileSync(sourceCLIPath, cliPath);
    fs.chmodSync(cliPath, 0o755); // Make executable
    console.log(`Copied Arduino CLI to ${cliPath}`);
} else {
    console.log('Arduino CLI already exists, skipping copy.');
}

// Create config file
console.log('\nCreating Arduino CLI config...');
const yamlContent = 
`directories:
  data: ${arduinoWorkDir.replace(/\\/g, '/')}
  downloads: ${path.join(arduinoWorkDir, 'downloads').replace(/\\/g, '/')}
  user: ${path.join(arduinoWorkDir, 'user').replace(/\\/g, '/')}
logging:
  file: ${path.join(arduinoWorkDir, 'arduino-cli.log').replace(/\\/g, '/')}
  format: text
  level: debug
board_manager:
  additional_urls: []
daemon:
  port: 50051`;

fs.writeFileSync(configPath, yamlContent);
console.log(`Created config file at ${configPath}`);

// Create test sketch
console.log('\nCreating test sketch...');
const testSketchDir = path.join(arduinoWorkDir, 'test-sketch');

// Clean test sketch directory first
if (fs.existsSync(testSketchDir)) {
    console.log('Cleaning test sketch directory...');
    const files = fs.readdirSync(testSketchDir);
    for (const file of files) {
        fs.unlinkSync(path.join(testSketchDir, file));
        console.log(`Deleted file: ${file}`);
    }
} else {
    fs.mkdirSync(testSketchDir, { recursive: true });
    console.log('Created test sketch directory');
}

const testSketchFile = path.join(testSketchDir, 'test-sketch.ino'); // Match sketch name to directory name
fs.writeFileSync(testSketchFile, 'void setup() {}\nvoid loop() {}');
console.log(`Created test sketch at ${testSketchFile}`);

// Update index
console.log('\nUpdating Arduino CLI index...');
try {
    console.log('Running: arduino-cli core update-index');
    const updateOutput = execSync(`"${cliPath}" core update-index --config-file "${configPath}"`, {
        stdio: 'pipe'
    }).toString();
    console.log('Index update output:', updateOutput);
} catch (error) {
    console.warn('Warning: Failed to update index:', error.message);
    console.log('Continuing anyway...');
}

// Install AVR core
console.log('\nInstalling Arduino AVR core...');
try {
    console.log('Running: arduino-cli core install arduino:avr');
    const installOutput = execSync(`"${cliPath}" core install arduino:avr --config-file "${configPath}"`, {
        stdio: 'pipe'
    }).toString();
    console.log('Core installation output:', installOutput);
} catch (error) {
    console.error('ERROR: Failed to install AVR core:', error.message);
    process.exit(1);
}

// Verify installation
console.log('\nVerifying installation...');
try {
    console.log('Running: arduino-cli core list');
    const coreList = execSync(`"${cliPath}" core list --config-file "${configPath}"`, {
        stdio: 'pipe'
    }).toString();
    console.log('Installed cores:');
    console.log(coreList);
    
    if (!coreList.includes('arduino:avr')) {
        console.error('ERROR: Arduino AVR core not found in core list!');
        process.exit(1);
    }
} catch (error) {
    console.error('ERROR: Failed to list cores:', error.message);
    process.exit(1);
}

// Test compile for both bootloader variants
console.log('\nTesting compilation with different board configurations...');

// First test with Uno (simplest)
try {
    console.log('Testing Arduino Uno compilation:');
    const unoCompileOutput = execSync(`"${cliPath}" compile --config-file "${configPath}" --fqbn arduino:avr:uno "${path.join(arduinoWorkDir, 'test-sketch')}"`, {
        stdio: 'pipe'
    }).toString();
    console.log('Arduino Uno compilation successful!');
} catch (error) {
    console.error('ERROR: Arduino Uno compilation failed:', error.message);
    process.exit(1);
}

// Test with Nano standard bootloader
try {
    console.log('\nTesting Arduino Nano (standard bootloader) compilation:');
    const nanoStdCompileOutput = execSync(`"${cliPath}" compile --config-file "${configPath}" --fqbn arduino:avr:nano:cpu=atmega328p "${path.join(arduinoWorkDir, 'test-sketch')}"`, {
        stdio: 'pipe'
    }).toString();
    console.log('Arduino Nano (standard bootloader) compilation successful!');
} catch (error) {
    console.warn('WARNING: Arduino Nano standard bootloader compilation failed:', error.message);
    console.log('This may not be critical if you only use old bootloader boards.');
}

// Test with Nano old bootloader
try {
    console.log('\nTesting Arduino Nano (old bootloader) compilation:');
    const nanoOldCompileOutput = execSync(`"${cliPath}" compile --config-file "${configPath}" --fqbn arduino:avr:nano:cpu=atmega328old "${path.join(arduinoWorkDir, 'test-sketch')}"`, {
        stdio: 'pipe'
    }).toString();
    console.log('Arduino Nano (old bootloader) compilation successful!');
} catch (error) {
    console.error('ERROR: Arduino Nano old bootloader compilation failed:', error.message);
    process.exit(1);
}

console.log('\n====== Setup Complete ======');
console.log('Arduino CLI environment is ready.');
console.log(`CLI Path: ${cliPath}`);
console.log(`Config Path: ${configPath}`);
console.log(`Working Directory: ${arduinoWorkDir}`);
console.log('============================'); 