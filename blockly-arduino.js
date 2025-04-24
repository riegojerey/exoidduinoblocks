/**
 * @license
 * Custom Arduino generator for Blockly - Wrapped for correct loading
 * Includes generators for standard blocks: Logic, Loops, Math, Text, Variables, Procedures, Arduino IO, Time, Serial
 * and custom blocks: L298N
 */
'use strict';

(function() { // Start of IIFE wrapper

    // Wait until the core Blockly library is loaded
    if (typeof Blockly === 'undefined' || typeof Blockly.Generator === 'undefined') {
        console.error("Blockly core not loaded before blockly-arduino.js was executed.");
        return; // Stop execution if Blockly isn't ready
    }

    console.log("Blockly core detected. Defining custom Arduino generator...");

    // Create the Arduino code generator instance
    Blockly.Arduino = new Blockly.Generator('Arduino');

    // Arduino code generator reserved words
    Blockly.Arduino.addReservedWords(
        // Core language reserved words + Arduino specific
        'setup,loop,if,else,for,switch,case,while,do,break,continue,return,goto,' +
        'define,include,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,integer,' +
        'constants,floating,point,void,boolean,char,unsigned,byte,int,word,long,' +
        'float,double,string,String,array,static,volatile,const,sizeof,pinMode,' +
        'digitalWrite,digitalRead,analogReference,analogRead,analogWrite,tone,' +
        'noTone,shiftOut,shiftIn,pulseIn,millis,micros,delay,delayMicroseconds,' +
        'min,max,abs,constrain,map,pow,sqrt,sin,cos,tan,randomSeed,random,' +
        'lowByte,highByte,bitRead,bitWrite,bitSet,bitClear,bit,attachInterrupt,' +
        'detachInterrupt,interrupts,noInterrupts,A0,A1,A2,A3,A4,A5,A6,A7' // Add common analog pins
        // Add other board specific pins if needed
    );

    /**
     * Order of operation ENUMs.
     */
    Blockly.Arduino.ORDER_ATOMIC = 0;         // 0 "" ...
    Blockly.Arduino.ORDER_UNARY_POSTFIX = 1;  // expr++ expr-- () [] .
    Blockly.Arduino.ORDER_UNARY_PREFIX = 2;   // -expr !expr ~expr ++expr --expr
    Blockly.Arduino.ORDER_MULTIPLICATIVE = 3; // * / %
    Blockly.Arduino.ORDER_ADDITIVE = 4;       // + -
    Blockly.Arduino.ORDER_SHIFT = 5;          // << >>
    Blockly.Arduino.ORDER_RELATIONAL = 6;     // >= > <= <
    Blockly.Arduino.ORDER_EQUALITY = 7;       // == !=
    Blockly.Arduino.ORDER_BITWISE_AND = 8;    // &
    Blockly.Arduino.ORDER_BITWISE_XOR = 9;    // ^
    Blockly.Arduino.ORDER_BITWISE_OR = 10;    // |
    Blockly.Arduino.ORDER_LOGICAL_AND = 11;   // &&
    Blockly.Arduino.ORDER_LOGICAL_OR = 12;    // ||
    Blockly.Arduino.ORDER_CONDITIONAL = 13;   // expr ? expr : expr
    Blockly.Arduino.ORDER_ASSIGNMENT = 14;    // = *= /= %= += -= <<= >>= &= ^= |=
    Blockly.Arduino.ORDER_NONE = 99;          // (...)

    /**
     * Initialize the database of variable names.
     */
    Blockly.Arduino.init = function(workspace) {
        Blockly.Arduino.definitions_ = Object.create(null);
        Blockly.Arduino.setups_ = Object.create(null);
        // Function definitions are typically added globally by the generator functions themselves
        Blockly.Arduino.functionNames_ = Object.create(null); // For function name handling

        // Use nameDB_ (newer) or fall back to variableDB_ (older/deprecated)
        const nameDbType = Blockly.Names.DEVELOPER_VARIABLE_TYPE || Blockly.Variables.NAME_TYPE;
        const variableCategory = Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE;

        if (!Blockly.Arduino.nameDB_) {
             if (!Blockly.Arduino.variableDB_) {
                 Blockly.Arduino.variableDB_ = new Blockly.Names(Blockly.Arduino.RESERVED_WORDS_);
                 console.warn("Using deprecated variableDB_. Consider updating Blockly version or generator code.");
             } else {
                 Blockly.Arduino.variableDB_.reset();
             }
             Blockly.Arduino.nameDB_ = Blockly.Arduino.variableDB_;
        } else {
             Blockly.Arduino.nameDB_.reset();
        }

        Blockly.Arduino.nameDB_.setVariableMap(workspace.getVariableMap());

        var devVarList = Blockly.Variables.allDeveloperVariables(workspace);
        for (var i = 0; i < devVarList.length; i++) {
            Blockly.Arduino.nameDB_.getName(devVarList[i], nameDbType);
        }

         var variables = Blockly.Variables.allUsedVarModels(workspace);
         var variableDeclarations = [];
         for (var i = 0; i < variables.length; i++) {
             var varName = Blockly.Arduino.nameDB_.getName(variables[i].getId(), variableCategory);
             // Determine type based on variable model if possible, default to int
             var varType = variables[i].type || 'int'; // Simple type handling
             // Map common types to Arduino types
             if (varType === 'Number') varType = 'float'; // Or int depending on usage
             if (varType === 'String') varType = 'String';
             if (varType === 'Boolean') varType = 'boolean';
             // Add more type mappings if needed
             variableDeclarations.push(varType + ' ' + varName + ';');
         }
         if (variableDeclarations.length > 0) {
             Blockly.Arduino.definitions_['variables'] = variableDeclarations.join('\n');
         }
         // Reset setups specific to blocks, will be populated by generators
         Blockly.Arduino.setups_ = {};
    };

    /**
     * Prepend the generated code with the variable definitions.
     */
    Blockly.Arduino.finish = function(code) {
        var definitions = [];
        for (var name in Blockly.Arduino.definitions_) {
            definitions.push(Blockly.Arduino.definitions_[name]);
        }
        var setups = [];
        for (var name in Blockly.Arduino.setups_) {
            setups.push(Blockly.Arduino.setups_[name]);
        }
        // Function definitions are usually part of definitions_
        // Clean up temporary data - DO THIS AT THE END
        var tempDefinitions = Blockly.Arduino.definitions_;
        var tempSetups = Blockly.Arduino.setups_;
        Blockly.Arduino.definitions_ = null; // Allow GC
        Blockly.Arduino.setups_ = null;      // Allow GC
        Blockly.Arduino.functionNames_ = null; // Allow GC

        var allDefs = definitions.join('\n');
        var setupCode = setups.map(s => '  ' + s.trim()).join('\n');
        var loopCode = code ? code.split('\n').map(line => '  ' + line.trim()).filter(line => line.trim() !== '').join('\n') : '';

        var setup = 'void setup() {\n' + setupCode + '\n}\n\n';
        var loop = 'void loop() {\n' + loopCode + '\n}';

        // Restore definitions and setups for potential subsequent calls if needed
        Blockly.Arduino.definitions_ = tempDefinitions;
        Blockly.Arduino.setups_ = tempSetups;
        Blockly.Arduino.functionNames_ = Object.create(null); // Recreate for next run

        if (!allDefs.includes('#include <Arduino.h>')) {
             allDefs = '#include <Arduino.h>\n' + allDefs;
        }
        return allDefs.trim() + '\n\n' + setup + loop;
    };

    /**
     * Naked values require a trailing semicolon.
     */
    Blockly.Arduino.scrubNakedValue = function(line) {
        return line + ';\n';
    };

    /**
     * Encode Arduino strings.
     */
    Blockly.Arduino.quote_ = function(string) {
        string = string.replace(/\\/g, '\\\\')
                       .replace(/\n/g, '\\n')
                       .replace(/\r/g, '\\r')
                       .replace(/'/g, "\\'")
                       .replace(/"/g, '\\"');
        return '"' + string + '"';
    };

    /**
     * Common tasks for generating code from blocks.
     */
    Blockly.Arduino.scrub_ = function(block, code, thisOnly) {
        if (code === null) { return ''; }
        var commentCode = '';
        if (!block.outputConnection || !block.outputConnection.targetConnection) {
            var comment = block.getCommentText();
            if (comment) {
                comment = Blockly.utils.string.wrap(comment, this.COMMENT_WRAP || 80);
                commentCode += this.prefixLines(comment, '// ') + '\n';
            }
            for (var i = 0; i < block.inputList.length; i++) {
                if (block.inputList[i].type == Blockly.INPUT_VALUE) {
                    var childBlock = block.inputList[i].connection.targetBlock();
                    if (childBlock) {
                        var childComment = this.allNestedComments(childBlock);
                        if (childComment) {
                            commentCode += this.prefixLines(childComment, '// ');
                        }
                    }
                }
            }
        }
        var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
        var nextCode = thisOnly ? '' : this.blockToCode(nextBlock);
        return commentCode + code + nextCode;
    };

    // --- Add ALL Block Generator Functions ---

    // --- Math Block Generators ---
    Blockly.Arduino['math_number'] = function(block) {
      var code = Number(block.getFieldValue('NUM'));
      var order = code < 0 ? Blockly.Arduino.ORDER_UNARY_PREFIX : Blockly.Arduino.ORDER_ATOMIC;
      if (code == Infinity) { code = 'INFINITY'; }
      else if (code == -Infinity) { code = '-INFINITY';}
      return [code, order];
    };
    Blockly.Arduino['math_arithmetic'] = function(block) {
      var OPERATORS = {'ADD': [' + ', Blockly.Arduino.ORDER_ADDITIVE], 'MINUS': [' - ', Blockly.Arduino.ORDER_ADDITIVE], 'MULTIPLY': [' * ', Blockly.Arduino.ORDER_MULTIPLICATIVE], 'DIVIDE': [' / ', Blockly.Arduino.ORDER_MULTIPLICATIVE], 'POWER': [null, Blockly.Arduino.ORDER_NONE]};
      var tuple = OPERATORS[block.getFieldValue('OP')]; var operator = tuple[0]; var order = tuple[1];
      var argument0 = Blockly.Arduino.valueToCode(block, 'A', order) || '0'; var argument1 = Blockly.Arduino.valueToCode(block, 'B', order) || '0';
      var code;
      if (!operator) { code = 'pow(' + argument0 + ', ' + argument1 + ')'; return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; }
      code = argument0 + operator + argument1; return [code, order];
    };
     Blockly.Arduino['math_single'] = function(block) {
      var operator = block.getFieldValue('OP'); var code; var arg;
      if (operator == 'NEG') { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_UNARY_PREFIX) || '0'; if (arg[0] == '-') { arg = ' ' + arg; } code = '-' + arg; return [code, Blockly.Arduino.ORDER_UNARY_PREFIX]; }
      if (operator == 'ABS' || operator.substring(0, 5) == 'ROUND') { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_UNARY_POSTFIX) || '0'; }
      else if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_MULTIPLICATIVE) || '0'; }
      else { arg = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_NONE) || '0'; }
      switch (operator) {
        case 'ABS': code = 'abs(' + arg + ')'; break; case 'ROOT': code = 'sqrt(' + arg + ')'; break; case 'LN': code = 'log(' + arg + ')'; break;
        case 'EXP': code = 'exp(' + arg + ')'; break; case 'POW10': code = 'pow(10,' + arg + ')'; break; case 'ROUND': code = 'round(' + arg + ')'; break;
        case 'ROUNDUP': code = 'ceil(' + arg + ')'; break; case 'ROUNDDOWN': code = 'floor(' + arg + ')'; break;
        case 'SIN': code = 'sin(' + arg + ' / 180.0 * PI)'; break; case 'COS': code = 'cos(' + arg + ' / 180.0 * PI)'; break; case 'TAN': code = 'tan(' + arg + ' / 180.0 * PI)'; break;
        default: throw Error('Unknown math operator: ' + operator);
      } return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
    };
     Blockly.Arduino['math_random_int'] = function(block) {
        var argument0 = Blockly.Arduino.valueToCode(block, 'FROM', Blockly.Arduino.ORDER_COMMA) || '0';
        var argument1 = Blockly.Arduino.valueToCode(block, 'TO', Blockly.Arduino.ORDER_COMMA) || '0';
        Blockly.Arduino.setups_['setup_randomseed'] = 'randomSeed(analogRead(0));'; // Use an unconnected analog pin for seed
        var code = 'random(' + argument0 + ', ' + argument1 + ' + 1)'; return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX];
      };

    // --- Logic Block Generators ---
    Blockly.Arduino['controls_if'] = function(block) {
      var n = 0; var code = '', branchCode, conditionCode;
      do {
        conditionCode = Blockly.Arduino.valueToCode(block, 'IF' + n, Blockly.Arduino.ORDER_NONE) || 'false';
        branchCode = Blockly.Arduino.statementToCode(block, 'DO' + n);
        code += (n > 0 ? ' else ' : '') + 'if (' + conditionCode + ') {\n' + branchCode + '}';
        ++n;
      } while (block.getInput('IF' + n));
      if (block.getInput('ELSE')) { branchCode = Blockly.Arduino.statementToCode(block, 'ELSE'); code += ' else {\n' + branchCode + '}'; }
      return code + '\n';
    };
    Blockly.Arduino['logic_compare'] = function(block) {
      var OPERATORS = {'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='};
      var operator = OPERATORS[block.getFieldValue('OP')]; var order = Blockly.Arduino.ORDER_EQUALITY;
      var argument0 = Blockly.Arduino.valueToCode(block, 'A', order) || '0'; var argument1 = Blockly.Arduino.valueToCode(block, 'B', order) || '0';
      var code = argument0 + ' ' + operator + ' ' + argument1; return [code, order];
    };
    Blockly.Arduino['logic_operation'] = function(block) {
      var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
      var order = (operator == '&&') ? Blockly.Arduino.ORDER_LOGICAL_AND : Blockly.Arduino.ORDER_LOGICAL_OR;
      var argument0 = Blockly.Arduino.valueToCode(block, 'A', order) || 'false'; var argument1 = Blockly.Arduino.valueToCode(block, 'B', order) || 'false';
      if (!argument0 && !argument1) { argument0 = 'false'; argument1 = 'false'; }
      else { var defaultArgument = (operator == '&&') ? 'true' : 'false'; if (!argument0) { argument0 = defaultArgument; } if (!argument1) { argument1 = defaultArgument; } }
      var code = argument0 + ' ' + operator + ' ' + argument1; return [code, order];
    };
    Blockly.Arduino['logic_negate'] = function(block) {
      var order = Blockly.Arduino.ORDER_UNARY_PREFIX; var argument0 = Blockly.Arduino.valueToCode(block, 'BOOL', order) || 'true';
      var code = '!' + argument0; return [code, order];
    };
    Blockly.Arduino['logic_boolean'] = function(block) { var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false'; return [code, Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['logic_null'] = function(block) { return ['NULL', Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['logic_ternary'] = function(block) {
      var value_if = Blockly.Arduino.valueToCode(block, 'IF', Blockly.Arduino.ORDER_CONDITIONAL) || 'false';
      var value_then = Blockly.Arduino.valueToCode(block, 'THEN', Blockly.Arduino.ORDER_CONDITIONAL) || 'null';
      var value_else = Blockly.Arduino.valueToCode(block, 'ELSE', Blockly.Arduino.ORDER_CONDITIONAL) || 'null';
      var code = value_if + ' ? ' + value_then + ' : ' + value_else; return [code, Blockly.Arduino.ORDER_CONDITIONAL];
    };

    // --- Loop Block Generators ---
    Blockly.Arduino['controls_repeat_ext'] = function(block) {
      var repeats;
      if (block.getField('TIMES')) { // Internal number
        repeats = String(Number(block.getFieldValue('TIMES')));
      } else { // External number
        repeats = Blockly.Arduino.valueToCode(block, 'TIMES', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
      }
      var branch = Blockly.Arduino.statementToCode(block, 'DO');
      branch = Blockly.Arduino.addLoopTrap(branch, block.id); // Add loop trap if needed by framework
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
          // Variables used, assume int type for loop counter
          code += 'for (int ' + variable0 + ' = ' + argument0 + '; ';
          if (up) { code += variable0 + ' <= ' + argument1 + '; '; }
          else { code += variable0 + ' >= ' + argument1 + '; '; }
          code += variable0 + ' += ' + (up ? step : -step) + ') {\n' + branch + '}\n';
      } else {
          // Numbers used, generate simpler loop if possible
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

    // --- Text Block Generators ---
    Blockly.Arduino['text'] = function(block) { var code = Blockly.Arduino.quote_(block.getFieldValue('TEXT')); return [code, Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['text_print'] = function(block) { // Map text_print to Serial.println
      var msg = Blockly.Arduino.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_NONE) || '""';
      // Ensure Serial is initialized
      Blockly.Arduino.setups_['setup_serial_print'] = 'Serial.begin(9600);'; // Default baud or get from setup block
      return 'Serial.println(' + msg + ');\n';
    };
    Blockly.Arduino['text_join'] = function(block) { // Basic string concatenation
        if (block.itemCount_ == 0) { return ['""', Blockly.Arduino.ORDER_ATOMIC]; }
        var code = ''; var order = Blockly.Arduino.ORDER_ADDITIVE;
        for (var n = 0; n < block.itemCount_; n++) {
            var argument = Blockly.Arduino.valueToCode(block, 'ADD' + n, order) || '""';
            if (n > 0) { code += ' + '; } // Use + for string concat in C++ with String objects
            code += 'String(' + argument + ')'; // Cast to String object
        }
        // If only one argument, return it directly without casting if possible
        if (block.itemCount_ == 1) {
             var singleArg = Blockly.Arduino.valueToCode(block, 'ADD0', Blockly.Arduino.ORDER_ATOMIC) || '""';
             return [singleArg, Blockly.Arduino.ORDER_ATOMIC]; // Return original type if possible
        }
        return [code, order];
    };
    Blockly.Arduino['text_append'] = function(block) {
        var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
        var value = Blockly.Arduino.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_ASSIGNMENT) || '""';
        // Requires the variable to be a String object
        return varName + ' += String(' + value + ');\n';
    };
    // Add text_length, text_isEmpty, etc. if needed, adapting from JS generators


    // --- Variable Block Generators ---
    Blockly.Arduino['variables_get'] = function(block) { var code = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE); return [code, Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['variables_set'] = function(block) { var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0'; var varName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE); return varName + ' = ' + argument0 + ';\n'; };

    // --- Procedure Block Generators ---
    Blockly.Arduino.getProcedureDef = function(block) { // Helper function used by procedures_defnoreturn and procedures_defreturn
        var funcName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
        var xfix1 = '';
        if (Blockly.Arduino.STATEMENT_PREFIX) { xfix1 += Blockly.Arduino.STATEMENT_PREFIX.replace(/%1/g, '\'' + block.id + '\''); }
        if (Blockly.Arduino.INFINITE_LOOP_TRAP) { xfix1 += Blockly.Arduino.INFINITE_LOOP_TRAP.replace(/%1/g, '\'' + block.id + '\''); }
        var branch = Blockly.Arduino.statementToCode(block, 'STACK');
        var returnValue = Blockly.Arduino.valueToCode(block, 'RETURN', Blockly.Arduino.ORDER_NONE) || '';
        var xfix2 = '';
        if (branch && returnValue) { xfix2 = xfix1; } // Avoid trailing prefix if no statements and no return
        if (returnValue) { returnValue = Blockly.Arduino.INDENT + 'return ' + returnValue + ';\n'; }
        var args = [];
        var variables = block.getVars();
        for (var i = 0; i < variables.length; i++) {
            // Assume 'int' type for parameters for simplicity
            args[i] = 'int ' + Blockly.Arduino.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME || Blockly.Variables.NAME_TYPE);
        }
        var returnType = returnValue ? 'int' : 'void'; // Assume int return type if there is a return value
        var code = returnType + ' ' + funcName + '(' + args.join(', ') + ') {\n' + xfix1 + branch + xfix2 + returnValue + '}';
        code = Blockly.Arduino.scrub_(block, code);
        Blockly.Arduino.definitions_[funcName] = code; // Add function definition
        return null; // Definition block doesn't generate inline code
    };
    Blockly.Arduino['procedures_defnoreturn'] = Blockly.Arduino.getProcedureDef;
    Blockly.Arduino['procedures_defreturn'] = Blockly.Arduino.getProcedureDef;
    Blockly.Arduino['procedures_callnoreturn'] = function(block) {
        var funcName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
        var args = [];
        var variables = block.getVars();
        for (var i = 0; i < variables.length; i++) {
            args[i] = Blockly.Arduino.valueToCode(block, 'ARG' + i, Blockly.Arduino.ORDER_COMMA) || 'null';
        }
        var code = funcName + '(' + args.join(', ') + ');\n';
        return code;
    };
    Blockly.Arduino['procedures_callreturn'] = function(block) {
        var funcName = Blockly.Arduino.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
        var args = [];
        var variables = block.getVars();
        for (var i = 0; i < variables.length; i++) {
            args[i] = Blockly.Arduino.valueToCode(block, 'ARG' + i, Blockly.Arduino.ORDER_COMMA) || 'null';
        }
        var code = funcName + '(' + args.join(', ') + ')';
        return [code, Blockly.Arduino.ORDER_UNARY_POSTFIX]; // Function call order
    };
    Blockly.Arduino['procedures_ifreturn'] = function(block) {
        var condition = Blockly.Arduino.valueToCode(block, 'CONDITION', Blockly.Arduino.ORDER_NONE) || 'false';
        var code = 'if (' + condition + ') {\n';
        if (block.hasReturnValue_) {
            var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || 'null';
            code += Blockly.Arduino.INDENT + 'return ' + value + ';\n';
        } else {
            code += Blockly.Arduino.INDENT + 'return;\n';
        }
        code += '}\n';
        return code;
    };


    // --- L298N generators ---
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

    // --- Standard Arduino Block Generators ---
    Blockly.Arduino['arduino_setup'] = function(block) { var statements_setup = Blockly.Arduino.statementToCode(block, 'SETUP'); Blockly.Arduino.setups_['user_setup'] = statements_setup; return ''; };
    Blockly.Arduino['arduino_loop'] = function(block) { var statements_loop = Blockly.Arduino.statementToCode(block, 'LOOP'); return statements_loop; };
    Blockly.Arduino['io_digitalwrite'] = function(block) { var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '13'; var value = Blockly.Arduino.valueToCode(block, 'STATE', Blockly.Arduino.ORDER_ATOMIC) || 'HIGH'; return `digitalWrite(${pin}, ${value});\n`; };
    Blockly.Arduino['io_digitalread'] = function(block) { var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2'; return [`digitalRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['io_analogwrite'] = function(block) { var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '3'; var value = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ATOMIC) || '128'; return `analogWrite(${pin}, ${value});\n`; };
    Blockly.Arduino['io_analogread'] = function(block) { var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || 'A0'; return [`analogRead(${pin})`, Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['io_highlow'] = function(block) { return [block.getFieldValue('STATE'), Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['io_pinmode'] = function(block) { var pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '13'; var mode = block.getFieldValue('MODE'); Blockly.Arduino.setups_['setup_pinmode_' + pin] = `pinMode(${pin}, ${mode});`; return ''; };
    Blockly.Arduino['time_delay'] = function(block) { var time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MILI', Blockly.Arduino.ORDER_ATOMIC) || '1000'; return `delay(${time});\n`; };
    Blockly.Arduino['time_delaymicros'] = function(block) { var time = Blockly.Arduino.valueToCode(block, 'DELAY_TIME_MICRO', Blockly.Arduino.ORDER_ATOMIC) || '100'; return `delayMicroseconds(${time});\n`; };
    Blockly.Arduino['time_millis'] = function(block) { return ['millis()', Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['time_micros'] = function(block) { return ['micros()', Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['serial_setup'] = function(block) { var baud = block.getFieldValue('BAUD') || '9600'; Blockly.Arduino.setups_['setup_serial'] = `Serial.begin(${baud});`; return ''; };
    Blockly.Arduino['serial_print'] = function(block) { var content = Blockly.Arduino.valueToCode(block, 'CONTENT', Blockly.Arduino.ORDER_ATOMIC) || '""'; var nlField = block.getField('NEW_LINE'); var nl = nlField ? nlField.getValue() === 'TRUE' : false; if (nl) { return `Serial.println(${content});\n`; } else { return `Serial.print(${content});\n`; } };
    Blockly.Arduino['serial_available'] = function(block) { return ['Serial.available()', Blockly.Arduino.ORDER_ATOMIC]; };
    Blockly.Arduino['serial_read'] = function(block) { return ['Serial.read()', Blockly.Arduino.ORDER_ATOMIC]; };

    // --- Final Check ---
     console.log("Custom blockly-arduino.js executed and Blockly.Arduino defined.");

})(); // End of IIFE wrapper
