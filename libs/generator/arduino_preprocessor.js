/**
 * @license
 * Arduino code generator for Preprocessor directive blocks.
 */
'use strict';

if (typeof Blockly === 'undefined' || !Blockly.Arduino) {
    throw new Error('Blockly or Blockly.Arduino is not loaded!');
}

// --- #define Block ---
Blockly.Blocks['preprocessor_define'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("#define")
        .appendField(new Blockly.FieldTextInput("MY_CONSTANT"), "DEFINE_NAME")
        .appendField("as")
        .appendField(new Blockly.FieldTextInput("123"), "DEFINE_VALUE");
    // No connections for #define, it's a top-level directive
    this.setColour(60); // A yellowish hue, distinct from others
    this.setTooltip("Defines a preprocessor macro. Occurs before compilation. Example: #define LED_PIN 13. The value is treated as literal text.");
    this.setHelpUrl("https://www.arduino.cc/reference/en/language/structure/further-syntax/define/");
  }
};

Blockly.Arduino['preprocessor_define'] = function(block) {
  var define_name = block.getFieldValue('DEFINE_NAME');
  var define_value = block.getFieldValue('DEFINE_VALUE');

  // Basic validation for the macro name
  if (define_name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(define_name)) {
    // Add to definitions. The value is taken as literal text.
    // Using a unique prefix for the definition key to avoid clashes.
    Blockly.Arduino.definitions_['define_' + define_name] = '#define ' + define_name + ' ' + define_value;
  } else if (define_name) {
    // Handle invalid name, perhaps add a commented out version or an error in the generated code
    var safe_define_name = define_name.replace(/[^a-zA-Z0-9_]/g, '_');
    Blockly.Arduino.definitions_['define_invalid_' + safe_define_name] = 
        `// ERROR: Invalid #define name used: "${define_name}" (sanitized to "${safe_define_name}" for key)\n` +
        `// Attempting: #define ${define_name} ${define_value}`;
    console.warn(`Invalid macro name for #define: "${define_name}". Please use valid C/C++ macro naming conventions (letters, numbers, underscores, not starting with a number).`);
  }
  // This block itself doesn't generate code directly into setup/loop, it modifies definitions.
  return '';
};

// --- Get #define Value Block ---
function getDefinedNames() {
  var options = [];
  if (Blockly.getMainWorkspace()) {
    var defineBlocks = Blockly.getMainWorkspace().getBlocksByType('preprocessor_define', false);
    defineBlocks.forEach(function(block) {
      var name = block.getFieldValue('DEFINE_NAME');
      if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) { // Only add valid names
        options.push([name, name]); // Display name and value are the same
      }
    });
  }
  if (options.length === 0) {
    options.push(["NO_DEFINES_FOUND", "NO_DEFINES_FOUND"]); // Placeholder
  }
  return options;
}

Blockly.Blocks['preprocessor_get_define'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("value of #define")
        .appendField(new Blockly.FieldDropdown(getDefinedNames), "DEFINE_NAME");
    this.setOutput(true, null); // Output type can be anything, as #define is text substitution
    this.setColour(60); // Same yellowish hue as the define block
    this.setTooltip("Gets the value of a preprocessor constant defined with a #define block. The name is used directly in the code.");
    this.setHelpUrl("https://www.arduino.cc/reference/en/language/structure/further-syntax/define/");
  }
};

Blockly.Arduino['preprocessor_get_define'] = function(block) {
  var define_name = block.getFieldValue('DEFINE_NAME');
  if (define_name === "NO_DEFINES_FOUND") {
    return ['/* ERROR: No #define selected */ 0', Blockly.Arduino.ORDER_ATOMIC];
  }
  // Return the name directly, the preprocessor will handle substitution.
  return [define_name, Blockly.Arduino.ORDER_ATOMIC];
}; 