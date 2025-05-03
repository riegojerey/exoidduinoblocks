/**
 * @license
 * PID Control Blocks for Arduino
 */

'use strict';

Blockly.Blocks['pid_create'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Create PID Controller")
        .appendField(new Blockly.FieldVariable("pid"), "VAR");
    this.appendValueInput("KP")
        .setCheck("Number")
        .appendField("Kp");
    this.appendValueInput("KI")
        .setCheck("Number")
        .appendField("Ki");
    this.appendValueInput("KD")
        .setCheck("Number")
        .appendField("Kd");
    this.appendValueInput("SAMPLE_TIME")
        .setCheck("Number")
        .appendField("Sample Time (ms)");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Create a PID controller with specified parameters");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['pid_compute'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Compute PID")
        .appendField(new Blockly.FieldVariable("pid"), "VAR");
    this.appendValueInput("SETPOINT")
        .setCheck("Number")
        .appendField("Setpoint");
    this.appendValueInput("INPUT")
        .setCheck("Number")
        .appendField("Input");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Compute PID output based on setpoint and input");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['pid_get_output'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Get PID Output")
        .appendField(new Blockly.FieldVariable("pid"), "VAR");
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("Get the current PID output value");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['pid_set_limits'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Set PID Limits")
        .appendField(new Blockly.FieldVariable("pid"), "VAR");
    this.appendValueInput("MIN")
        .setCheck("Number")
        .appendField("Min");
    this.appendValueInput("MAX")
        .setCheck("Number")
        .appendField("Max");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("Set the minimum and maximum output limits for the PID controller");
    this.setHelpUrl("");
  }
}; 