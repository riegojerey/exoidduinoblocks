# Setup script for ExoiDuino
# This script handles the build process

# Get absolute path where the script is running
$baseDir = (Get-Location).Path
Write-Host "🚀 Starting ExoiDuino Build in: $baseDir" -ForegroundColor Cyan

# Function to handle errors
function Handle-Error {
    param($ErrorMessage)
    Write-Host "❌ Error: $ErrorMessage" -ForegroundColor Red
    Write-Host "Please fix the error and run the script again."
    exit 1
}

# Function to safely create path
function Create-SafePath {
    param($Path)
    $fullPath = [System.IO.Path]::GetFullPath($Path)
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
        Write-Host "Created directory: $fullPath"
    }
    return $fullPath
}

# Function to clean up COM ports
function Clean-ComPorts {
    Write-Host "🔍 Checking for processes using COM ports..." -ForegroundColor Yellow
    
    # Kill any existing ExoiDuino processes
    $exoidProcesses = Get-Process | Where-Object { $_.ProcessName -like "*ExoiDuino*" }
    if ($exoidProcesses) {
        Write-Host "Found running ExoiDuino processes, stopping them..."
        $exoidProcesses | ForEach-Object { 
            try {
                $_ | Stop-Process -Force
                Write-Host "Stopped process: $($_.ProcessName)"
            } catch {
                Write-Host "Warning: Could not stop process $($_.ProcessName)" -ForegroundColor Yellow
            }
        }
    }
    
    # Give the system a moment to release the ports
    Start-Sleep -Seconds 2
}

# Clean up COM ports before starting
Clean-ComPorts

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js version
$requiredNodeVersion = "16.0.0"
$nodeVersion = (node -v).TrimStart('v')
if ([version]$nodeVersion -lt [version]$requiredNodeVersion) {
    Handle-Error "Node.js version $requiredNodeVersion or higher is required. Current version: $nodeVersion"
}

Write-Host "✅ Found Node.js $nodeVersion and npm $(npm -v)" -ForegroundColor Green

# Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Create necessary directories
$arduinoDataDir = Create-SafePath (Join-Path $baseDir "arduino-data")
$librariesDir = Create-SafePath (Join-Path $arduinoDataDir "libraries")

# Install npm dependencies
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
npm install --ignore-scripts --save node-fetch@2.6.7 @serialport/parser-readline@11.0.1 serialport@11.0.1
npm install --ignore-scripts --save-dev adm-zip@0.5.10 electron@28.3.3 electron-builder@24.13.3 @electron/rebuild@3.6.0 rimraf@5.0.1

# Rebuild native modules
Write-Host "🔨 Rebuilding native modules..." -ForegroundColor Yellow
npx electron-rebuild

# Download and setup Arduino CLI
Write-Host "📥 Setting up Arduino CLI..." -ForegroundColor Yellow

$arduinoCliPath = Join-Path $arduinoDataDir "arduino-cli.exe"

# Download Arduino CLI if not exists
if (-not (Test-Path $arduinoCliPath)) {
    Write-Host "Downloading Arduino CLI..."
    $arduinoCliUrl = "https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip"
    $tempZip = Join-Path $arduinoDataDir "temp.zip"
    
    try {
        Write-Host "Downloading from: $arduinoCliUrl"
        Invoke-WebRequest -Uri $arduinoCliUrl -OutFile $tempZip
        Write-Host "Download complete. Extracting..."
        Expand-Archive -Path $tempZip -DestinationPath $arduinoDataDir -Force
        Remove-Item $tempZip -Force
        
        if (-not (Test-Path $arduinoCliPath)) {
            $extractedExe = Get-ChildItem -Path $arduinoDataDir -Filter "arduino-cli*.exe" -Recurse | Select-Object -First 1
            if ($extractedExe) {
                Move-Item -Path $extractedExe.FullName -Destination $arduinoCliPath -Force
                Write-Host "Moved Arduino CLI to correct location: $arduinoCliPath"
            } else {
                throw "Arduino CLI executable not found after extraction"
            }
        }
    } catch {
        Handle-Error "Failed to download or extract Arduino CLI: $_"
    }
}

# Create Arduino CLI config
$configPath = Join-Path $arduinoDataDir "arduino-cli.yaml"

Write-Host "Creating Arduino CLI config at: $configPath with relative paths for offline use."
@"
board_manager:
  additional_urls: [] # Keep this empty for a fully offline build, or pre-fill if you have specific local package indexes
daemon:
  port: "50051"
directories:
  data: "."      # Paths are relative to this YAML file's location
  downloads: "./downloads" 
  user: "."      # Sketchbook / libraries path relative to this YAML file
logging:
  file: ""
  format: "text"
  level: "info"
"@ | Set-Content $configPath

# Initialize Arduino CLI
Write-Host "Initializing Arduino CLI (core update and AVR core install)..."
try {
    & $arduinoCliPath config init --overwrite --config-file "$configPath" # Should re-read the new relative config
    & $arduinoCliPath core update-index --config-file "$configPath"
    
    # Install core packages - Essential for offline compilation
    Write-Host "Installing arduino:avr core..."
    & $arduinoCliPath core install arduino:avr --config-file "$configPath"
    
    # Install required libraries using the CLI - will go into arduino-data/libraries/
    Write-Host "Installing required Arduino libraries..."
    $requiredLibraries = @("Servo", "Stepper", "Firmata", "NewPing", "PID")
    foreach ($lib in $requiredLibraries) {
        Write-Host "Installing library: $lib"
        & $arduinoCliPath lib install $lib --config-file "$configPath"
    }
    Write-Host "Required libraries installation step completed."
    
} catch {
    # If core or library install fails, this is critical for an offline app
    Handle-Error "Failed during Arduino CLI core or library setup: $_"
}

# Create manual Encoder library implementation
Write-Host "📝 Creating manual Encoder library..." -ForegroundColor Yellow
$encoderDir = Create-SafePath (Join-Path $librariesDir "Encoder")
$encoderHeaderPath = Join-Path $encoderDir "Encoder.h"
$encoderCppPath = Join-Path $encoderDir "Encoder.cpp"

@"
#ifndef Encoder_h
#define Encoder_h

#include "Arduino.h"

class Encoder {
public:
    Encoder(uint8_t pin1, uint8_t pin2);
    long read();
    void write(long p);
private:
    uint8_t _pin1, _pin2;
    volatile long _position;
    static void updateEncoder();
};

#endif
"@ | Set-Content $encoderHeaderPath

@"
#include "Encoder.h"

Encoder::Encoder(uint8_t pin1, uint8_t pin2) {
    _pin1 = pin1;
    _pin2 = pin2;
    _position = 0;
    
    pinMode(_pin1, INPUT_PULLUP);
    pinMode(_pin2, INPUT_PULLUP);
    
    attachInterrupt(digitalPinToInterrupt(_pin1), updateEncoder, CHANGE);
    attachInterrupt(digitalPinToInterrupt(_pin2), updateEncoder, CHANGE);
}

long Encoder::read() {
    return _position;
}

void Encoder::write(long p) {
    _position = p;
}

void Encoder::updateEncoder() {
    // Simple implementation - increment on rising edge of pin1
    if (digitalRead(_pin1) == HIGH) {
        if (digitalRead(_pin2) == LOW) {
            _position++;
        } else {
            _position--;
        }
    }
}
"@ | Set-Content $encoderCppPath

# Build the application
Write-Host "🏗️ Building the application..." -ForegroundColor Yellow

# Build resources (Removed - Handled by electron-builder files config)
# Write-Host "Building resources..."
# npm run pack-resources 

# Build both portable and installer versions
Write-Host "Building application (both portable and installer)..."
npx electron-builder --win

# Verify build outputs
$portableExe = Join-Path $baseDir "dist\ExoiDuino-1.0.0-portable.exe"
$installerExe = Join-Path $baseDir "dist\ExoiDuino Setup 1.0.0.exe"

if (-not (Test-Path $portableExe)) {
    Handle-Error "Portable EXE file was not generated at: $portableExe"
}

if (-not (Test-Path $installerExe)) {
    Handle-Error "Installer EXE was not generated at: $installerExe"
}

Write-Host "`n✨ Build process completed! ✨" -ForegroundColor Cyan
Write-Host "Generated files:"
Write-Host "📦 Portable EXE: $portableExe" -ForegroundColor Green
Write-Host "💿 Installer EXE: $installerExe" -ForegroundColor Green 