/**
 * @license
 * Initializes the custom Arduino generator for Blockly. (Simplified & Fixed)
 * Organizes output code with includes first, then definitions.
 * Removed automatic variable declaration from init.
 */
'use strict';

// Define the main initialization function first
function initializeArduinoGenerator() {
    // Ensure Blockly and Generator exist before proceeding.
    if (typeof Blockly === 'undefined') {
        throw new Error('Blockly core not loaded before arduino_generator_init.js!');
    }
    if (typeof Blockly.Generator === 'undefined') {
        throw new Error('Blockly.Generator not loaded! Make sure blockly_compressed.js is loaded first.');
    }

    // Create Arduino generator as a proper Generator instance
    Blockly.Arduino = new Blockly.Generator('Arduino');

    // Add reserved words for Arduino
    Blockly.Arduino.addReservedWords(
        'setup,loop,if,else,for,while,do,break,continue,return,goto,define,include,' +
        'HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,integer,constants,floating,point,' +
        'void,boolean,char,unsigned,byte,int,word,long,float,double,string,String,array,' +
        'static,volatile,const,sizeof,pinMode,digitalWrite,digitalRead,analogReference,' +
        'analogRead,analogWrite,tone,noTone,shiftOut,shiftIn,pulseIn,millis,micros,' +
        'delay,delayMicroseconds,min,max,abs,constrain,map,pow,sqrt,sin,cos,tan'
    );

    // Define operator precedence
    Blockly.Arduino.ORDER_ATOMIC = 0;
    Blockly.Arduino.ORDER_UNARY_POSTFIX = 1;
    Blockly.Arduino.ORDER_UNARY_PREFIX = 2;
    Blockly.Arduino.ORDER_MULTIPLICATIVE = 3;
    Blockly.Arduino.ORDER_ADDITIVE = 4;
    Blockly.Arduino.ORDER_SHIFT = 5;
    Blockly.Arduino.ORDER_RELATIONAL = 6;
    Blockly.Arduino.ORDER_EQUALITY = 7;
    Blockly.Arduino.ORDER_BITWISE_AND = 8;
    Blockly.Arduino.ORDER_BITWISE_XOR = 9;
    Blockly.Arduino.ORDER_BITWISE_OR = 10;
    Blockly.Arduino.ORDER_LOGICAL_AND = 11;
    Blockly.Arduino.ORDER_LOGICAL_OR = 12;
    Blockly.Arduino.ORDER_CONDITIONAL = 13;
    Blockly.Arduino.ORDER_ASSIGNMENT = 14;
    Blockly.Arduino.ORDER_NONE = 99;

    /**
     * Initialize the database of variable names.
     */
    Blockly.Arduino.init = function(workspace) {
        try {
            // Initialize all the generator collections
            Blockly.Arduino.definitions_ = Object.create(null);
            Blockly.Arduino.includes_ = Object.create(null);
            Blockly.Arduino.setups_ = Object.create(null);
            Blockly.Arduino.functionNames_ = Object.create(null);

            // Use nameDB_ for variable names
            const nameDbType = Blockly.Names.DEVELOPER_VARIABLE_TYPE || Blockly.Variables.NAME_TYPE;
            const variableCategory = Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE;

            // Initialize nameDB_ using reserved words
            if (!Blockly.Arduino.nameDB_) {
                Blockly.Arduino.nameDB_ = new Blockly.Names(Blockly.Arduino.RESERVED_WORDS_);
            } else {
                Blockly.Arduino.nameDB_.reset(); // Reset if it already exists
            }

            Blockly.Arduino.nameDB_.setVariableMap(workspace.getVariableMap());

            // Process developer variables (if any) - just to ensure they are tracked
            var devVarList = Blockly.Variables.allDeveloperVariables(workspace);
            for (var i = 0; i < devVarList.length; i++) {
                Blockly.Arduino.nameDB_.getName(devVarList[i], nameDbType);
            }
        } catch (error) {
            console.error("Error initializing Arduino generator:", error);
            throw new Error("Failed to initialize Arduino generator: " + error.message);
        }
    };

    // Helper function for error handling
    Blockly.Arduino.handleGeneratorError = function(block, error) {
        console.error(`Error in ${block.type}:`, error);
        return `// ERROR in ${block.type}: ${error.message}\n`;
    };

    // Helper function for input validation
    Blockly.Arduino.validateInput = function(value, min, max, defaultValue) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            console.warn(`Invalid numeric input: ${value}`);
            return defaultValue;
        }
        if (num < min || num > max) {
            console.warn(`Input ${num} out of range [${min}, ${max}]`);
            return Math.max(min, Math.min(max, num));
        }
        return num;
    };

    // Helper function for pin validation
    Blockly.Arduino.validatePin = function(pin, board) {
        const validPins = {
            'uno': {
                digital: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
                analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
                pwm: ['3', '5', '6', '9', '10', '11']
            },
            'nano': {
                digital: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
                analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
                pwm: ['3', '5', '6', '9', '10', '11']
            }
        };

        if (!validPins[board]) {
            console.warn(`Unknown board type: ${board}`);
            return false;
        }

        return validPins[board].digital.includes(pin) || 
               validPins[board].analog.includes(pin) || 
               validPins[board].pwm.includes(pin);
    };

    /**
     * Finalize the code. Organizes includes, definitions, setup, and loop.
     */
    Blockly.Arduino.finish = function(code) {
        var includes = [];
        var definitions = [];
        var variables = []; // Separate array for variable definitions
        var functions = [];

        // Process includes first
        for (var name in Blockly.Arduino.includes_) {
            includes.push(Blockly.Arduino.includes_[name]);
        }

        // Separate variables, definitions, and functions
        for (var name in Blockly.Arduino.definitions_) {
            var def = Blockly.Arduino.definitions_[name];
            if (name.startsWith('var_')) { // Variable definitions
                variables.push(def);
            } else if (Blockly.Arduino.functionNames_[name]) { // Functions
                functions.push(def);
            } else { // Other definitions
                definitions.push(def);
            }
        }

        var setups = [];
        for (var name in Blockly.Arduino.setups_) {
            setups.push(Blockly.Arduino.setups_[name]);
        }

        // Clean up temporary data
        var tempIncludes = Blockly.Arduino.includes_;
        var tempDefinitions = Blockly.Arduino.definitions_;
        var tempSetups = Blockly.Arduino.setups_;
        var tempFunctionNames = Blockly.Arduino.functionNames_;
        
        Blockly.Arduino.includes_ = Object.create(null);
        Blockly.Arduino.definitions_ = Object.create(null);
        Blockly.Arduino.setups_ = Object.create(null);
        Blockly.Arduino.functionNames_ = Object.create(null);
        
        if (Blockly.Arduino.nameDB_) {
            Blockly.Arduino.nameDB_.reset();
        }

        // Build the final code
        var includesCode = includes.join('\n');
        var variablesCode = variables.join('\n'); // Join variables with newlines
        var definitionsCode = definitions.join('\n\n');
        var functionsCode = functions.join('\n\n');
        var setupCode = setups.map(s => '  ' + s.trim()).join('\n');
        var loopCode = code ? code.split('\n').map(line => '  ' + line.trim()).filter(line => line.trim() !== '').join('\n') : '';

        // Ensure Arduino.h is included
        if (!includesCode.includes('#include <Arduino.h>')) {
            includesCode = '#include <Arduino.h>\n' + includesCode;
        }

        var finalCode = '';
        if (includesCode) finalCode += includesCode + '\n\n';
        if (variablesCode) finalCode += variablesCode + '\n\n'; // Add variables first
        if (definitionsCode) finalCode += definitionsCode + '\n\n';
        if (functionsCode) finalCode += functionsCode + '\n\n';
        finalCode += 'void setup() {\n' + setupCode + '\n}\n\n';
        finalCode += 'void loop() {\n' + loopCode + '\n}';

        // Restore the collections
        Blockly.Arduino.includes_ = tempIncludes;
        Blockly.Arduino.definitions_ = tempDefinitions;
        Blockly.Arduino.setups_ = tempSetups;
        Blockly.Arduino.functionNames_ = tempFunctionNames;

        return finalCode;
    };


    /**
     * Naked values require a trailing semicolon.
     */
    Blockly.Arduino.scrubNakedValue = function(line) { return line + ';\n'; };

    /**
     * Encode Arduino strings.
     */
    Blockly.Arduino.quote_ = function(string) { string = string.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/'/g, "\\'").replace(/"/g, '\\"'); return '"' + string + '"'; };

    /**
     * Common tasks for generating code from blocks.
     */
    Blockly.Arduino.scrub_ = function(block, code, thisOnly) {
        if (code === null) { return ''; }
        var commentCode = '';
        if (!block.outputConnection || !block.outputConnection.targetConnection) {
            var comment = block.getCommentText();
            if (comment) { comment = Blockly.utils.string.wrap(comment, this.COMMENT_WRAP || 80); commentCode += this.prefixLines(comment, '// ') + '\n'; }
            for (var i = 0; i < block.inputList.length; i++) {
                if (block.inputList[i].type == Blockly.INPUT_VALUE) {
                    var childBlock = block.inputList[i].connection.targetBlock();
                    if (childBlock) { var childComment = this.allNestedComments(childBlock); if (childComment) { commentCode += this.prefixLines(childComment, '// '); } }
                }
            }
        }
        var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
        var nextCode = thisOnly ? '' : this.blockToCode(nextBlock);
        return commentCode + code + nextCode;
    };

     // Define getProcedureDef here as it's used by procedure blocks
     Blockly.Arduino.getProcedureDef = function(block) {
        var funcName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
        var xfix1 = '';
        if (Blockly.Arduino.STATEMENT_PREFIX) { xfix1 += Blockly.Arduino.STATEMENT_PREFIX.replace(/%1/g, '\'' + block.id + '\''); }
        if (Blockly.Arduino.INFINITE_LOOP_TRAP) { xfix1 += Blockly.Arduino.INFINITE_LOOP_TRAP.replace(/%1/g, '\'' + block.id + '\''); }
        var branch = Blockly.Arduino.statementToCode(block, 'STACK');
        var returnValue = Blockly.Arduino.valueToCode(block, 'RETURN', Blockly.Arduino.ORDER_NONE) || '';
        var xfix2 = '';
        if (branch && returnValue) { xfix2 = xfix1; }
        if (returnValue) { returnValue = '  return ' + returnValue + ';\n'; }
        var args = [];
        var variables = block.getVars();
        for (var i = 0; i < variables.length; i++) {
            args[i] = 'double ' + Blockly.Arduino.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
        }
        var returnType = returnValue ? 'double' : 'void';
        var code = returnType + ' ' + funcName + '(' + args.join(', ') + ') {\n' + xfix1 + branch + xfix2 + returnValue + '}';
        code = Blockly.Arduino.scrub_(block, code);
        // Store function definition using function name map
        Blockly.Arduino.functionNames_[funcName] = funcName; // Map name to itself
        Blockly.Arduino.definitions_[funcName] = code; // Add function definition code
        return null;
    };

    /**
     * Generate Arduino code from the workspace.
     * @param {Blockly.Workspace} workspace The workspace to generate code from.
     * @return {string} Generated Arduino code.
     */
    Blockly.Arduino.workspaceToCode = function(workspace) {
        try {
            // Initialize the generator (clears definitions_, setups_, etc.)
            Blockly.Arduino.init(workspace);

            var code = []; // Array to hold code from top-level blocks

            const blocks = workspace.getTopBlocks(true);
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                var line = Blockly.Arduino.blockToCode(block);
                if (Array.isArray(line)) {
                    // Value blocks return tuples of code and operator order.
                    // Top-level blocks don't care about operator order.
                    line = line[0];
                }
                if (line) {
                    // For Arduino, naked values (expressions not ending in ';') are not typical at top level.
                    // But if scrubNakedValue is defined, use it.
                    if (block.outputConnection && Blockly.Arduino.scrubNakedValue) {
                        line = Blockly.Arduino.scrubNakedValue(line);
                    }
                    code.push(line);
                }
            }
            var mainBlockCode = code.join('\n');
            
            // The Blockly.Arduino.finish function will correctly use 
            // Blockly.Arduino.definitions_, Blockly.Arduino.setups_ (populated by block generators)
            // and the mainBlockCode (which should primarily be from arduino_loop).
            return Blockly.Arduino.finish(mainBlockCode);

        } catch (e) {
            console.error("Error in Arduino workspaceToCode:", e);
            return `// FATAL ERROR in workspaceToCode: ${e.message}\nvoid setup() {}\nvoid loop() {}`;
        }
    };

    // /**
    //  * Generate code for a specific block.
    //  * @param {Blockly.Block} block The block to generate code for.
    //  * @return {string|[string, number]} Generated code and order of operations.
    //  */
    // Blockly.Arduino.blockToCode = function(block) { // COMMENTED OUT - Use prototype method
    //     if (!block) {
    //         return '';
    //     }
    // 
    //     try {
    //         // Handle value blocks
    //         if (block.outputConnection) {
    //             const func = Blockly.Arduino[block.type];
    //             if (func) {
    //                 const code = func.call(block, block);
    //                 if (Array.isArray(code)) {
    //                     return code[0]; // PROBLEM: Discards order, should return [code, order]
    //                 }
    //                 return code;
    //             }
    //             console.warn(`No generator found for value block type: ${block.type}`);
    //             return '';
    //         }
    // 
    //         // Handle statement blocks
    //         const generator = Blockly.Arduino[block.type];
    //         if (generator) {
    //             return generator.call(block, block);
    //         }
    //         console.warn(`No generator found for block type: ${block.type}`);
    //         return `// WARNING: No generator for block type: ${block.type}\n`;
    //     } catch (error) {
    //         console.error(`Error generating code for block ${block.type}:`, error);
    //         return `// ERROR in ${block.type}: ${error.message}\n`;
    //     }
    // };

    // /**
    //  * Convert a statement input to code.
    //  * @param {Blockly.Block} block The block containing the input.
    //  * @param {string} name The name of the input.
    //  * @return {string} Generated code for the input.
    //  */
    // Blockly.Arduino.statementToCode = function(block, name) { // COMMENTED OUT - Use prototype method
    //     const targetBlock = block.getInputTargetBlock(name);
    //     if (!targetBlock) {
    //         return '';
    //     }
    // 
    //     let code = '';
    //     let currentBlock = targetBlock;
    // 
    //     while (currentBlock) {
    //         try {
    //             const blockCode = this.blockToCode(currentBlock); // Uses custom blockToCode
    //             if (blockCode) {
    //                 code += blockCode;
    //             }
    //         } catch (e) {
    //             console.error('Error in statement generation:', e);
    //             code += `// Error: ${e.message}\n`;
    //         }
    //         currentBlock = currentBlock.getNextBlock();
    //     }
    // 
    //     return code;
    // };

    // /**
    //  * Convert a value input to code.
    //  * @param {Blockly.Block} block The block containing the input.
    //  * @param {string} name The name of the input.
    //  * @param {number} order The order of operations.
    //  * @return {string} Generated code for the input.
    //  */
    // Blockly.Arduino.valueToCode = function(block, name, order) { // COMMENTED OUT - Use prototype method
    //     const targetBlock = block.getInputTargetBlock(name);
    //     if (!targetBlock) {
    //         return '0'; // Default value if no block connected
    //     }
    //     let code = this.blockToCode(targetBlock); // Uses custom blockToCode
    //     // PROBLEM: This custom blockToCode returns a string, not [code, order] for value blocks.
    //     // Standard valueToCode expects [code, order] to handle precedence.
    //     if (Array.isArray(code)) { // This check might not behave as expected if blockToCode is modified
    //         return code[0]; 
    //     }
    //     return code || '0'; // Default value if code is empty
    // };

    // Add basic math block generators
    Blockly.Arduino['math_number'] = function(block) {
        const code = String(Number(block.getFieldValue('NUM')));
        return [code, Blockly.Arduino.ORDER_ATOMIC];
    };

    // Add time block generators
    Blockly.Arduino['time_delay'] = function(block) {
        const delay = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MILI', Blockly.Arduino.ORDER_ATOMIC);
        return `delay(${delay});\n`;
    };

    Blockly.Arduino['time_delaymicros'] = function(block) {
        const delay = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MICRO', Blockly.Arduino.ORDER_ATOMIC);
        return `delayMicroseconds(${delay});\n`;
    };

    Blockly.Arduino['time_millis'] = function(block) {
        return ['millis()', Blockly.Arduino.ORDER_ATOMIC];
    };

    Blockly.Arduino['time_micros'] = function(block) {
        return ['micros()', Blockly.Arduino.ORDER_ATOMIC];
    };

    // Remove conflicting variables_set implementation
    // Variables are now handled in variables.js

    console.log("Custom Arduino generator initialized.");

} // End of initializeArduinoGenerator function definition

// --- Call the Initializer ---
if (typeof Blockly !== 'undefined' && typeof Blockly.Generator !== 'undefined') {
    initializeArduinoGenerator();
} else {
    console.warn("Blockly core not ready when init script ran, delaying Arduino generator initialization until window load.");
    window.addEventListener('load', initializeArduinoGenerator);
}
