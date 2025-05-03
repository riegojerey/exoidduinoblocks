const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

const ARDUINO_CLI_VERSION = '1.2.2';
const ARDUINO_DATA_DIR = path.join(__dirname, '../../arduino-data');
const ARDUINO_CLI_PATH = path.join(ARDUINO_DATA_DIR, 'arduino-cli');

async function downloadArduinoCLI() {
    console.log('Downloading Arduino CLI...');
    
    // Create arduino-data directory if it doesn't exist
    if (!fs.existsSync(ARDUINO_DATA_DIR)) {
        fs.mkdirSync(ARDUINO_DATA_DIR, { recursive: true });
    }

    const platform = process.platform === 'win32' ? 'Windows' : process.platform;
    const arch = process.arch === 'x64' ? 'x86_64' : '386';
    const extension = platform === 'Windows' ? '.zip' : '.tar.gz';
    
    const downloadUrl = `https://github.com/arduino/arduino-cli/releases/download/v${ARDUINO_CLI_VERSION}/arduino-cli_${ARDUINO_CLI_VERSION}_${platform}_${arch}${extension}`;
    
    console.log('Downloading from:', downloadUrl);
    
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
        
        const zipPath = path.join(ARDUINO_DATA_DIR, `arduino-cli${extension}`);
        const buffer = await response.buffer();
        fs.writeFileSync(zipPath, buffer);

        if (platform === 'Windows') {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(ARDUINO_DATA_DIR, true);
        } else {
            execSync(`tar -xzf "${zipPath}" -C "${ARDUINO_DATA_DIR}"`);
        }

        // Clean up the downloaded archive
        fs.unlinkSync(zipPath);
        
        console.log('Arduino CLI downloaded and extracted successfully!');
    } catch (error) {
        console.error('Error downloading Arduino CLI:', error);
        process.exit(1);
    }
}

async function initializeArduinoCLI() {
    console.log('Initializing Arduino CLI...');
    try {
        // Create config file
        const configContent = {
            board_manager: {
                additional_urls: [
                    "https://arduino.esp8266.com/stable/package_esp8266com_index.json",
                    "https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json"
                ]
            },
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
            metrics: {
                addr: ":9090",
                enabled: false
            },
            sketch: {
                always_export_binaries: false
            }
        };

        fs.writeFileSync(
            path.join(ARDUINO_DATA_DIR, 'arduino-cli.yaml'),
            JSON.stringify(configContent, null, 2)
        );

        // Initialize CLI
        execSync(`"${ARDUINO_CLI_PATH}" config init`, { stdio: 'inherit' });
        execSync(`"${ARDUINO_CLI_PATH}" core update-index`, { stdio: 'inherit' });
        
        console.log('Arduino CLI initialized successfully!');
    } catch (error) {
        console.error('Error initializing Arduino CLI:', error);
        process.exit(1);
    }
}

// Run the setup
(async () => {
    await downloadArduinoCLI();
    await initializeArduinoCLI();
})(); 