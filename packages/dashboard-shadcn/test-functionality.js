#!/usr/bin/env node

/**
 * Comprehensive functionality test for SpendRule Dashboard
 */

const axios = require('axios');

const API_BASE = 'https://spendrule-doc-upload-dashboard.oluwamakinwa.workers.dev/api';

// Test credentials
const HENRY_FORD_CREDS = 'henryford_user:HF_Secure_2025';
const ADMIN_CREDS = 'spendrule_admin:Admin_2025';

async function testEndpoint(name, url, credentials, expectedStatus = 200) {
  try {
    console.log(`🧪 Testing ${name}...`);
    
    const auth = Buffer.from(credentials).toString('base64');
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      },
      timeout: 10000
    });
    
    if (response.status === expectedStatus) {
      console.log(`✅ ${name}: SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
      return true;
    } else {
      console.log(`❌ ${name}: UNEXPECTED STATUS ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testUpload(name, credentials, filename, content) {
  try {
    console.log(`🧪 Testing ${name}...`);
    
    const auth = Buffer.from(credentials).toString('base64');
    const key = `henry_ford/contracts/${filename}`;
    const encodedKey = Buffer.from(key).toString('base64');
    
    const response = await axios.post(
      `${API_BASE}/buckets/secure-uploads/upload?key=${encodedKey}`,
      content,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/octet-stream'
        },
        timeout: 30000
      }
    );
    
    console.log(`✅ ${name}: SUCCESS`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 150)}...`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ERROR`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testCreateFolder(name, credentials, folderPath) {
  try {
    console.log(`🧪 Testing ${name}...`);
    
    const auth = Buffer.from(credentials).toString('base64');
    
    const response = await axios.post(
      `${API_BASE}/buckets/secure-uploads/folders`,
      { name: folderPath },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log(`✅ ${name}: SUCCESS`);
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ERROR`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting SpendRule Dashboard Functionality Tests\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    // Basic API connectivity
    ['API Root', `${API_BASE}`, '', 200],
    
    // Authentication tests
    ['Henry Ford Auth - Server Config', `${API_BASE}/server/config`, HENRY_FORD_CREDS],
    ['Admin Auth - Server Config', `${API_BASE}/server/config`, ADMIN_CREDS],
    
    // File listing tests
    ['Henry Ford - List Files', `${API_BASE}/buckets/secure-uploads`, HENRY_FORD_CREDS],
    ['Admin - List Files', `${API_BASE}/buckets/secure-uploads`, ADMIN_CREDS],
    
    // Health group isolation test
    ['Henry Ford - Health Group Filter', `${API_BASE}/buckets/secure-uploads?prefix=henry_ford/`, HENRY_FORD_CREDS],
  ];
  
  // Run endpoint tests
  console.log('📡 TESTING API ENDPOINTS\n');
  for (const [name, url, creds, expectedStatus] of tests) {
    const success = await testEndpoint(name, url, creds, expectedStatus);
    results.total++;
    if (success) results.passed++;
    else results.failed++;
    console.log('');
  }
  
  // Test folder creation
  console.log('📁 TESTING FOLDER OPERATIONS\n');
  const folderTests = [
    ['Create Henry Ford Contracts Folder', HENRY_FORD_CREDS, 'henry_ford/contracts'],
    ['Create Henry Ford Invoices Folder', HENRY_FORD_CREDS, 'henry_ford/invoices'],
    ['Create Henry Ford Workflows Folder', HENRY_FORD_CREDS, 'henry_ford/workflows'],
    ['Create Henry Ford Other Folder', HENRY_FORD_CREDS, 'henry_ford/other'],
  ];
  
  for (const [name, creds, folderPath] of folderTests) {
    const success = await testCreateFolder(name, creds, folderPath);
    results.total++;
    if (success) results.passed++;
    else results.failed++;
    console.log('');
  }
  
  // Test file uploads
  console.log('📤 TESTING FILE UPLOAD\n');
  const uploadTests = [
    ['Upload Test Contract', HENRY_FORD_CREDS, 'test-contract.pdf', 'Test contract content'],
    ['Upload Test Invoice', HENRY_FORD_CREDS, 'test-invoice.pdf', 'Test invoice content'],
  ];
  
  for (const [name, creds, filename, content] of uploadTests) {
    const success = await testUpload(name, creds, filename, content);
    results.total++;
    if (success) results.passed++;
    else results.failed++;
    console.log('');
  }
  
  // Final results
  console.log('📊 TEST RESULTS');
  console.log('================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Dashboard functionality is working correctly.');
  } else {
    console.log(`\n⚠️  ${results.failed} tests failed. Some functionality may not be working.`);
  }
  
  return results.failed === 0;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };