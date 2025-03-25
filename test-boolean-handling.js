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

// Add additional boolean formats to test YAML 1.2 compliance
process.env.INPUT_BOOL_TRUE_UPPER = 'TRUE';    // Uppercase TRUE
process.env.INPUT_BOOL_FALSE_UPPER = 'FALSE';  // Uppercase FALSE
process.env.INPUT_BOOL_TRUE_TITLE = 'True';    // Title case True
process.env.INPUT_BOOL_FALSE_TITLE = 'False';  // Title case False

// Output initial environment
console.log('======== INITIAL ENVIRONMENT ========');
Object.keys(process.env).filter(k => k.startsWith('INPUT_')).forEach(key => {
  console.log(`${key}="${process.env[key]}"`);
});
console.log('====================================');

/**
 * This function directly matches the updated implementation in WitnessActionRunner.js
 * and allows us to test the boolean handling logic
 */
function getWrappedActionEnv() {
  // Start with a copy of the current environment
  const newEnv = { ...process.env };
  const passedInputs = [];
  
  // Process input- prefixed variables first
  // This is crucial for correct boolean parameter handling
  for (const key in process.env) {
    if (key.startsWith('INPUT_')) {
      console.log(`Processing key: ${key}...`);
      
      const inputName = key.substring(6).toLowerCase();
      console.log(`  inputName (lowercase): ${inputName}`);
      const inputValue = process.env[key];
      
      // Skip witness parameters (not implemented in this test)
      
      // Handle input- prefixed inputs by stripping the prefix
      // NOTE: GitHub Actions converts "input-debug" in YAML to "INPUT_INPUT-DEBUG" in env
      if (inputName.startsWith('input-')) {
        const originalName = inputName;
        const strippedName = inputName.substring(6); // Remove 'input-' prefix
        console.log(`  Detected input- prefix! New inputName: ${strippedName}`);
        
        // Create a new environment variable with the correct name
        // GitHub Actions preserves hyphens in environment variable names
        const newKey = `INPUT_${strippedName.toUpperCase()}`;
        console.log(`  New environment key: ${newKey}`);
        
        // IMPORTANT: Preserve the original value exactly as-is
        // This ensures boolean values keep their original format
        // which is essential for YAML 1.2 Core Schema compliance
        
        // Set the new environment variable and remove the old one
        newEnv[newKey] = inputValue;
        delete newEnv[key];
        
        console.log(`  ✓ Mapped input-prefixed parameter: ${originalName} -> ${strippedName} (env: ${key} -> ${newKey})`);
        
        // Track this as a passed input if not already in the list
        if (!passedInputs.includes(strippedName)) {
          passedInputs.push(strippedName);
        }
      } else {
        console.log(`  ✓ Direct parameter, no transformation needed`);
        
        // Add to passed inputs if not already included
        const simpleName = inputName;
        if (!passedInputs.includes(simpleName)) {
          passedInputs.push(simpleName);
        }
      }
    }
  }
  
  // Logging would normally happen here for action.yml defaults
  // (not implemented in this test)
  
  console.log(`Passing direct input to wrapped action: ${passedInputs.length} inputs`);
  
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

// Check that alternative boolean formats are preserved
if (transformedEnv.INPUT_BOOL_TRUE_UPPER !== 'TRUE') {
  console.log('❌ Uppercase TRUE not preserved. Expected "TRUE", got:', transformedEnv.INPUT_BOOL_TRUE_UPPER);
  success = false;
}

if (transformedEnv.INPUT_BOOL_FALSE_UPPER !== 'FALSE') {
  console.log('❌ Uppercase FALSE not preserved. Expected "FALSE", got:', transformedEnv.INPUT_BOOL_FALSE_UPPER);
  success = false;
}

if (transformedEnv.INPUT_BOOL_TRUE_TITLE !== 'True') {
  console.log('❌ Title case True not preserved. Expected "True", got:', transformedEnv.INPUT_BOOL_TRUE_TITLE);
  success = false;
}

if (transformedEnv.INPUT_BOOL_FALSE_TITLE !== 'False') {
  console.log('❌ Title case False not preserved. Expected "False", got:', transformedEnv.INPUT_BOOL_FALSE_TITLE);
  success = false;
}

if (success) {
  console.log('\n✅ SUCCESS: Boolean parameter handling works as expected!');
  console.log('- Direct parameters are preserved correctly');
  console.log('- Input-prefixed parameters are transformed correctly');
  console.log('- All YAML 1.2 boolean formats are maintained');
  console.log('- No unexpected value normalization occurs');
} else {
  console.log('\n❌ FAILURE: Boolean parameter handling does not work as expected.');
}