# Create all necessary directories
New-Item -ItemType Directory -Force -Path "libs\blockly"
New-Item -ItemType Directory -Force -Path "libs\blockly\msg"
New-Item -ItemType Directory -Force -Path "libs\fontawesome\css"
New-Item -ItemType Directory -Force -Path "libs\fontawesome\webfonts"
New-Item -ItemType Directory -Force -Path "libs\prism\themes"
New-Item -ItemType Directory -Force -Path "libs\prism\components"

# Download Blockly files
$blocklyVersion = "9.2.0"
$blocklyFiles = @(
    "blockly.min.js",
    "blocks.min.js",
    "javascript.min.js"
)

foreach ($file in $blocklyFiles) {
    $url = "https://cdnjs.cloudflare.com/ajax/libs/blockly/$blocklyVersion/$file"
    $output = "libs\blockly\$file"
    Invoke-WebRequest -Uri $url -OutFile $output
    Write-Host "Downloaded $file"
}

# Download Blockly language file
$msgUrl = "https://cdnjs.cloudflare.com/ajax/libs/blockly/$blocklyVersion/msg/en.min.js"
$msgOutput = "libs\blockly\msg\en.min.js"
Invoke-WebRequest -Uri $msgUrl -OutFile $msgOutput
Write-Host "Downloaded msg/en.min.js"

# Download Font Awesome
$fontAwesomeVersion = "6.0.0"
$fontAwesomeFiles = @(
    @{
        url = "css/all.min.css"
        output = "libs\fontawesome\css\all.min.css"
    },
    @{
        url = "webfonts/fa-brands-400.woff2"
        output = "libs\fontawesome\webfonts\fa-brands-400.woff2"
    },
    @{
        url = "webfonts/fa-brands-400.ttf"
        output = "libs\fontawesome\webfonts\fa-brands-400.ttf"
    },
    @{
        url = "webfonts/fa-regular-400.woff2"
        output = "libs\fontawesome\webfonts\fa-regular-400.woff2"
    },
    @{
        url = "webfonts/fa-regular-400.ttf"
        output = "libs\fontawesome\webfonts\fa-regular-400.ttf"
    },
    @{
        url = "webfonts/fa-solid-900.woff2"
        output = "libs\fontawesome\webfonts\fa-solid-900.woff2"
    },
    @{
        url = "webfonts/fa-solid-900.ttf"
        output = "libs\fontawesome\webfonts\fa-solid-900.ttf"
    }
)

foreach ($file in $fontAwesomeFiles) {
    $url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/$fontAwesomeVersion/$($file.url)"
    New-Item -ItemType Directory -Force -Path (Split-Path $file.output -Parent)
    Invoke-WebRequest -Uri $url -OutFile $file.output
    Write-Host "Downloaded $($file.url)"
}

# Download Prism files
$prismVersion = "1.29.0"
$prismFiles = @(
    @{
        url = "themes/prism-okaidia.min.css"
        output = "libs\prism\themes\prism-okaidia.min.css"
    },
    @{
        url = "components/prism-core.min.js"
        output = "libs\prism\components\prism-core.min.js"
    },
    @{
        url = "components/prism-clike.min.js"
        output = "libs\prism\components\prism-clike.min.js"
    },
    @{
        url = "components/prism-cpp.min.js"
        output = "libs\prism\components\prism-cpp.min.js"
    }
)

foreach ($file in $prismFiles) {
    $url = "https://cdnjs.cloudflare.com/ajax/libs/prism/$prismVersion/$($file.url)"
    New-Item -ItemType Directory -Force -Path (Split-Path $file.output -Parent)
    Invoke-WebRequest -Uri $url -OutFile $file.output
    Write-Host "Downloaded $($file.url)"
}

# Download Arduino CLI and required packages for offline use
$ErrorActionPreference = "Stop"

$offlineResourcesDir = Join-Path $PSScriptRoot "offline-resources"
$arduinoCliUrl = "https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip"
$arduinoCliPath = Join-Path $offlineResourcesDir "arduino-cli.zip"
$tempArduinoDir = Join-Path $PSScriptRoot "temp-arduino"
$tempConfigPath = Join-Path $tempArduinoDir "arduino-cli.yaml"

# Create directories
New-Item -ItemType Directory -Force -Path $offlineResourcesDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempArduinoDir | Out-Null

# Download Arduino CLI
Write-Host "Downloading Arduino CLI..."
Invoke-WebRequest -Uri $arduinoCliUrl -OutFile $arduinoCliPath

# Extract Arduino CLI to temp directory
Expand-Archive -Path $arduinoCliPath -DestinationPath $tempArduinoDir -Force

# Create temporary config
$configContent = @"
board_manager:
  additional_urls: []
daemon:
  port: "50051"
directories:
  data: "$($tempArduinoDir.Replace('\','/'))"
  downloads: "$((Join-Path $tempArduinoDir 'downloads').Replace('\','/'))"
  user: "$((Join-Path $tempArduinoDir 'user').Replace('\','/'))"
logging:
  file: ""
  format: "text"
  level: "info"
"@

Set-Content -Path $tempConfigPath -Value $configContent

# Initialize Arduino CLI
$arduinoCli = Join-Path $tempArduinoDir "arduino-cli.exe"
Write-Host "Initializing Arduino CLI..."
& $arduinoCli config init --overwrite --config-file $tempConfigPath
& $arduinoCli core update-index --config-file $tempConfigPath

# Install required board packages
$requiredBoards = @(
    "arduino:avr",
    "arduino:megaavr"
)

foreach ($board in $requiredBoards) {
    Write-Host "Installing board package: $board"
    & $arduinoCli core install $board --config-file $tempConfigPath
}

# Install required libraries
$requiredLibraries = @(
    "Servo",
    "Stepper",
    "Wire",
    "SPI",
    "EEPROM",
    "Firmata"
)

foreach ($lib in $requiredLibraries) {
    Write-Host "Installing library: $lib"
    & $arduinoCli lib install $lib --config-file $tempConfigPath
}

# Copy installed packages and libraries to offline-resources
$offlineBoardsDir = Join-Path $offlineResourcesDir "boards"
$offlineLibsDir = Join-Path $offlineResourcesDir "libraries"

Write-Host "Copying installed resources to offline directory..."
Copy-Item -Path (Join-Path $tempArduinoDir "packages") -Destination $offlineBoardsDir -Recurse -Force
Copy-Item -Path (Join-Path $tempArduinoDir "libraries") -Destination $offlineLibsDir -Recurse -Force

# Clean up temp directory
Remove-Item -Path $tempArduinoDir -Recurse -Force

Write-Host "Dependencies downloaded successfully!" 