#!/usr/bin/env node
/**
 * Test all EverArt models with proper dimensions
 */

import { spawn } from 'child_process';
import { execSync } from 'child_process';

const API_KEY = 'everart-D5ZGZW8WXMloMa54BhbhmJ1NWEsghfpYSzL9WpGSV20';

// Test configuration for each model
const MODEL_TESTS = [
  {
    model: '5000',
    name: 'FLUX1.1 Standard',
    width: 1024,
    height: 768,
    format: 'png',
    prompt: 'A serene mountain landscape with a lake, FLUX1.1 standard quality test',
  },
  {
    model: '9000',
    name: 'FLUX1.1 Ultra',
    width: 1408,
    height: 1024,
    format: 'png',
    prompt: 'A vibrant sunset over ocean waves, FLUX1.1 ultra quality test',
  },
  {
    model: '6000',
    name: 'SD 3.5 Large',
    width: 1024,
    height: 1024,
    format: 'png',
    prompt: 'A detailed portrait of a wise old wizard, SD 3.5 Large test',
  },
  {
    model: '7000',
    name: 'Recraft V3 Realistic',
    width: 1080,
    height: 1350,
    format: 'png',
    prompt: 'A photorealistic portrait of a young woman with natural lighting, Recraft V3 test',
  },
  {
    model: '8000',
    name: 'Recraft V3 Vector',
    width: 1024,
    height: 1024,
    format: 'svg',
    prompt: 'A minimalist logo design with geometric shapes, Recraft V3 vector test',
  },
];

let currentTest = 0;
let results = [];

// Start the MCP server
const server = spawn('node', ['build/index.js'], {
  env: { ...process.env, EVERART_API_KEY: API_KEY },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);

        if (message.result && message.id === currentTest) {
          const testConfig = MODEL_TESTS[currentTest - 1];
          const content = message.result.content || [];
          const textContent = content.find(c => c.type === 'text');

          console.log(`\n✅ Test ${currentTest} Complete: ${testConfig.name}`);
          console.log(`   Model ID: ${testConfig.model}`);
          console.log(`   Requested: ${testConfig.width}x${testConfig.height}`);
          console.log(`   Format: ${testConfig.format}`);

          if (textContent && textContent.text) {
            const match = textContent.text.match(/Saved to: (.+?)(\n|$)/);
            if (match) {
              const filepath = match[1];
              console.log(`   Saved: ${filepath}`);

              // Check actual dimensions
              try {
                const sipsOutput = execSync(`sips -g pixelWidth -g pixelHeight "${filepath}" 2>/dev/null`).toString();
                const widthMatch = sipsOutput.match(/pixelWidth: (\d+)/);
                const heightMatch = sipsOutput.match(/pixelHeight: (\d+)/);

                if (widthMatch && heightMatch) {
                  const actualWidth = parseInt(widthMatch[1]);
                  const actualHeight = parseInt(heightMatch[1]);
                  const matches = actualWidth === testConfig.width && actualHeight === testConfig.height;

                  console.log(`   Actual: ${actualWidth}x${actualHeight} ${matches ? '✅' : '⚠️'}`);

                  results.push({
                    model: testConfig.name,
                    modelId: testConfig.model,
                    requested: `${testConfig.width}x${testConfig.height}`,
                    actual: `${actualWidth}x${actualHeight}`,
                    matches: matches,
                    format: testConfig.format,
                  });
                }
              } catch (e) {
                console.log(`   Could not check dimensions: ${e.message}`);
                results.push({
                  model: testConfig.name,
                  modelId: testConfig.model,
                  requested: `${testConfig.width}x${testConfig.height}`,
                  actual: 'Unknown',
                  matches: false,
                  format: testConfig.format,
                });
              }
            }
          }

          // Start next test
          if (currentTest < MODEL_TESTS.length) {
            setTimeout(() => runNextTest(), 3000);
          } else {
            // All tests complete
            setTimeout(() => showResults(), 1000);
          }
        }
      } catch (e) {
        // Not JSON
      }
    }
  }
});

function showResults() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log('\n');

  console.log('| Model | ID | Requested | Actual | Match | Format |');
  console.log('|-------|----|-----------| ----------|-------|--------|');

  results.forEach(r => {
    console.log(`| ${r.model.padEnd(20)} | ${r.modelId} | ${r.requested.padEnd(9)} | ${r.actual.padEnd(10)} | ${r.matches ? '✅' : '⚠️'}  | ${r.format} |`);
  });

  console.log('\n');

  const matchCount = results.filter(r => r.matches).length;
  const totalTests = results.length;

  console.log(`Results: ${matchCount}/${totalTests} models returned requested dimensions`);

  if (matchCount < totalTests) {
    console.log('\n⚠️  Some models did not return requested dimensions.');
    console.log('This may be due to:');
    console.log('  - API free tier limitations');
    console.log('  - Model-specific constraints');
    console.log('  - Account-specific settings');
  }

  console.log('\n✅ All test images saved to: ./images/');
  console.log('\nShutting down...');

  setTimeout(() => {
    server.kill();
    process.exit(0);
  }, 2000);
}

function runNextTest() {
  currentTest++;
  if (currentTest > MODEL_TESTS.length) return;

  const config = MODEL_TESTS[currentTest - 1];
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test ${currentTest}/${MODEL_TESTS.length}: ${config.name} (Model ${config.model})`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Requesting: ${config.width}x${config.height} ${config.format.toUpperCase()}`);
  console.log(`Prompt: "${config.prompt}"`);
  console.log('Generating...\n');

  const request = {
    jsonrpc: '2.0',
    id: currentTest,
    method: 'tools/call',
    params: {
      name: 'generate_image',
      arguments: {
        prompt: config.prompt,
        model: config.model,
        type: 'txt2img',
        width: config.width,
        height: config.height,
        format: config.format,
      },
    },
  };

  server.stdin.write(JSON.stringify(request) + '\n');
}

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Wait for server to initialize, then start first test
setTimeout(() => {
  console.log('🧪 TESTING ALL EVERART MODELS');
  console.log('='.repeat(80));
  console.log(`Testing ${MODEL_TESTS.length} models with different dimensions and formats`);
  console.log('This will take approximately 5-10 minutes...\n');
  runNextTest();
}, 1000);

// Safety timeout - 15 minutes total
setTimeout(() => {
  console.log('\n⏱️  Overall timeout reached (15 minutes)');
  console.log('Completed tests:', results.length);
  if (results.length > 0) {
    showResults();
  }
  server.kill();
  process.exit(1);
}, 900000);
