# ExoiDuino

ExoiDuino is a block-based programming environment for Arduino, developed by Exoid Robotics. It provides an intuitive interface for programming Arduino boards using a visual block-based approach.

## Quick Start

### Prerequisites

Before running the setup, make sure you have:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- PowerShell (comes with Windows)

### One-Click Setup

1. Clone the repository:
   ```powershell
   git clone https://github.com/ExoidRoboticsPH/exoidduinoblocks.git
   cd exoidduinoblocks
   ```

2. Run the setup script:
   ```powershell
   .\setup.ps1
   ```

That's it! The script will:
- Check for prerequisites
- Install all dependencies
- Set up Arduino CLI
- Build the application

### Manual Setup

If you prefer to run the commands manually or if you're not using Windows, follow these steps:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup Arduino CLI:
   ```bash
   npm run setup-arduino
   ```

3. Build the application:
   ```bash
   npm run build:win  # For Windows
   # or
   npm run build     # For other platforms
   ```

## Development

To run the application in development mode:
```bash
npm start
```

## Troubleshooting

If you encounter any issues during setup:

1. **Windows Build Tools Error**:
   ```powershell
   npm config set msvs_version 2019
   npm config set python python2.7
   npm install --global windows-build-tools
   ```

2. **Serialport Build Error**:
   ```powershell
   npm install --save serialport --build-from-source
   ```

3. **Clean Installation**:
   ```powershell
   npm run clean
   ```

## Features

- Block-based programming interface
- Support for various Arduino boards (Uno, Nano, Mega)
- Built-in blocks for:
  - Digital/Analog I/O
  - Serial Communication
  - Motor Control (DC, Servo, Stepper)
  - Sensors (Ultrasonic, Light, Encoder)
  - PID Control
- Code export functionality
- Real-time code preview
- Arduino code generation
- Direct upload to Arduino boards

## License

MIT License - see LICENSE file for details.

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

