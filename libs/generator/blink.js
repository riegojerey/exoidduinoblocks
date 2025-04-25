/**
 * @license
 * Arduino code generator for Blink block.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['inout_buildin_led_blink'] = function(block) {
    var delay_time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME', Blockly.Arduino.ORDER_ATOMIC) || '1000';
    var pin = '13'; // Built-in LED is usually pin 13
    // Ensure pinMode is set in setup
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    var code = 'digitalWrite(' + pin + ', HIGH);\n' +
               'delay(' + delay_time + ');\n' +
               'digitalWrite(' + pin + ', LOW);\n' +
               'delay(' + delay_time + ');\n';
    return code;
};
