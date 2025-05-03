const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const RESOURCE_DIR = path.join(__dirname, '../../resources');
const LIBS_DIR = path.join(__dirname, '../../libs');
const ARDUINO_DATA_DIR = path.join(__dirname, '../../arduino-data');

async function packResources() {
    console.log('Packing resources for offline use...');

    try {
        // Create resources directory if it doesn't exist
        if (!fs.existsSync(RESOURCE_DIR)) {
            fs.mkdirSync(RESOURCE_DIR, { recursive: true });
        }

        // Pack web dependencies (Blockly, etc.)
        const webDepsZip = new AdmZip();
        if (fs.existsSync(LIBS_DIR)) {
            const libFiles = getAllFiles(LIBS_DIR);
            libFiles.forEach(file => {
                const relativePath = path.relative(LIBS_DIR, file);
                webDepsZip.addLocalFile(file, relativePath);
            });
        }
        webDepsZip.writeZip(path.join(RESOURCE_DIR, 'web-deps.zip'));

        // Pack Arduino data (CLI, libraries, boards)
        const arduinoZip = new AdmZip();
        if (fs.existsSync(ARDUINO_DATA_DIR)) {
            const arduinoFiles = getAllFiles(ARDUINO_DATA_DIR);
            arduinoFiles.forEach(file => {
                const relativePath = path.relative(ARDUINO_DATA_DIR, file);
                arduinoZip.addLocalFile(file, relativePath);
            });
        }
        arduinoZip.writeZip(path.join(RESOURCE_DIR, 'arduino-data.zip'));

        console.log('Resources packed successfully!');
    } catch (error) {
        console.error('Error packing resources:', error);
        process.exit(1);
    }
}

function getAllFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    });

    return files;
}

// Run the packing
packResources(); 