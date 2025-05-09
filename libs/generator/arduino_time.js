/**
 * @license
 * Arduino code generator for Time blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Time Delay Block
Blockly.Blocks['time_delay'] = {
    init: function() {
        this.appendValueInput("DELAY_TIME_MILI")
            .setCheck("Number")
            .appendField("Delay (ms)");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("Pause the program for a specified number of milliseconds");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/time/delay/");
    }
};

// Generator for time_delay block
Blockly.Arduino['time_delay'] = function(block) {
    var time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MILI', Blockly.Arduino.ORDER_ATOMIC) || '1000';
    return `delay(${time});\n`;
};

// Time Delay Microseconds Block
Blockly.Blocks['time_delaymicros'] = {
    init: function() {
        this.appendValueInput("DELAY_TIME_MICRO")
            .setCheck("Number")
            .appendField("Delay Microseconds");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(180);
        this.setTooltip("Pause the program for a specified number of microseconds");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/time/delaymicroseconds/");
    }
};

// Generator for time_delaymicros block
Blockly.Arduino['time_delaymicros'] = function(block) {
    var time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MICRO', Blockly.Arduino.ORDER_ATOMIC) || '100';
    return `delayMicroseconds(${time});\n`;
};

// Time Millis Block
Blockly.Blocks['time_millis'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Milliseconds since start");
        this.setOutput(true, "Number");
        this.setColour(180);
        this.setTooltip("Returns the number of milliseconds since the Arduino board began running the current program");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/time/millis/");
    }
};

// Generator for time_millis block
Blockly.Arduino['time_millis'] = function(block) {
    return ['millis()', Blockly.Arduino.ORDER_ATOMIC];
};

// Time Micros Block
Blockly.Blocks['time_micros'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Microseconds since start");
        this.setOutput(true, "Number");
        this.setColour(180);
        this.setTooltip("Returns the number of microseconds since the Arduino board began running the current program");
        this.setHelpUrl("https://www.arduino.cc/reference/en/language/functions/time/micros/");
    }
};

// Generator for time_micros block
Blockly.Arduino['time_micros'] = function(block) {
    return ['micros()', Blockly.Arduino.ORDER_ATOMIC];
};
