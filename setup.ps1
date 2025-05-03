# Setup script for ExoiDuino
# This script handles the complete installation and build process

Write-Host "🚀 Starting ExoiDuino Setup..." -ForegroundColor Cyan

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
    $backupDir = "backup_$timestamp"
    
    if (Test-Path "arduino-data") {
        Copy-Item -Path "arduino-data" -Destination $backupDir -Recurse -Force
    }
    if (Test-Path "package.json") {
        Copy-Item -Path "package.json" -Destination "$backupDir\package.json" -Force
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
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    if (-not (Test-DirectoryAccess $dir)) {
        Handle-Error "Cannot write to directory: $dir. Please check permissions."
    }
}
Write-Host "✅ Directory permissions verified" -ForegroundColor Green

# Backup existing files
Write-Host "📦 Creating backup..." -ForegroundColor Yellow
Backup-ExistingFiles

# Clean previous installation
Write-Host "🧹 Cleaning previous installation..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path "arduino-data/*") {
    Remove-Item -Recurse -Force "arduino-data/*" -ErrorAction SilentlyContinue
}
if (Test-Path "offline-resources/*") {
    Remove-Item -Recurse -Force "offline-resources/*" -ErrorAction SilentlyContinue
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    # Check for Windows Build Tools
    $buildToolsVersion = npm list -g --depth=0 windows-build-tools 2>$null
    if (-not $buildToolsVersion) {
        Write-Host "  Installing Windows Build Tools (this may take a while)..." -ForegroundColor Yellow
        Start-Process powershell -Verb RunAs -ArgumentList "npm install --global windows-build-tools" -Wait
    }

    # Set npm configs for native module builds
    npm config set msvs_version 2019
    npm config set python python2.7

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
    # Run download_deps script to get Arduino CLI and packages
    npm run download-deps
    Write-Host "✅ Arduino CLI and packages downloaded" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to download Arduino CLI and packages: $_"
}

# Prepare build environment
Write-Host "🔧 Preparing build environment..." -ForegroundColor Yellow
try {
    # Run prepare-build script
    npm run prepare-build
    Write-Host "✅ Build environment prepared" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to prepare build environment: $_"
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
if (-not (Test-Path "dist/*.exe")) {
    Handle-Error "Build verification failed: No executable found in dist directory"
}

# Create offline package
Write-Host "📦 Creating offline package..." -ForegroundColor Yellow
$offlineDir = "ExoiDuino-Offline"
if (Test-Path $offlineDir) {
    Remove-Item -Recurse -Force $offlineDir
}
New-Item -ItemType Directory -Path $offlineDir | Out-Null

# Copy installer and resources
Copy-Item -Path "dist/*.exe" -Destination $offlineDir
Copy-Item -Path "offline-resources" -Destination "$offlineDir/offline-resources" -Recurse

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