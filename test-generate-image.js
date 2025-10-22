#!/usr/bin/env node
/**
 * Test image generation with full capabilities
 */

import { spawn } from 'child_process';

const API_KEY = 'everart-D5ZGZW8WXMloMa54BhbhmJ1NWEsghfpYSzL9WpGSV20';

// Start the MCP server
const server = spawn('node', ['build/index.js'], {
  env: { ...process.env, EVERART_API_KEY: API_KEY },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let responseBuffer = '';
let testComplete = false;

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse JSON-RPC messages
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        console.log('📥 Response:', JSON.stringify(message, null, 2));

        if (message.id === 1 && message.result) {
          console.log('\n✅ Image generation completed!');
          testComplete = true;

          // Give a bit more time to see the full output
          setTimeout(() => {
            server.kill();
            process.exit(0);
          }, 2000);
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
  }
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Wait for server to initialize
setTimeout(() => {
  console.log('🎨 Testing image generation with full capabilities:');
  console.log('   - Prompt: Natural landscape with mountains and lake');
  console.log('   - Model: FLUX1.1 (5000) - Standard quality');
  console.log('   - Type: txt2img');
  console.log('   - Size: 1408x1024 (wide landscape, multiples of 32)');
  console.log('   - Format: PNG\n');

  const generateRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'generate_image',
      arguments: {
        prompt: 'A breathtaking natural landscape with snow-capped mountains in the background, a crystal clear alpine lake in the foreground, surrounded by lush green pine trees, golden hour lighting, photorealistic, highly detailed',
        model: '5000',
        type: 'txt2img',
        width: 1408,
        height: 1024,
        format: 'png',
      },
    },
  };

  console.log('📤 Sending request...\n');
  server.stdin.write(JSON.stringify(generateRequest) + '\n');

  // Safety timeout - kill after 120 seconds if not complete
  setTimeout(() => {
    if (!testComplete) {
      console.log('\n⏱️  Test timeout reached (120s)');
      server.kill();
      process.exit(1);
    }
  }, 120000);
}, 1000);
