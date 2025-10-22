#!/usr/bin/env node
/**
 * Test script for MCP server stdio communication
 */

import { spawn } from 'child_process';

const API_KEY = 'everart-D5ZGZW8WXMloMa54BhbhmJ1NWEsghfpYSzL9WpGSV20';

// Start the MCP server
const server = spawn('node', ['build/index.js'], {
  env: { ...process.env, EVERART_API_KEY: API_KEY },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse JSON-RPC messages
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        console.log('📥 Received:', JSON.stringify(message, null, 2));
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

// Test 1: List tools
console.log('\n🔧 Test 1: List tools');
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
};
server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

// Wait and send Test 2
setTimeout(() => {
  console.log('\n🔧 Test 2: List images');
  const listImagesRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'list_images',
      arguments: {},
    },
  };
  server.stdin.write(JSON.stringify(listImagesRequest) + '\n');

  // Clean up after tests
  setTimeout(() => {
    console.log('\n✅ Tests complete, shutting down...');
    server.kill();
    process.exit(0);
  }, 3000);
}, 2000);
