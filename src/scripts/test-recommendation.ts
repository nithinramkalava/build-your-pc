import fs from 'fs';
import path from 'path';
import { PCRecommendationSystem } from '../lib/recommendationEngine';
import { UserPreferencesJson } from '../lib/types';

// Read the input.json file
const inputPath = path.resolve(process.cwd(), 'src/recommendation/input.json');
console.log(`Reading input from: ${inputPath}`);

// Check if the file exists
if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found at: ${inputPath}`);
  process.exit(1);
}

// Read and parse the preferences
const preferences = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as UserPreferencesJson;

console.log('Preferences loaded:');
console.log(JSON.stringify(preferences, null, 2));

async function runRecommendation() {
  try {
    console.log('\nInitializing recommendation system...');
    const recSystem = new PCRecommendationSystem(preferences);

    console.log('\nGenerating recommendation...');
    const recommendation = await recSystem.buildRecommendation();
    
    console.log('\nRecommendation result:');
    console.log(JSON.stringify(recommendation, null, 2));

    // Output to file for easier inspection
    const outputPath = path.resolve(process.cwd(), 'src/recommendation/test_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(recommendation, null, 2), 'utf8');
    console.log(`\nOutput saved to: ${outputPath}`);

    // Close the database connection
    await recSystem.close();
    console.log('\nTest completed successfully.');
  } catch (error) {
    console.error('Error running recommendation test:', error);
  }
}

// Run the test
runRecommendation(); 