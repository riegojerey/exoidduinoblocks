/**
 * @license
 * Arduino code generator for Structure blocks (setup/loop).
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['arduino_setup'] = function(block) {
  var statements_setup = Blockly.Arduino.statementToCode(block, 'SETUP');
  // Code in the setup block is added to the setups_ dictionary.
  Blockly.Arduino.setups_['user_setup'] = statements_setup;
  return ''; // This block doesn't generate code directly into the loop
};

Blockly.Arduino['arduino_loop'] = function(block) {
  var statements_loop = Blockly.Arduino.statementToCode(block, 'LOOP');
  // Code in the loop block becomes the main content returned for the loop function.
  return statements_loop;
};
