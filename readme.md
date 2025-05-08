# ExoiDuino by Exoid Robotics

ExoiDuino is a block-based programming environment designed to make learning and programming Arduino boards easier and more accessible. It utilizes the Blockly library for a visual coding experience and integrates the Arduino CLI to allow compiling and uploading code directly to connected boards (in the Desktop version).

## Versions / Deployment

There are two ways to use ExoiDuino:

### 1. Web Application (Live Demo / Code Generation)

*   **Access:** Runs directly in modern web browsers.
*   **Host:** Typically hosted via GitHub Pages (replace with your actual link if available: `https://riegojerey.github.io/exoidduinoblocks/`).
*   **Features:** Visual block programming, real-time Arduino C++ code generation, workspace saving (local storage), code export (`.ino`).
*   **Limitations:** Due to browser security restrictions, the web version **CANNOT** directly compile or upload code to an Arduino board. It can connect to a port via Web Serial (if supported by the browser) but primarily serves as a code generation tool.
*   **Workflow:** Create your program using blocks, copy the generated C++ code, and paste it into the Arduino IDE or use it with an external Arduino CLI installation to compile and upload.

### 2. Desktop Application (Offline Build & Upload)

*   **Access:** Downloadable `.exe` application for Windows (built using Electron).
*   **Features:** Includes all Web App features PLUS:
    *   **Offline Compilation & Upload:** Bundles the Arduino CLI, AVR board cores, and necessary libraries.
    *   Directly compiles and uploads code to connected Arduino Uno/Nano/Mega boards without needing an external IDE or internet connection.
    *   Port detection using system serial port access.
*   **Target User:** Ideal for users who need a self-contained, offline tool for programming Arduinos, such as in educational settings or areas with limited internet.

---

## Using the Web Application

1.  **Access:** Open the GitHub Pages link (if available) OR clone this repository (`git clone <your-repo-url>`) and open the `index.html` file directly in your browser.
2.  **Browser Requirement:** Requires a modern browser supporting the Web Serial API (e.g., Google Chrome, Microsoft Edge) for any serial port interaction features.
3.  **Generate Code:** Use the Blockly interface to create your program.
4.  **Copy Code:** Copy the generated Arduino C++ code from the code preview pane.
5.  **Compile/Upload:** Paste the code into the Arduino IDE or use an external Arduino CLI installation to compile and upload to your board.

---

## Developing and Building the Desktop Application

These instructions are for developers who want to run the Electron version locally or build the distributable `.exe`.

### Prerequisites

*   **Node.js:** Version 16.0.0 or higher (includes npm). Download from [nodejs.org](https://nodejs.org/).
*   **Git:** For cloning the repository. Download from [git-scm.com](https://git-scm.com/).
*   **PowerShell:** Included with modern Windows versions. Needed to run the setup/build script.

### Setup for Development

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd exoidduinoblocks
    ```

2.  **Run the Setup Script:**
    This script installs Node.js dependencies, rebuilds native modules, downloads the Arduino CLI, and installs the necessary board cores and libraries into the local `arduino-data` directory. This environment is used for both development and building.

    Open PowerShell **as Administrator** (recommended) and run:
    ```powershell
    # Navigate to the project directory first if you haven't already
    pwsh -ExecutionPolicy Bypass -File .\setup.ps1
    ```
    *   _Note:_ The first run might take time to download components.
    *   _Troubleshooting:_ If errors occur, ensure prerequisites are met. Adjust PowerShell execution policy if needed (Bypass is usually fine for development).

### Running Locally (Development Mode)

After the setup script completes successfully:

```bash
npm start
```

This launches the Electron application locally with developer tools enabled.

### Building the `.exe` for Distribution

To create the offline-capable `.exe` files:

1.  **Ensure Setup is Complete:** Run `pwsh ./setup.ps1` successfully at least once.
2.  **Run the Build Command:**
    ```bash
    npm run build
    ```

*   This re-runs `setup.ps1` to ensure the bundled environment is up-to-date and then uses `electron-builder` to package the application.
*   Output (`.exe` installer and portable `.exe`) will be in the `dist/` directory.

---

## Features Summary

*   Visual block-based programming (Blockly)
*   Arduino C++ code generation
*   Board/Port detection (Desktop App)
*   Offline code compilation and upload (Desktop App)
*   Bundled Arduino CLI, AVR Cores, standard libraries (Desktop App)
*   Code export to `.ino`

## License

This project is licensed under the MIT License - see the `LICENSE` file (if available) or `package.json` for details.

## Support

For support, please:
- Open an issue on the GitHub repository
- Visit [Exoid Robotics](https://www.exoidrobotics.com)
- Contact us through our social media channels

---
Made with ❤️ by Exoid Robotics

## File Structure

* `index.html`: The main HTML file for the user interface.
* `style.css`: Contains the CSS rules for styling (Pastel Orange theme).
* `app.js`: Main JavaScript file handling initialization, UI logic, base block definitions (Structure, IO, Time, Serial, Blink).
* `app_motors.js`: JavaScript file containing visual definitions for Motor blocks (L298N, Servo, Stepper).
* `app_sensor.js`: JavaScript file containing visual definitions for Sensor blocks (Light, Potentiometer, Ultrasonic, Encoder).
* `libs/generator/`: Folder containing JavaScript files for Arduino code generation logic, split by category:
    * `arduino_generator_init.js`: Core generator setup.
    * `structure.js`: Generators for `setup()` and `loop()`.
    * `logic.js`, `loops.js`, `math.js`, `text.js`, `variables.js`, `procedures.js`: Generators for standard Blockly categories.
    * `arduino_io.js`: Generators for standard Arduino Input/Output blocks.
    * `arduino_time.js`: Generators for Arduino time/delay blocks.
    * `arduino_serial.js`: Generators for Arduino serial communication blocks.
    * `sensors.js`, `ultrasonic.js`, `encoder.js`: Generators for sensor blocks.
    * `l298n.js`, `servo.js`, `stepper.js`: Generators for motor blocks.
    * `blink.js`: Generator for the custom blink block.

## How to Run

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd exoidduinoblocks
    ```
2.  **Open `index.html`:** Open the `index.html` file directly in a modern web browser that supports the Web Serial API (like Google Chrome or Microsoft Edge).

Alternatively, you can access the live version via GitHub Pages (if enabled): [https://riegojerey.github.io/exoidduinoblocks/](https://riegojerey.github.io/exoidduinoblocks/) (Replace with your actual GitHub Pages URL if different).

## Dependencies

* **Browser:** Requires a modern browser supporting Web Serial API for port connection features.
* **Arduino Libraries:** When using the generated code in the Arduino IDE or CLI, you will need to install the following libraries via the Arduino Library Manager:
    * `NewPing` (for Ultrasonic Sensor)
    * `Servo` (usually included with the IDE)
    * `Stepper` (usually included with the IDE)
    * `Encoder` (by Paul Stoffregen - commonly used for rotary encoders)

## Web Serial Limitations

The "Upload" button uses the Web Serial API to connect to the selected Arduino port. However, due to browser limitations:

* **This tool CANNOT compile the generated C++ code.**
* **This tool CANNOT directly upload (flash) the code to the Arduino board.**

**Workflow:**

1.  Use ExoiDuino to create your program with blocks.
2.  Click "Upload" to generate the code and verify the connection.
3.  Copy the generated code from the code preview area (or the browser's developer console).
4.  Paste the code into the Arduino IDE or save it as an `.ino` file for use with the Arduino CLI.
5.  Use the Arduino IDE or CLI to compile and upload the code to your connected board.

## Future Plans (Ideas)

* Improve UI/UX.
* Add more sensor and actuator blocks.
* Implement a Serial Monitor feature using Web Serial.
* Explore integration with Arduino CLI via a local agent or Electron wrapper for direct compilation and upload (more advanced).

