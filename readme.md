# ExoiDuino by Exoid Robotics

ExoiDuino is a block-based programming environment designed to make learning and programming Arduino boards easier and more accessible. It utilizes the Blockly library for a visual coding experience and integrates the Arduino CLI to allow compiling and uploading code directly to connected boards.

A key feature of ExoiDuino is its ability to function **offline**. The build process bundles the necessary Arduino CLI, board cores (AVR), and required libraries, allowing users without consistent internet access to develop and upload Arduino sketches.

## Features

*   Visual block-based programming using Blockly.
*   Generates Arduino C++ code.
*   Offline compilation and uploading via bundled Arduino CLI.
*   Bundles required Arduino cores (AVR for Uno/Nano/Mega) and libraries (Servo, Stepper, NewPing, PID, etc.).
*   Board and Port detection.
*   Export generated code as `.ino` files.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js:** Version 16.0.0 or higher (includes npm). Download from [nodejs.org](https://nodejs.org/).
*   **Git:** For cloning the repository. Download from [git-scm.com](https://git-scm.com/).
*   **PowerShell:** Included with modern Windows versions. Needed to run the setup/build script.

## Setup for Development

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd exoidduinoblocks
    ```

2.  **Run the Setup Script:**
    This script handles installing Node.js dependencies, rebuilding native modules, and setting up the necessary Arduino CLI environment within the `arduino-data` directory. This setup is required even for development, as the application uses the bundled CLI environment.

    Open PowerShell **as Administrator** (required for potential `electron-rebuild` steps or if execution policy is restricted) and run:
    ```powershell
    pwsh -ExecutionPolicy Bypass -File .\setup.ps1
    ```
    *   _Note:_ The first time you run this, it might take a while as it downloads the Arduino CLI and board cores/libraries.
    *   _Troubleshooting:_ If you encounter PowerShell script execution errors, you might need to adjust your system's execution policy. Running as Administrator with `-ExecutionPolicy Bypass` for this specific script is generally safe for development purposes.

## Running Locally (Development Mode)

Once the setup script has completed successfully, you can start the application in development mode:

```bash
npm start
```

This will launch the Electron application, and you should have access to developer tools.

## Building for Distribution

To create the distributable `.exe` files (installer and portable version) designed for offline use:

1.  **Ensure Setup is Complete:** Make sure you have successfully run the `pwsh ./setup.ps1` script at least once.
2.  **Run the Build Command:**
    ```bash
    npm run build
    ```

*   This command executes the `setup.ps1` script again, ensuring all components (CLI, cores, libraries) are correctly prepared in the `arduino-data` directory before packaging.
*   `electron-builder` will then package the application.
*   The output (`.exe` installer and portable `.exe`) will be located in the `dist/` directory.

## Offline Functionality

The `npm run build` process bundles:

*   The Arduino CLI executable.
*   A pre-configured `arduino-cli.yaml` using relative paths.
*   The Arduino AVR core files (for Uno, Nano, Mega compatibility).
*   Required libraries (Servo, Stepper, NewPing, PID, Firmata, Encoder) within the `arduino-data` directory structure.

This allows the final `.exe` application to detect ports, compile sketches using the bundled libraries/cores, and upload to Arduino boards without requiring an internet connection on the end-user's machine.

## License

This project is licensed under the MIT License - see the `LICENSE` file (if available) or `package.json` for details.

## Support

For support, please:
- Open an issue on GitHub
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

