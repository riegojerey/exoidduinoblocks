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
                ['byte', 'byte'],
                ['const int', 'const int'],
                ['unsigned long', 'unsigned long'],
                ['double', 'double'],
                ['float', 'float'],
                ['string', 'string']
            ]), 'TYPE')
            .appendField(new Blockly.FieldVariable('item'), 'VAR')
            .appendField('to');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip('Sets a variable or declares a constant. Choose the appropriate type.');
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

    // Function to ensure decimal point for float/double
    function ensureDecimal(val) {
        if (/^[-+]?\d+$/.test(val)) {
            return val + '.0';
        }
        return val;
    }
    
    // Function to ensure suffix for unsigned long
    function ensureUnsignedLong(val) {
        if (/^\d+$/.test(val) && !val.toLowerCase().endsWith('ul')) {
             // Only add UL if it's a plain integer string
            return val + 'UL';
        }
        // If value is millis() or micros(), it's already unsigned long
        if (val === 'millis()' || val === 'micros()') {
            return val;
        }
        // Otherwise, cast potential other types or variables
        return `(unsigned long)(${val})`; 
    }

    // Adjust value based on type
    if (varType === 'float' || varType === 'double') {
        value = ensureDecimal(value);
    } else if (varType === 'unsigned long') {
        value = ensureUnsignedLong(value); // Ensure correct literal/casting
    }

    // Generate declaration string
    var declaration;
    switch(varType) {
        case 'float':
            declaration = `float ${varName} = ${value}f;`;
            break;
        case 'double':
            declaration = `double ${varName} = ${value};`;
            break;
        case 'string':
            if (!value.startsWith('String(') && !value.startsWith('"')) {
                value = `"${value}"`;
            }
            declaration = `String ${varName} = String(${value});`;
            break;
        case 'byte':
            declaration = `byte ${varName} = ${value};`;
            break;
        case 'const int':
            declaration = `const int ${varName} = ${value};`;
            break;
        case 'unsigned long':
            declaration = `unsigned long ${varName} = ${value};`;
            break;
        default:
            declaration = `int ${varName} = ${value};`;
    }

    // If set in setup, declare globally and only assign in loop
    if (varType === 'const int') {
        // Constants MUST be declared globally and only once.
        if (!Blockly.Arduino.definitions_['var_' + varName]) {
            Blockly.Arduino.definitions_['var_' + varName] = declaration;
        }
        // No statement code is generated for a const declaration block itself.
        return ''; 
    } else {
        // Original logic for mutable variables (int, float, etc.)
        if (isSetInSetup) {
            if (!Blockly.Arduino.definitions_['var_' + varName]) {
                Blockly.Arduino.definitions_['var_' + varName] = declaration;
            }
        if (parent && parent.type === 'arduino_loop') {
                return `${varName} = ${value};\n`; // Re-assignment in loop
            }
            return ''; // Initial declaration was global
        } else if (parent && parent.type === 'arduino_loop') {
            return `${declaration}\n`; // Local declaration in loop
        } else {
            if (!Blockly.Arduino.definitions_['var_' + varName]) {
        Blockly.Arduino.definitions_['var_' + varName] = declaration;
            }
            return ''; // Global declaration (outside setup/loop or only in setup)
        }
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
            case 'byte':
                declaration = `byte ${varName} = 0;`;
                break;
            case 'unsigned long':
                declaration = `unsigned long ${varName} = 0UL;`;
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
        case 'byte':
            return `${varName} = (${varType})(${varName} + ${argument0});\n`;
        case 'unsigned long':
            if (/^\d+$/.test(argument0) && !argument0.toLowerCase().endsWith('ul')) {
                argument0 += 'UL';
            }
            return `${varName} = ${varName} + ${argument0};\n`;
        case 'string':
            if (!argument0.startsWith('"') && !argument0.startsWith('String(')) {
                argument0 = `String(${argument0})`;
            }
            return `${varName} = ${argument0};\n`;
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
