// Simple script to agree to Meta's Llama 3.2 license terms
// Run this once to enable the superior Llama 3.2-Vision model

const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";
const ACCOUNT_ID = "484a9ce3fd2308c387998c60ae605819";

async function agreeToMetaLicense() {
  try {
    console.log('🤝 Agreeing to Meta Llama 3.2 license terms...');
    
    const response = await fetch(`${CLOUDFLARE_API_URL}/accounts/${ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to get your API token from Cloudflare Dashboard
        'Authorization': 'Bearer YOUR_API_TOKEN_HERE'
      },
      body: JSON.stringify({
        prompt: "agree"
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully agreed to Meta license terms!');
      console.log('🚀 You can now use @cf/meta/llama-3.2-11b-vision-instruct');
    } else {
      console.log('❌ Error:', result.errors);
      console.log('💡 Try using the Cloudflare Dashboard to agree to terms manually');
    }
    
  } catch (error) {
    console.error('🚨 Failed to agree to license:', error);
    console.log('💡 Alternative: Go to Cloudflare Dashboard > Workers AI > Find Llama 3.2-Vision model');
  }
}

// Uncomment and add your API token to run:
// agreeToMetaLicense();

console.log(`
🎯 To agree to Meta Llama 3.2 license terms:

OPTION 1 - Via Cloudflare Dashboard (Easiest):
1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages > Workers AI
3. Find "Llama 3.2-11B Vision Instruct" model
4. Click to try it and agree to the terms

OPTION 2 - Via API:
1. Get your API token from Cloudflare Dashboard > My Profile > API Tokens
2. Replace YOUR_API_TOKEN_HERE in this file
3. Uncomment the last line and run: node agree-to-meta-license.js

OPTION 3 - Test via our worker:
Just try uploading a document - the first call will prompt for agreement!
`);