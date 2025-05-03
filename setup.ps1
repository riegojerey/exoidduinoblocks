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
    "arduino-data"
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

    # Install dependencies
    npm install --save node-fetch@2.6.7 serialport@13.0.0
    npm install --save-dev electron@28.3.3 electron-builder@24.13.3 electron-rebuild@5.0.0 adm-zip@0.5.10 rimraf@5.0.10

    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to install dependencies: $_"
}

# Setup Arduino CLI and dependencies (single call)
Write-Host "🔧 Setting up Arduino environment..." -ForegroundColor Yellow
try {
    npm run setup-arduino
    Write-Host "✅ Arduino environment setup complete" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to setup Arduino environment: $_"
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

# Final success message
Write-Host "`n✨ ExoiDuino setup completed successfully! ✨" -ForegroundColor Cyan
Write-Host "You can find the built application in the 'dist' directory."
Write-Host "To start the application in development mode, run: npm start"
Write-Host "To rebuild the application, run: npm run build:win" 