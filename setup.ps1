# Setup script for ExoiDuino
# This script handles the complete installation and build process

# Get absolute path where the script is running
$baseDir = Get-Location
Write-Host "🚀 Starting ExoiDuino Setup in: $baseDir" -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command($CommandName) {
    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

# Function to handle errors
function Handle-Error {
    param($ErrorMessage)
    Write-Host "❌ Error: $ErrorMessage" -ForegroundColor Red
    Write-Host "Please fix the error and run the script again."
    exit 1
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js version
$requiredNodeVersion = "16.0.0"
$nodeVersion = (node -v).TrimStart('v')
if ([version]$nodeVersion -lt [version]$requiredNodeVersion) {
    Handle-Error "Node.js version $requiredNodeVersion or higher is required. Current version: $nodeVersion"
}

# Check npm
if (-not (Test-Command "npm")) {
    Handle-Error "npm is not installed. Please install Node.js which includes npm."
}

Write-Host "✅ Found Node.js $nodeVersion and npm $(npm -v)" -ForegroundColor Green

# Create all necessary directories
$directories = @(
    "arduino-data",
    "arduino-data/downloads",
    "arduino-data/packages",
    "arduino-data/libraries",
    "arduino-data/user",
    "offline-resources",
    "offline-resources/packages",
    "offline-resources/libraries",
    "libs/blockly",
    "libs/blockly/msg",
    "libs/fontawesome/css",
    "libs/fontawesome/webfonts",
    "libs/prism/themes",
    "libs/prism/components"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $baseDir $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
        Write-Host "Created directory: $dir"
    }
}

# Clean previous installation
Write-Host "🧹 Cleaning previous installation..." -ForegroundColor Yellow
Remove-Item -Path (Join-Path $baseDir "node_modules") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $baseDir "dist") -Recurse -Force -ErrorAction SilentlyContinue

# Download web dependencies
Write-Host "📥 Downloading web dependencies..." -ForegroundColor Yellow

# Blockly files
$blocklyVersion = "9.2.0"
$blocklyFiles = @(
    @{url = "blockly.min.js"; path = "libs/blockly/blockly.min.js"},
    @{url = "blocks.min.js"; path = "libs/blockly/blocks.min.js"},
    @{url = "javascript.min.js"; path = "libs/blockly/javascript.min.js"},
    @{url = "msg/en.min.js"; path = "libs/blockly/msg/en.min.js"}
)

foreach ($file in $blocklyFiles) {
    $url = "https://cdnjs.cloudflare.com/ajax/libs/blockly/$blocklyVersion/$($file.url)"
    $output = Join-Path $baseDir $file.path
    Invoke-WebRequest -Uri $url -OutFile $output
    Write-Host "Downloaded $($file.url)"
}

# Install npm dependencies
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
npm install --save node-fetch@2.6.7 @serialport/parser-readline@11.0.1 serialport@11.0.1
npm install --save-dev adm-zip@0.5.10 electron@28.3.3 electron-builder@24.13.3 @electron/rebuild@3.6.0 rimraf@5.0.1

# Download and setup Arduino CLI
Write-Host "📥 Setting up Arduino CLI..." -ForegroundColor Yellow

$arduinoDataDir = Join-Path $baseDir "arduino-data"
$arduinoCliPath = Join-Path $arduinoDataDir "arduino-cli.exe"

# Download Arduino CLI if not exists
if (-not (Test-Path $arduinoCliPath)) {
    $arduinoCliUrl = "https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip"
    $tempZip = Join-Path $arduinoDataDir "temp.zip"
    
    Invoke-WebRequest -Uri $arduinoCliUrl -OutFile $tempZip
    Expand-Archive -Path $tempZip -DestinationPath $arduinoDataDir -Force
    Remove-Item $tempZip -Force
}

# Create Arduino CLI config
$configPath = Join-Path $arduinoDataDir "arduino-cli.yaml"
@"
board_manager:
  additional_urls: []
daemon:
  port: "50051"
directories:
  data: "$($arduinoDataDir.Replace('\','/'))"
  downloads: "$((Join-Path $arduinoDataDir 'downloads').Replace('\','/'))"
  user: "$((Join-Path $arduinoDataDir 'user').Replace('\','/'))"
logging:
  file: ""
  format: "text"
  level: "info"
"@ | Set-Content $configPath

# Initialize Arduino CLI
Write-Host "Initializing Arduino CLI..."
& $arduinoCliPath config init --overwrite --config-file $configPath
& $arduinoCliPath core update-index --config-file $configPath

# Install board packages
$boards = @("arduino:avr", "arduino:megaavr")
foreach ($board in $boards) {
    Write-Host "Installing board package: $board"
    & $arduinoCliPath core install $board --config-file $configPath
}

# Install libraries
$libraries = @("Servo", "Stepper", "Firmata")
foreach ($lib in $libraries) {
    Write-Host "Installing library: $lib"
    & $arduinoCliPath lib install $lib --config-file $configPath
}

# Copy resources to offline directory
Write-Host "📦 Preparing offline resources..." -ForegroundColor Yellow
$offlineResourcesDir = Join-Path $baseDir "offline-resources"

# Copy Arduino CLI and config
Copy-Item -Path $arduinoCliPath -Destination $offlineResourcesDir -Force
Copy-Item -Path $configPath -Destination $offlineResourcesDir -Force

# Copy packages and libraries
$packagesDir = Join-Path $arduinoDataDir "packages"
$librariesDir = Join-Path $arduinoDataDir "libraries"

if (Test-Path $packagesDir) {
    Copy-Item -Path "$packagesDir\*" -Destination (Join-Path $offlineResourcesDir "packages") -Recurse -Force
}
if (Test-Path $librariesDir) {
    Copy-Item -Path "$librariesDir\*" -Destination (Join-Path $offlineResourcesDir "libraries") -Recurse -Force
}

# Build the application
Write-Host "🏗️ Building the application..." -ForegroundColor Yellow
npm run build:win

# Verify the build
$distExe = Get-ChildItem -Path (Join-Path $baseDir "dist") -Filter "*.exe" -Recurse
if (-not $distExe) {
    Handle-Error "Build verification failed: No executable found in dist directory"
}

# Create offline package
Write-Host "📦 Creating offline package..." -ForegroundColor Yellow
$offlineDir = Join-Path $baseDir "ExoiDuino-Offline"
New-Item -ItemType Directory -Force -Path $offlineDir | Out-Null

# Copy installer and resources
Copy-Item -Path $distExe.FullName -Destination $offlineDir
Copy-Item -Path $offlineResourcesDir -Destination "$offlineDir/offline-resources" -Recurse

# Create README
@"
ExoiDuino Offline Installation Package
====================================

This package contains:
1. ExoiDuino installer (ExoiDuino-Setup-*.exe)
2. Arduino CLI and required board packages
3. All necessary libraries for offline use

Installation:
1. Run the ExoiDuino installer
2. Follow the installation wizard
3. Start ExoiDuino and enjoy!

No internet connection is required for installation or usage.
"@ | Out-File -FilePath "$offlineDir/README.txt"

Write-Host "`n✨ ExoiDuino setup completed successfully! ✨" -ForegroundColor Cyan
Write-Host "You can find:"
Write-Host "- The built application in the 'dist' directory"
Write-Host "- The complete offline package in the '$offlineDir' directory" 