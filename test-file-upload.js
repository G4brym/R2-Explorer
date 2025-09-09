#!/usr/bin/env node

/**
 * SpendRule Test File Upload Script
 * 
 * This script creates test files to help you test the file moving functionality
 * Run: node test-file-upload.js
 */

const fs = require('fs')
const path = require('path')

// Test files to create
const testFiles = [
  // Contract files
  {
    name: 'henry-ford-master-service-agreement.pdf',
    category: 'contracts',
    content: '# Master Service Agreement\n\nThis is a test contract document for Henry Ford Health.\n\nDate: 2024\nParties: Henry Ford Health System, Vendor XYZ\nServices: Healthcare IT Support\n\nTerms and Conditions:\n1. Service Level Agreements\n2. Payment Terms\n3. Data Security Requirements\n4. Compliance with HIPAA regulations\n\n[This is a test file - not a real contract]'
  },
  {
    name: 'vendor-abc-contract-renewal.docx',
    category: 'contracts', 
    content: '# Contract Renewal Document\n\nVendor: ABC Medical Supplies\nRenewal Date: January 2024\nContract Value: $500,000\n\n[Test document for file moving functionality]'
  },
  
  // Invoice files
  {
    name: 'invoice-2024-001-medical-supplies.pdf',
    category: 'invoices',
    content: '# INVOICE #2024-001\n\nFrom: ABC Medical Supplies\nTo: Henry Ford Health System\nDate: March 15, 2024\nDue Date: April 15, 2024\n\nLine Items:\n- Medical Equipment: $25,000\n- Installation Services: $5,000\n- Training: $2,500\n\nTotal: $32,500\n\n[Test invoice document]'
  },
  {
    name: 'payment-statement-q1-2024.xlsx',
    category: 'invoices',
    content: '# Q1 2024 Payment Statement\n\nQuarterly financial summary\nTotal Payments: $125,000\nPending Invoices: $23,500\nOverdue: $0\n\n[Test financial document]'
  },
  
  // Workflow files
  {
    name: 'patient-intake-workflow-diagram.png',
    category: 'workflows',
    content: '# Patient Intake Workflow\n\nStep 1: Patient Registration\n↓\nStep 2: Insurance Verification\n↓\nStep 3: Medical History Review\n↓\nStep 4: Provider Assignment\n↓\nStep 5: Appointment Scheduling\n\n[This represents a workflow diagram image]'
  },
  {
    name: 'emergency-response-process.visio',
    category: 'workflows',
    content: '# Emergency Response Process\n\nTriage → Assessment → Treatment → Documentation\n\nCritical Path Analysis:\n- Response Time: <5 minutes\n- Escalation Procedures\n- Documentation Requirements\n\n[Test workflow document]'
  },
  
  // Other/miscellaneous files
  {
    name: 'staff-training-materials.zip',
    category: 'other',
    content: '# Staff Training Materials\n\nContents:\n- HIPAA Training Videos\n- Safety Protocols\n- Emergency Procedures\n- System Access Guides\n\n[Test training package]'
  },
  {
    name: 'facility-maintenance-schedule.pdf',
    category: 'other',
    content: '# Facility Maintenance Schedule\n\nQ1 2024 Maintenance Calendar\n\n- HVAC Systems: Monthly\n- Medical Equipment: Quarterly  \n- Safety Systems: Weekly\n- Building Infrastructure: Annual\n\n[Test maintenance document]'
  }
]

function createTestFiles() {
  console.log('🧪 Creating SpendRule Test Files...\n')
  
  // Create test-files directory
  const testDir = path.join(__dirname, 'test-files')
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir)
    console.log(`📁 Created directory: ${testDir}`)
  }
  
  // Create each test file
  testFiles.forEach(file => {
    const filePath = path.join(testDir, file.name)
    const fullContent = `${file.content}\n\n---\nGenerated: ${new Date().toISOString()}\nCategory: ${file.category}\nTest File: YES\n`
    
    fs.writeFileSync(filePath, fullContent)
    console.log(`✅ Created: ${file.name} (${file.category})`)
  })
  
  console.log(`\n🎉 Created ${testFiles.length} test files in: ${testDir}`)
  console.log(`\n📋 Next Steps:`)
  console.log(`1. Go to: https://40ce5498.spendrule-doc-upload-ui.pages.dev`)
  console.log(`2. Login: henryford_user / HF_Secure_2025`)
  console.log(`3. Upload these test files (drag & drop the test-files folder)`)
  console.log(`4. Watch auto-categorization work`)
  console.log(`5. Test file moving between categories`)
  
  console.log(`\n🔄 Testing File Moves:`)
  console.log(`• Right-click any file → "Move"`)
  console.log(`• Select multiple files → "Move" button`)
  console.log(`• Try moving contracts to invoices folder`)
  console.log(`• Try moving invoices to workflows folder`)
  console.log(`• Test bulk moves across categories`)
}

// Run the script
if (require.main === module) {
  createTestFiles()
}

module.exports = { testFiles, createTestFiles }