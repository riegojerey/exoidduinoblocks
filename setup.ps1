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

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (-not (Test-Command "node")) {
    Handle-Error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
}

# Check npm
if (-not (Test-Command "npm")) {
    Handle-Error "npm is not installed. Please install Node.js which includes npm."
}

# Get Node.js and npm versions
$nodeVersion = (node -v)
$npmVersion = (npm -v)
Write-Host "✅ Found Node.js $nodeVersion and npm $npmVersion" -ForegroundColor Green

# Check Git
if (-not (Test-Command "git")) {
    Handle-Error "Git is not installed. Please install Git from https://git-scm.com/"
}
Write-Host "✅ Found Git" -ForegroundColor Green

# Create directories if they don't exist
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
$directories = @(
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
        Write-Host "  Created $dir"
    }
}

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
    # Install Windows Build Tools if not already installed
    if (-not (Get-Command "windows-build-tools" -ErrorAction SilentlyContinue)) {
        Write-Host "  Installing Windows Build Tools (this may take a while)..." -ForegroundColor Yellow
        Start-Process powershell -Verb RunAs -ArgumentList "npm install --global windows-build-tools" -Wait
    }

    # Set npm configs for native module builds
    npm config set msvs_version 2019
    npm config set python python2.7

    # Install dependencies
    npm install --save node-fetch@2.6.7 serialport@13.0.0
    npm install --save-dev electron@28.3.3 electron-builder@24.13.3 adm-zip@0.5.10 rimraf@5.0.10

    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to install dependencies: $_"
}

# Setup Arduino CLI
Write-Host "🔧 Setting up Arduino CLI..." -ForegroundColor Yellow
try {
    npm run setup-arduino
    Write-Host "✅ Arduino CLI setup complete" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to setup Arduino CLI: $_"
}

# Install Arduino dependencies
Write-Host "🔧 Installing Arduino dependencies..." -ForegroundColor Yellow
try {
    npm run setup-arduino
    Write-Host "✅ Arduino dependencies installed" -ForegroundColor Green
}
catch {
    Handle-Error "Failed to install Arduino dependencies: $_"
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

# Final success message
Write-Host "`n✨ ExoiDuino setup completed successfully! ✨" -ForegroundColor Cyan
Write-Host "You can find the built application in the 'dist' directory."
Write-Host "To start the application in development mode, run: npm start"
Write-Host "To rebuild the application, run: npm run build:win" 