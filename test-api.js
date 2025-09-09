#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Test Chinese courses
    console.log('Testing Chinese courses API...');
    const zhResponse = await fetch('http://localhost:3003/api/zh/courses');
    const zhData = await zhResponse.json();
    console.log('Chinese courses response:', JSON.stringify(zhData, null, 2));
    
    // Test English courses
    console.log('\nTesting English courses API...');
    const enResponse = await fetch('http://localhost:3003/api/en/courses');
    const enData = await enResponse.json();
    console.log('English courses response:', JSON.stringify(enData, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();