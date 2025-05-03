/**
 * @license
 * Arduino code generator for Loop blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['controls_repeat_ext'] = function(block) {
  var repeats;
  if (block.getField('TIMES')) { repeats = String(Number(block.getFieldValue('TIMES'))); }
  else { repeats = Blockly.Arduino.valueToCode(block, 'TIMES', Blockly.Arduino.ORDER_ASSIGNMENT) || '0'; }
  var branch = Blockly.Arduino.statementToCode(block, 'DO');
  branch = Blockly.Arduino.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.Arduino.nameDB_.getDistinctName('count', Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    endVar = Blockly.Arduino.nameDB_.getDistinctName('repeat_end', Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    code += 'int ' + endVar + ' = ' + repeats + ';\n';
  }
  code += 'for (int ' + loopVar + ' = 0; ' + loopVar + ' < ' + endVar + '; ' + loopVar + '++) {\n' + branch + '}\n';
  return code;
};

Blockly.Arduino['controls_whileUntil'] = function(block) {
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Arduino.valueToCode(block, 'BOOL', until ? Blockly.Arduino.ORDER_LOGICAL_NOT : Blockly.Arduino.ORDER_NONE) || 'false';
  var branch = Blockly.Arduino.statementToCode(block, 'DO');
  branch = Blockly.Arduino.addLoopTrap(branch, block.id);
  if (until) { argument0 = '!' + argument0; }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

Blockly.Arduino['controls_for'] = function(block) {
  var variable0 = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Arduino.valueToCode(block, 'FROM', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.Arduino.valueToCode(block, 'TO', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  var increment = Blockly.Arduino.valueToCode(block, 'BY', Blockly.Arduino.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.Arduino.statementToCode(block, 'DO');
  branch = Blockly.Arduino.addLoopTrap(branch, block.id);
  var code = '';
  var up = parseFloat(argument0) <= parseFloat(argument1);
  var step = Math.abs(parseFloat(increment));
  if (!Blockly.isNumber(argument0) || !Blockly.isNumber(argument1) || !Blockly.isNumber(increment)) {
      code += 'for (int ' + variable0 + ' = ' + argument0 + '; ';
      if (up) { code += variable0 + ' <= ' + argument1 + '; '; }
      else { code += variable0 + ' >= ' + argument1 + '; '; }
      code += variable0 + ' += ' + (up ? step : -step) + ') {\n' + branch + '}\n';
  } else {
      code += 'for (' + variable0 + ' = ' + argument0 + '; ' +
          variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' +
          variable0;
      if (step == 1) { code += (up ? '++' : '--'); }
      else { code += (up ? ' += ' : ' -= ') + step; }
      code += ') {\n' + branch + '}\n';
  }
  return code;
};

Blockly.Arduino['controls_flow_statements'] = function(block) {
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK': return 'break;\n';
    case 'CONTINUE': return 'continue;\n';
  } throw Error('Unknown flow statement.');
};
