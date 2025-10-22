#!/usr/bin/env node
/**
 * Test all dimension configurations to find what works
 */

import { spawn } from 'child_process';

const API_KEY = 'everart-D5ZGZW8WXMloMa54BhbhmJ1NWEsghfpYSzL9WpGSV20';

// Common aspect ratios and sizes (all multiples of 32)
const TEST_SIZES = [
  { name: 'Square 512', width: 512, height: 512 },
  { name: 'Square 768', width: 768, height: 768 },
  { name: 'Square 1024', width: 1024, height: 1024 },
  { name: 'Landscape 1024x768', width: 1024, height: 768 },
  { name: 'Portrait 768x1024', width: 768, height: 1024 },
  { name: 'Wide 1408x1024', width: 1408, height: 1024 },
  { name: 'Tall 1024x1408', width: 1024, height: 1408 },
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
          const testConfig = TEST_SIZES[currentTest - 1];
          console.log(`\n✅ Test ${currentTest} Complete: ${testConfig.name}`);
          console.log(`   Requested: ${testConfig.width}x${testConfig.height}`);

          results.push({
            test: testConfig.name,
            requested: `${testConfig.width}x${testConfig.height}`,
            success: true
          });

          // Start next test
          if (currentTest < TEST_SIZES.length) {
            setTimeout(() => runNextTest(), 2000);
          } else {
            // All tests complete
            console.log('\n' + '='.repeat(60));
            console.log('ALL TESTS COMPLETE');
            console.log('='.repeat(60));
            console.log('\nResults Summary:');
            results.forEach((r, i) => {
              console.log(`${i + 1}. ${r.test}: ${r.requested} - ${r.success ? '✅' : '❌'}`);
            });
            console.log('\nNow check actual dimensions with:');
            console.log('sips -g pixelWidth -g pixelHeight images/*.png');

            setTimeout(() => {
              server.kill();
              process.exit(0);
            }, 2000);
          }
        }
      } catch (e) {
        // Not JSON
      }
    }
  }
});

function runNextTest() {
  currentTest++;
  if (currentTest > TEST_SIZES.length) return;

  const config = TEST_SIZES[currentTest - 1];
  console.log(`\n📸 Test ${currentTest}/${TEST_SIZES.length}: ${config.name} (${config.width}x${config.height})`);

  const request = {
    jsonrpc: '2.0',
    id: currentTest,
    method: 'tools/call',
    params: {
      name: 'generate_image',
      arguments: {
        prompt: `Test image ${currentTest}: A simple geometric pattern with text "${config.name}"`,
        model: '5000',
        type: 'txt2img',
        width: config.width,
        height: config.height,
        format: 'png',
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
  console.log('🧪 Testing All Dimension Configurations');
  console.log('=' .repeat(60));
  runNextTest();
}, 1000);

// Safety timeout
setTimeout(() => {
  console.log('\n⏱️  Overall timeout reached');
  server.kill();
  process.exit(1);
}, 600000); // 10 minutes total
