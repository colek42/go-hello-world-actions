/**
 * Simple test script to directly verify our boolean parameter handling logic
 */

// Debugging notes on the environment variable naming in GitHub Actions
console.log("=== UNDERSTANDING GITHUB ACTIONS ENVIRONMENT VARIABLES ===");
console.log("When a GitHub Actions workflow has:");
console.log("  input-debug: true");
console.log("GitHub Actions converts this to environment variable:");
console.log("  INPUT_INPUT-DEBUG=true  (with a hyphen, not underscore)");
console.log("");

// Set up mock environment variables the way GitHub Actions would
// Note: GitHub Actions uses hyphens in environment variable names
process.env.INPUT_ACTION_REF = 'goreleaser/goreleaser-action@v5';
process.env.INPUT_STEP = 'test-boolean-handling';
process.env.INPUT_INSTALL_ONLY = 'true';  // Direct boolean parameter (unquoted in YAML)
process.env['INPUT_INPUT-DEBUG'] = 'false';  // Note the HYPHEN, not underscore

// Output initial environment
console.log('======== INITIAL ENVIRONMENT ========');
Object.keys(process.env).filter(k => k.startsWith('INPUT_')).forEach(key => {
  console.log(`${key}="${process.env[key]}"`);
});
console.log('====================================');

/**
 * This function directly matches the implementation in WitnessActionRunner.js
 * and allows us to test the boolean handling logic
 */
function getWrappedActionEnv() {
  // Start with a copy of the current environment
  const newEnv = { ...process.env };
  const passedInputs = new Set();
  
  // Process inputs, with special handling for input- prefixed inputs
  const allInputs = [];
  for (const key in process.env) {
    if (key.startsWith('INPUT_')) {
      console.log(`Processing key: ${key}...`);
      
      // Get the original input name and value
      let inputName = key.substring(6).toLowerCase();
      console.log(`  inputName (lowercase): ${inputName}`);
      let inputValue = process.env[key];
      
      // Handle input- prefixed inputs by stripping the prefix
      // NOTE: GitHub Actions converts "input-debug" in YAML to "INPUT_INPUT-DEBUG" in env
      // so we need to check for "input-" in the lowercase name
      if (inputName.startsWith('input-')) {
        const originalName = inputName;
        inputName = inputName.substring(6); // Remove 'input-' prefix
        console.log(`  Detected input- prefix! New inputName: ${inputName}`);
        
        // Create a new environment variable with the correct name
        // Convert hyphens to underscores in the environment variable name
        const newKey = `INPUT_${inputName.toUpperCase().replace(/-/g, '_')}`;
        console.log(`  New environment key: ${newKey}`);
        
        // IMPORTANT: Preserve the original value exactly as-is
        // This ensures boolean values keep their original format
        // which is essential for YAML 1.2 Core Schema compliance
        
        // Set the new environment variable and remove the old one
        newEnv[newKey] = inputValue;
        delete newEnv[key];
        
        console.log(`  ✓ Mapped input-prefixed parameter: ${originalName} -> ${inputName} (env: ${key} -> ${newKey})`);
      } else {
        console.log(`  ✓ Direct parameter, no transformation needed`);
      }
      // Do not modify non-prefixed inputs at all - they're already in the correct format
      
      if (!passedInputs.has(inputName)) {
        allInputs.push(`${inputName}=${inputValue}`);
        passedInputs.add(inputName);
      }
    }
  }
  
  console.log(`Passing direct input to wrapped action: ${allInputs.length} inputs`);
  
  return newEnv;
}

// Transform the environment according to our implementation
const transformedEnv = getWrappedActionEnv();

// Output the transformation results
console.log('\n======== TRANSFORMED ENVIRONMENT ========');
Object.keys(transformedEnv).filter(k => k.startsWith('INPUT_')).forEach(key => {
  console.log(`${key}="${transformedEnv[key]}"`);
});
console.log('=========================================');

// Verify our transformation worked correctly
let success = true;

// Check that direct parameters are preserved
if (transformedEnv.INPUT_INSTALL_ONLY !== 'true') {
  console.log('❌ Direct parameter not preserved correctly. Expected "true", got:', transformedEnv.INPUT_INSTALL_ONLY);
  success = false;
}

// Check that input-prefixed parameters are properly transformed
if (transformedEnv.INPUT_DEBUG !== 'false') {
  console.log('❌ Input-prefixed parameter not transformed correctly. Expected INPUT_DEBUG="false", got:', transformedEnv.INPUT_DEBUG);
  success = false;
}

// Check that the original input-prefixed key is removed
// Note: The actual key is INPUT_INPUT-DEBUG with a hyphen, not INPUT_INPUT_DEBUG
if ('INPUT_INPUT-DEBUG' in transformedEnv) {
  console.log('❌ Original input-prefixed key not removed: INPUT_INPUT-DEBUG still exists');
  success = false;
}

if (success) {
  console.log('\n✅ SUCCESS: Boolean parameter handling works as expected!');
  console.log('- Direct parameters are preserved correctly');
  console.log('- Input-prefixed parameters are transformed correctly');
  console.log('- Original format of boolean values is maintained');
} else {
  console.log('\n❌ FAILURE: Boolean parameter handling does not work as expected.');
}