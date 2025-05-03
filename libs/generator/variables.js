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
                ['int', 'int'],
                ['double', 'double'],
                ['float', 'float'],
                ['string', 'string']
            ]), 'TYPE')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('to');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Sets a variable to a value.');
        this.setHelpUrl('');
    },
    
    // Add onchange handler to preserve type when moving blocks
    onchange: function() {
        if (!this.workspace) return;
        
        var variable = this.getField('VAR');
        if (!variable) return;
        
        // Store the type in the variable's custom property
        var varName = variable.getText();
        var varType = this.getFieldValue('TYPE');
        var workspaceVar = Blockly.Variables.getVariable(this.workspace, varName);
        
        if (workspaceVar && !workspaceVar.type) {
            workspaceVar.type = varType;
        }
    }
};

// Generator for variables_set block
Blockly.Arduino['variables_set'] = function(block) {
    var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
    var varName = block.getField('VAR').getText();
    var varType = block.getFieldValue('TYPE');
    var parent = block.getParent();
    while (parent && parent.type !== 'arduino_setup' && parent.type !== 'arduino_loop') {
        parent = parent.getParent();
    }

    // Scan all set blocks for this variable to see if any are in setup
    var workspace = block.workspace;
    var blocks = workspace.getAllBlocks();
    var isSetInSetup = blocks.some(b =>
        b.type === 'variables_set' &&
        b.getField('VAR').getText() === varName &&
        (function checkParent(p) {
            while (p && p.type !== 'arduino_setup' && p.type !== 'arduino_loop') p = p.getParent();
            return p && p.type === 'arduino_setup';
        })(b.getParent())
    );

    // If float/double and value is a whole number, append .0
    function ensureDecimal(val) {
        // Only add .0 if val is a number or a string representing an integer
        if (/^[-+]?\d+$/.test(val)) {
            return val + '.0';
        }
        return val;
    }
    if (varType === 'float' || varType === 'double') {
        value = ensureDecimal(value);
    }

    // Generate declaration string
    var declaration;
    switch(varType) {
        case 'float':
            declaration = `float ${varName} = ${value};`;
            break;
        case 'double':
            declaration = `double ${varName} = ${value};`;
            break;
        case 'string':
            declaration = `String ${varName} = String(${value});`;
            break;
        default:
            declaration = `int ${varName} = ${value};`;
    }

    // If set in setup, declare globally and only assign in loop
    if (isSetInSetup) {
        // Only declare globally once
        if (!Blockly.Arduino.definitions_['var_' + varName]) {
            Blockly.Arduino.definitions_['var_' + varName] = declaration;
        }
        // If in loop, just assign
        if (parent && parent.type === 'arduino_loop') {
            return `${varName} = ${value};\n`;
        }
        // If in setup, do nothing (already initialized globally)
        return '';
    }
    // If not set in setup, but set in loop, declare locally in loop
    else if (parent && parent.type === 'arduino_loop') {
        return `${declaration}\n`;
    }
    // If not in setup or loop, or in setup only, declare globally
    else {
        Blockly.Arduino.definitions_['var_' + varName] = declaration;
        return '';
    }
};

// Variables get block
Blockly.Arduino['variables_get'] = function(block) {
    var varName = block.getField('VAR').getText();
    return [varName, Blockly.Arduino.ORDER_ATOMIC];
};

// Variables change block
Blockly.Arduino['variables_change'] = function(block) {
    var argument0 = Blockly.Arduino.valueToCode(block, 'DELTA', Blockly.Arduino.ORDER_ADDITION) || '0';
    var varName = block.getField('VAR').getText();
    
    // Find the variables_set block that defines this variable
    var workspace = block.workspace;
    var blocks = workspace.getAllBlocks();
    var setBlock = blocks.find(b => 
        b.type === 'variables_set' && 
        b.getField('VAR').getText() === varName
    );
    
    // Get the type from the variables_set block if found, otherwise default to int
    var varType = setBlock ? setBlock.getFieldValue('TYPE') : 'int';
    
    // If variable hasn't been declared yet, declare it
    if (!Blockly.Arduino.definitions_['var_' + varName]) {
        var declaration;
        switch(varType) {
            case 'float':
                declaration = `float ${varName} = 0.0f;`;
                break;
            case 'double':
                declaration = `double ${varName} = 0.0;`;
                break;
            case 'string':
                declaration = `String ${varName} = String("");`;
                break;
            default:
                declaration = `int ${varName} = 0;`;
        }
        Blockly.Arduino.definitions_['var_' + varName] = declaration;
    }
    
    // Generate the change code
    switch(varType) {
        case 'float':
            return `${varName} = ${varName} + ${argument0}f;\n`;
        case 'string':
            if (!argument0.startsWith('"')) {
                argument0 = `"${argument0}"`;
            }
            return `${varName} = String(${argument0});\n`;
        default:
            return `${varName} = ${varName} + ${argument0};\n`;
    }
};

// Add the visual block definition for variables_change
Blockly.Blocks['variables_change'] = {
    init: function() {
        this.appendValueInput('DELTA')
            .appendField('change')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('by');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Change a variable by a value (add the value to the variable).');
        this.setHelpUrl('');
    }
};

// Add block for setting variables to expressions
Blockly.Blocks['variables_set_expression'] = {
    init: function() {
        this.appendValueInput('EXPRESSION')
            .appendField('set')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('to expression');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Set a variable to any expression (like var = var + 1)');
        this.setHelpUrl('');
    }
};

// Generator for variables_set_expression block
Blockly.Arduino['variables_set_expression'] = function(block) {
    var expression = Blockly.Arduino.valueToCode(block, 'EXPRESSION', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
    var varName = block.getField('VAR').getText();
    
    // Find the variables_set block that defines this variable to get its type
    var workspace = block.workspace;
    var blocks = workspace.getAllBlocks();
    var setBlock = blocks.find(b => 
        b.type === 'variables_set' && 
        b.getField('VAR').getText() === varName
    );
    
    // Get the type from the variables_set block if found, otherwise default to int
    var varType = setBlock ? setBlock.getFieldValue('TYPE') : 'int';
    
    // If variable hasn't been declared yet, declare it
    if (!Blockly.Arduino.definitions_['var_' + varName]) {
        var declaration;
        switch(varType) {
            case 'float':
                declaration = `float ${varName} = 0.0f;`;
                break;
            case 'double':
                declaration = `double ${varName} = 0.0;`;
                break;
            case 'string':
                declaration = `String ${varName} = String("");`;
                break;
            default:
                declaration = `int ${varName} = 0;`;
        }
        Blockly.Arduino.definitions_['var_' + varName] = declaration;
    }
    
    // Generate the assignment code
    return `${varName} = ${expression};\n`;
};
