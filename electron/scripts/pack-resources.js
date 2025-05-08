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
                webDepsZip.addLocalFile(file, path.dirname(relativePath));
            });
        }
        webDepsZip.writeZip(path.join(RESOURCE_DIR, 'web-deps.zip'));

        // Copy Arduino files directly (no zipping)
        if (fs.existsSync(ARDUINO_DATA_DIR)) {
            const targetDir = path.join(RESOURCE_DIR, 'arduino-data');
            fs.mkdirSync(targetDir, { recursive: true });
            
            // Copy Arduino CLI executable
            const cliSource = path.join(ARDUINO_DATA_DIR, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
            const cliTarget = path.join(targetDir, process.platform === 'win32' ? 'arduino-cli.exe' : 'arduino-cli');
            if (fs.existsSync(cliSource)) {
                fs.copyFileSync(cliSource, cliTarget);
                // Make executable on non-Windows platforms
                if (process.platform !== 'win32') {
                    fs.chmodSync(cliTarget, 0o755);
                }
            }

            // Copy config file
            const configSource = path.join(ARDUINO_DATA_DIR, 'arduino-cli.yaml');
            const configTarget = path.join(targetDir, 'arduino-cli.yaml');
            if (fs.existsSync(configSource)) {
                fs.copyFileSync(configSource, configTarget);
            }

            // Copy directories
            ['boards', 'libraries', 'packages'].forEach(dir => {
                const source = path.join(ARDUINO_DATA_DIR, dir);
                const target = path.join(targetDir, dir);
                if (fs.existsSync(source)) {
                    copyDirectory(source, target);
                }
            });
        }

        console.log('Resources packed successfully!');
    } catch (error) {
        console.error('Error packing resources:', error);
        process.exit(1);
    }
}

function copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const entries = fs.readdirSync(source, { withFileTypes: true });
    entries.forEach(entry => {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
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