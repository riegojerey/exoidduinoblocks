/**
 * @license
 * Arduino code generator for L298N blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

Blockly.Arduino['l298n_setup'] = function(block) {
  let ena = block.getFieldValue('ENA'); let in1 = block.getFieldValue('IN1'); let in2 = block.getFieldValue('IN2');
  let enb = block.getFieldValue('ENB'); let in3 = block.getFieldValue('IN3'); let in4 = block.getFieldValue('IN4');
  Blockly.Arduino.definitions_['motor_pins'] = `const int ENA = ${ena};\nconst int IN1 = ${in1};\nconst int IN2 = ${in2};\nconst int ENB = ${enb};\nconst int IN3 = ${in3};\nconst int IN4 = ${in4};`;
  Blockly.Arduino.setups_['setup_motors'] = `pinMode(ENA, OUTPUT);\n  pinMode(IN1, OUTPUT);\n  pinMode(IN2, OUTPUT);\n  pinMode(ENB, OUTPUT);\n  pinMode(IN3, OUTPUT);\n  pinMode(IN4, OUTPUT);\n  digitalWrite(IN1, LOW);\n  digitalWrite(IN2, LOW);\n  digitalWrite(IN3, LOW);\n  digitalWrite(IN4, LOW);\n  analogWrite(ENA, 0);\n  analogWrite(ENB, 0);`;
  return '';
};

Blockly.Arduino['l298n_motor'] = function(block) {
  let motor = block.getFieldValue('MOTOR_CHOICE'); let direction = block.getFieldValue('DIRECTION'); let speed = Blockly.Arduino.valueToCode(block, 'SPEED', Blockly.Arduino.ORDER_ATOMIC) || '0';
  let code = ''; let pin_in1 = (motor === 'A') ? 'IN1' : 'IN3'; let pin_in2 = (motor === 'A') ? 'IN2' : 'IN4'; let pin_en = (motor === 'A') ? 'ENA' : 'ENB';
  if (direction === 'FORWARD') { code = `digitalWrite(${pin_in1}, HIGH);\n  digitalWrite(${pin_in2}, LOW);\n  analogWrite(${pin_en}, ${speed});\n`; }
  else if (direction === 'BACKWARD') { code = `digitalWrite(${pin_in1}, LOW);\n  digitalWrite(${pin_in2}, HIGH);\n  analogWrite(${pin_en}, ${speed});\n`; }
  else { code = `digitalWrite(${pin_in1}, LOW);\n  digitalWrite(${pin_in2}, LOW);\n  analogWrite(${pin_en}, 0);\n`; }
  return `  // Control Motor ${motor}\n` + code;
};

Blockly.Arduino['l298n_stop_motors'] = function(block) {
   if (!Blockly.Arduino.definitions_['motor_pins']) { console.warn("L298N Stop block used without Setup block."); }
  return `  // Stop both motors\n  digitalWrite(IN1, LOW);\n  digitalWrite(IN2, LOW);\n  analogWrite(ENA, 0);\n  digitalWrite(IN3, LOW);\n  digitalWrite(IN4, LOW);\n  analogWrite(ENB, 0);\n`;
};
