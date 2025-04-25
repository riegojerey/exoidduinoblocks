/**
 * @license
 * Arduino code generator for Arduino Time blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['time_delay'] = function(block) {
  var time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MILI', Blockly.Arduino.ORDER_ATOMIC) || '1000';
  return `delay(${time});\n`;
};

Blockly.Arduino['time_delaymicros'] = function(block) {
  var time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MICRO', Blockly.Arduino.ORDER_ATOMIC) || '100';
  return `delayMicroseconds(${time});\n`;
};

Blockly.Arduino['time_millis'] = function(block) {
  return ['millis()', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['time_micros'] = function(block) {
  return ['micros()', Blockly.Arduino.ORDER_ATOMIC];
};
