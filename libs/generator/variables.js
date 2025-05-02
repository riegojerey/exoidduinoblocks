/**
 * @license
 * Arduino code generator for Variable blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// Override the default variables_set block
Blockly.Blocks['variables_set'] = {
    init: function() {
        this.appendValueInput('VALUE')
            .appendField('set')
            .appendField(new Blockly.FieldDropdown([
                ['int', 'INT'],
                ['double', 'DOUBLE'],
                ['string', 'STRING']
            ]), 'TYPE')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('to');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Sets a variable to a value.');
        this.setHelpUrl('');
    }
};

// Generator for variables_set block
Blockly.Arduino['variables_set'] = function(block) {
    var type = block.getFieldValue('TYPE');
    var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), 
        Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    
    // Add variable declaration to definitions section
    if (!Blockly.Arduino.definitions_['variables']) {
        Blockly.Arduino.definitions_['variables'] = '// Variable declarations';
    }

    // Handle different types and declare with initial value in global scope
    switch(type) {
        case 'INT':
            if (!Blockly.Arduino.definitions_['declare_var_' + varName]) {
                Blockly.Arduino.definitions_['variables'] += `\nint ${varName} = ${argument0};  // Integer variable`;
                return '';  // No need to generate assignment code since it's in declaration
            }
            break;
        case 'STRING':
            if (!Blockly.Arduino.definitions_['declare_var_' + varName]) {
                Blockly.Arduino.definitions_['variables'] += `\nString ${varName} = String(${argument0});  // String variable`;
                return '';  // No need to generate assignment code since it's in declaration
            }
            argument0 = 'String(' + argument0 + ')';
            break;
        case 'DOUBLE':
        default:
            if (!Blockly.Arduino.definitions_['declare_var_' + varName]) {
                Blockly.Arduino.definitions_['variables'] += `\ndouble ${varName} = ${argument0};  // Double variable`;
                return '';  // No need to generate assignment code since it's in declaration
            }
            break;
    }

    // For variables that are already declared, we need to determine if this is in setup or loop
    var parentBlock = block.getParent();
    while (parentBlock) {
        if (parentBlock.type === 'arduino_setup') {
            // If in setup, add to setups_
            Blockly.Arduino.setups_['set_var_' + varName] = `  ${varName} = ${argument0};`;
            return '';
        }
        parentBlock = parentBlock.getParent();
    }

    // If not in setup, it's a regular assignment in loop or other context
    return `${varName} = ${argument0};\n`;
};

// Original variables_get block (core Blockly block)
Blockly.Arduino['variables_get'] = function(block) {
    var code = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'),
        Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// Variables change block (core Blockly block)
Blockly.Arduino['variables_change'] = function(block) {
    var argument0 = Blockly.Arduino.valueToCode(block, 'DELTA', Blockly.Arduino.ORDER_ADDITION) || '0.0';
    var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'),
        Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    
    // Add variable declaration to definitions section if not already declared
    if (!Blockly.Arduino.definitions_['variables']) {
        Blockly.Arduino.definitions_['variables'] = '// Variable declarations';
    }
    if (!Blockly.Arduino.definitions_['declare_var_' + varName]) {
        Blockly.Arduino.definitions_['variables'] += `\ndouble ${varName} = 0.0;  // Variable declaration`;
    }
    
    // For variables that are already declared, we need to determine if this is in setup or loop
    var parentBlock = block.getParent();
    while (parentBlock) {
        if (parentBlock.type === 'arduino_setup') {
            // If in setup, add to setups_
            Blockly.Arduino.setups_['set_var_' + varName] = `  ${varName} = ${varName} + ${argument0};`;
            return '';
        }
        parentBlock = parentBlock.getParent();
    }

    // If not in setup, it's a regular assignment in loop or other context
    return `${varName} = ${varName} + ${argument0};\n`;
};

// Integer variable setter block
Blockly.Blocks['variables_set_int'] = {
    init: function() {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set int')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('to');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Sets an integer variable to a whole number value.');
        this.setHelpUrl('');
    }
};

// Double variable setter block
Blockly.Blocks['variables_set_double'] = {
    init: function() {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set double')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('to');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Sets a double variable to a decimal number value.');
        this.setHelpUrl('');
    }
};

// String variable setter block
Blockly.Blocks['variables_set_string'] = {
    init: function() {
        this.appendValueInput('VALUE')
            .setCheck('String')
            .appendField('set string')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('to');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Sets a string variable to a text value.');
        this.setHelpUrl('');
    }
};

// Generator for integer variable setter
Blockly.Arduino['variables_set_int'] = function(block) {
    var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), 
        Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    
    // Add variable declaration to definitions section
    if (!Blockly.Arduino.definitions_['variables']) {
        Blockly.Arduino.definitions_['variables'] = '// Variable declarations';
    }
    if (!Blockly.Arduino.definitions_['declare_var_' + varName]) {
        Blockly.Arduino.definitions_['variables'] += `\nint ${varName} = ${argument0};  // Integer variable`;
        return '';  // No need to generate assignment code since it's in declaration
    }

    // For variables that are already declared, we need to determine if this is in setup or loop
    var parentBlock = block.getParent();
    while (parentBlock) {
        if (parentBlock.type === 'arduino_setup') {
            // If in setup, add to setups_
            Blockly.Arduino.setups_['set_var_' + varName] = `  ${varName} = ${argument0};`;
            return '';
        }
        parentBlock = parentBlock.getParent();
    }

    // If not in setup, it's a regular assignment in loop or other context
    return `${varName} = ${argument0};\n`;
};

// Generator for double variable setter
Blockly.Arduino['variables_set_double'] = function(block) {
    var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0.0';
    var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), 
        Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    
    // Add variable declaration to definitions section
    if (!Blockly.Arduino.definitions_['variables']) {
        Blockly.Arduino.definitions_['variables'] = '// Variable declarations';
    }
    if (!Blockly.Arduino.definitions_['declare_var_' + varName]) {
        Blockly.Arduino.definitions_['variables'] += `\ndouble ${varName} = ${argument0};  // Double variable`;
        return '';  // No need to generate assignment code since it's in declaration
    }

    // For variables that are already declared, we need to determine if this is in setup or loop
    var parentBlock = block.getParent();
    while (parentBlock) {
        if (parentBlock.type === 'arduino_setup') {
            // If in setup, add to setups_
            Blockly.Arduino.setups_['set_var_' + varName] = `  ${varName} = ${argument0};`;
            return '';
        }
        parentBlock = parentBlock.getParent();
    }

    // If not in setup, it's a regular assignment in loop or other context
    return `${varName} = ${argument0};\n`;
};

// Generator for string variable setter
Blockly.Arduino['variables_set_string'] = function(block) {
    var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '""';
    var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), 
        Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
    
    // Add variable declaration to definitions section
    if (!Blockly.Arduino.definitions_['variables']) {
        Blockly.Arduino.definitions_['variables'] = '// Variable declarations';
    }
    if (!Blockly.Arduino.definitions_['declare_var_' + varName]) {
        Blockly.Arduino.definitions_['variables'] += `\nString ${varName} = String(${argument0});  // String variable`;
        return '';  // No need to generate assignment code since it's in declaration
    }

    // For variables that are already declared, we need to determine if this is in setup or loop
    var parentBlock = block.getParent();
    while (parentBlock) {
        if (parentBlock.type === 'arduino_setup') {
            // If in setup, add to setups_
            Blockly.Arduino.setups_['set_var_' + varName] = `  ${varName} = String(${argument0});`;
            return '';
        }
        parentBlock = parentBlock.getParent();
    }

    // If not in setup, it's a regular assignment in loop or other context
    return `${varName} = String(${argument0});\n`;
};
