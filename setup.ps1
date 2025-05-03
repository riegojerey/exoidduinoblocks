# Setup script for ExoiDuino
# This script handles the complete installation and build process

# Get the directory where the script is located (where git was cloned)
$baseDir = $PSScriptRoot
if (-not $baseDir) {
    $baseDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
}
Set-Location $baseDir

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

# Function to check directory permissions
function Test-DirectoryAccess {
    param($Path)
    try {
        $testFile = Join-Path $Path "test.tmp"
        New-Item -ItemType File -Path $testFile -Force | Out-Null
        Remove-Item $testFile -Force
        return $true
    }
    catch {
        return $false
    }
}

# Function to backup existing files
function Backup-ExistingFiles {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = Join-Path $baseDir "backup_$timestamp"
    
    if (Test-Path (Join-Path $baseDir "arduino-data")) {
        Copy-Item -Path (Join-Path $baseDir "arduino-data") -Destination $backupDir -Recurse -Force
    }
    if (Test-Path (Join-Path $baseDir "package.json")) {
        Copy-Item -Path (Join-Path $baseDir "package.json") -Destination "$backupDir\package.json" -Force
    }
    Write-Host "✅ Created backup in $backupDir" -ForegroundColor Green
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

# Check Git
if (-not (Test-Command "git")) {
    Handle-Error "Git is not installed. Please install Git from https://git-scm.com/"
}
Write-Host "✅ Found Git" -ForegroundColor Green

# Check directory permissions
Write-Host "🔍 Checking directory permissions..." -ForegroundColor Yellow
$directories = @(
    ".",
    "electron/icons",
    "electron/scripts",
    "libs/blockly",
    "libs/fontawesome",
    "libs/prism",
    "libs/generator",
    "arduino-data",
    "arduino-data/downloads",
    "arduino-data/packages",
    "arduino-data/libraries",
    "arduino-data/user",
    "offline-resources"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $baseDir $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    }
    if (-not (Test-DirectoryAccess $fullPath)) {
        Handle-Error "Cannot write to directory: $fullPath. Please check permissions."
    }
}
Write-Host "✅ Directory permissions verified" -ForegroundColor Green

# Backup existing files
Write-Host "📦 Creating backup..." -ForegroundColor Yellow
Backup-ExistingFiles

# Clean previous installation
Write-Host "🧹 Cleaning previous installation..." -ForegroundColor Yellow
$cleanPaths = @(
    (Join-Path $baseDir "node_modules"),
    (Join-Path $baseDir "dist"),
    (Join-Path $baseDir "arduino-data/*"),
    (Join-Path $baseDir "offline-resources/*")
)

foreach ($path in $cleanPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    # Install dependencies with exact versions
    npm install --save node-fetch@2.6.7 @serialport/parser-readline@11.0.1 serialport@11.0.1
    npm install --save-dev adm-zip@0.5.10 electron@28.3.3 electron-builder@24.13.3 @electron/rebuild@3.6.0 rimraf@5.0.1

    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to install dependencies: $_"
}

# Download Arduino CLI and required packages
Write-Host "📥 Downloading Arduino CLI and packages..." -ForegroundColor Yellow
try {
    $tempArduinoDir = Join-Path $baseDir "temp-arduino"
    $arduinoDataDir = Join-Path $baseDir "arduino-data"
    $offlineResourcesDir = Join-Path $baseDir "offline-resources"

    # Create necessary directories
    New-Item -ItemType Directory -Force -Path $tempArduinoDir | Out-Null
    New-Item -ItemType Directory -Force -Path $arduinoDataDir | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $arduinoDataDir "packages") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $arduinoDataDir "libraries") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $arduinoDataDir "downloads") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $arduinoDataDir "user") | Out-Null
    New-Item -ItemType Directory -Force -Path $offlineResourcesDir | Out-Null

    # Download Arduino CLI
    $arduinoCliUrl = "https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip"
    $arduinoCliZip = Join-Path $tempArduinoDir "arduino-cli.zip"
    
    Write-Host "Downloading Arduino CLI..."
    Invoke-WebRequest -Uri $arduinoCliUrl -OutFile $arduinoCliZip
    
    # Extract Arduino CLI
    Expand-Archive -Path $arduinoCliZip -DestinationPath $tempArduinoDir -Force
    Copy-Item -Path (Join-Path $tempArduinoDir "arduino-cli.exe") -Destination $arduinoDataDir -Force

    # Create Arduino CLI config
    $configContent = @"
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
"@

    $configPath = Join-Path $arduinoDataDir "arduino-cli.yaml"
    Set-Content -Path $configPath -Value $configContent

    # Initialize Arduino CLI
    $arduinoCli = Join-Path $arduinoDataDir "arduino-cli.exe"
    Write-Host "Initializing Arduino CLI..."
    & $arduinoCli config init --overwrite --config-file $configPath
    & $arduinoCli core update-index --config-file $configPath

    # Install required board packages
    $requiredBoards = @(
        "arduino:avr",
        "arduino:megaavr"
    )

    foreach ($board in $requiredBoards) {
        Write-Host "Installing board package: $board"
        & $arduinoCli core install $board --config-file $configPath
    }

    # Install required libraries (excluding built-in ones)
    $requiredLibraries = @(
        "Servo",
        "Stepper",
        "Firmata"
    )

    foreach ($lib in $requiredLibraries) {
        Write-Host "Installing library: $lib"
        & $arduinoCli lib install $lib --config-file $configPath
    }

    # Copy Arduino CLI to offline resources
    Write-Host "Copying resources to offline directory..."
    Copy-Item -Path $arduinoCli -Destination $offlineResourcesDir -Force
    Copy-Item -Path $configPath -Destination $offlineResourcesDir -Force
    
    # Copy board packages and libraries if they exist
    $packagesDir = Join-Path $arduinoDataDir "packages"
    $librariesDir = Join-Path $arduinoDataDir "libraries"
    
    if (Test-Path $packagesDir) {
        $targetPackagesDir = Join-Path $offlineResourcesDir "packages"
        New-Item -ItemType Directory -Force -Path $targetPackagesDir | Out-Null
        Copy-Item -Path "$packagesDir\*" -Destination $targetPackagesDir -Recurse -Force
    }
    
    if (Test-Path $librariesDir) {
        $targetLibrariesDir = Join-Path $offlineResourcesDir "libraries"
        New-Item -ItemType Directory -Force -Path $targetLibrariesDir | Out-Null
        Copy-Item -Path "$librariesDir\*" -Destination $targetLibrariesDir -Recurse -Force
    }

    # Clean up temp directory
    Remove-Item -Path $tempArduinoDir -Recurse -Force

    Write-Host "✅ Arduino CLI and packages downloaded" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to download Arduino CLI and packages: $_"
}

# Build the application
Write-Host "🏗️ Building the application..." -ForegroundColor Yellow
try {
    npm run build:win
    Write-Host "✅ Application built successfully" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to build application: $_"
}

# Verify the build
if (-not (Test-Path (Join-Path $baseDir "dist/*.exe"))) {
    Handle-Error "Build verification failed: No executable found in dist directory"
}

# Create offline package
Write-Host "📦 Creating offline package..." -ForegroundColor Yellow
$offlineDir = Join-Path $baseDir "ExoiDuino-Offline"
if (Test-Path $offlineDir) {
    Remove-Item -Recurse -Force $offlineDir
}
New-Item -ItemType Directory -Path $offlineDir | Out-Null

# Copy installer and resources
Copy-Item -Path (Join-Path $baseDir "dist/*.exe") -Destination $offlineDir
Copy-Item -Path (Join-Path $baseDir "offline-resources") -Destination "$offlineDir/offline-resources" -Recurse

# Create README for offline package
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

# Final success message
Write-Host "`n✨ ExoiDuino setup completed successfully! ✨" -ForegroundColor Cyan
Write-Host "You can find:"
Write-Host "- The built application in the 'dist' directory"
Write-Host "- The complete offline package in the '$offlineDir' directory"
Write-Host "`nTo start the application in development mode, run: npm start"
Write-Host "To rebuild the application, run: npm run build:win" 