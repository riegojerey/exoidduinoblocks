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
    if (typeof Blockly === 'undefined' || typeof Blockly.Generator === 'undefined') {
        console.error("Blockly core or Blockly.Generator not loaded when initializeArduinoGenerator was called!");
        return; // Stop if prerequisites aren't met
    }
     if (typeof Blockly.Arduino !== 'undefined') {
         console.warn("Blockly.Arduino seems to be already defined. Skipping re-initialization.");
         return; // Avoid re-defining if already loaded
     }

    console.log("Defining custom Arduino generator object...");

    // Create the Arduino code generator instance
    Blockly.Arduino = new Blockly.Generator('Arduino');

    // --- Reserved Words ---
    Blockly.Arduino.addReservedWords(
        'setup,loop,if,else,for,switch,case,while,do,break,continue,return,goto,' +
        'define,include,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,integer,' +
        'constants,floating,point,void,boolean,char,unsigned,byte,int,word,long,' +
        'float,double,string,String,array,static,volatile,const,sizeof,pinMode,' +
        'digitalWrite,digitalRead,analogReference,analogRead,analogWrite,tone,' +
        'noTone,shiftOut,shiftIn,pulseIn,millis,micros,delay,delayMicroseconds,' +
        'min,max,abs,constrain,map,pow,sqrt,sin,cos,tan,randomSeed,random,' +
        'lowByte,highByte,bitRead,bitWrite,bitSet,bitClear,bit,attachInterrupt,' +
        'detachInterrupt,interrupts,noInterrupts,A0,A1,A2,A3,A4,A5,A6,A7'
    );

    // --- Operator Precedence ---
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
        Blockly.Arduino.definitions_ = Object.create(null);
        Blockly.Arduino.setups_ = Object.create(null);
        Blockly.Arduino.functionNames_ = Object.create(null); // For procedure names

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

        // --- REMOVED Automatic Variable Declaration ---
        // The specific block generators (variables_set, procedures_def*)
        // or setup blocks (servo_attach, stepper_setup) should handle
        // adding necessary declarations to Blockly.Arduino.definitions_
        /*
         var variables = Blockly.Variables.allUsedVarModels(workspace);
         var variableDeclarations = [];
         for (var i = 0; i < variables.length; i++) {
             var varName = Blockly.Arduino.nameDB_.getName(variables[i].getId(), variableCategory);
             var varType = variables[i].type || 'int'; // Default to int
             if (varType === 'Number') varType = 'float';
             if (varType === 'String') varType = 'String';
             if (varType === 'Boolean') varType = 'boolean';
             variableDeclarations.push(varType + ' ' + varName + ';');
         }
         if (variableDeclarations.length > 0) {
             Blockly.Arduino.definitions_['variables'] = variableDeclarations.join('\n');
         }
        */
         // Reset setups at the start of init
         Blockly.Arduino.setups_ = {};
    };

    /**
     * Finalize the code. Organizes includes, definitions, setup, and loop.
     */
    Blockly.Arduino.finish = function(code) {
        var includes = [];
        var definitions = [];
        var functions = []; // Store function definitions separately

        // Separate includes, definitions, variables, and functions
        for (var name in Blockly.Arduino.definitions_) {
            var def = Blockly.Arduino.definitions_[name];
            if (name.startsWith('include_')) { // Convention for includes
                if (includes.indexOf(def) === -1) { includes.push(def); }
            } else if (name === 'variables') { // Handle variables separately if needed
                 definitions.unshift(def); // Put variable defs at the start
            } else if (Blockly.Arduino.functionNames_[name]) { // Check if it's a known function name
                 if (functions.indexOf(def) === -1) { functions.push(def); }
            }
             else {
                if (definitions.indexOf(def) === -1) { definitions.push(def); }
            }
        }

        var setups = [];
        for (var name in Blockly.Arduino.setups_) { setups.push(Blockly.Arduino.setups_[name]); }

        // Clean up temporary data
        var tempDefinitions = Blockly.Arduino.definitions_; var tempSetups = Blockly.Arduino.setups_; var tempFunctionNames = Blockly.Arduino.functionNames_;
        Blockly.Arduino.definitions_ = null; Blockly.Arduino.setups_ = null; Blockly.Arduino.functionNames_ = null;
        if (Blockly.Arduino.nameDB_) Blockly.Arduino.nameDB_.reset();

        var includesCode = includes.join('\n');
        var definitionsCode = definitions.join('\n\n'); // Add blank line between definitions
        var functionsCode = functions.join('\n\n'); // Add blank line between functions
        var setupCode = setups.map(s => '  ' + s.trim()).join('\n');
        var loopCode = code ? code.split('\n').map(line => '  ' + line.trim()).filter(line => line.trim() !== '').join('\n') : '';

        // Build the final sketch structure
        var finalCode = '';
        if (includesCode) finalCode += includesCode + '\n\n';
        if (definitionsCode) finalCode += definitionsCode.trim() + '\n\n'; // Trim potential extra newlines
        if (functionsCode) finalCode += functionsCode + '\n\n'; // Place functions before setup/loop

        finalCode += 'void setup() {\n' + setupCode + '\n}\n\n';
        finalCode += 'void loop() {\n' + loopCode + '\n}';

        // Restore for potential reuse (less critical now)
        Blockly.Arduino.definitions_ = tempDefinitions;
        Blockly.Arduino.setups_ = tempSetups;
        Blockly.Arduino.functionNames_ = Object.create(null);

        // Ensure Arduino.h is included if not already present
        if (!finalCode.startsWith('#include <Arduino.h>') && !includes.includes('#include <Arduino.h>')) {
             finalCode = '#include <Arduino.h>\n' + finalCode;
        }

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
            args[i] = 'int ' + Blockly.Arduino.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
        }
        var returnType = returnValue ? 'int' : 'void';
        var code = returnType + ' ' + funcName + '(' + args.join(', ') + ') {\n' + xfix1 + branch + xfix2 + returnValue + '}';
        code = Blockly.Arduino.scrub_(block, code);
        // Store function definition using function name map
        Blockly.Arduino.functionNames_[funcName] = funcName; // Map name to itself
        Blockly.Arduino.definitions_[funcName] = code; // Add function definition code
        return null;
    };

    console.log("Custom Arduino generator initialized.");

} // End of initializeArduinoGenerator function definition

// --- Call the Initializer ---
if (typeof Blockly !== 'undefined' && typeof Blockly.Generator !== 'undefined') {
    initializeArduinoGenerator();
} else {
    console.warn("Blockly core not ready when init script ran, delaying Arduino generator initialization until window load.");
    window.addEventListener('load', initializeArduinoGenerator);
}
