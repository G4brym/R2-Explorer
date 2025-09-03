# SpendRule AI-Powered Document Classification Setup

## Overview
The SpendRule system now includes AI-powered document classification that can:
- ✨ **Smart Categorization**: Analyze PDF content (not just filenames)
- 🏥 **Healthcare Focus**: Optimized for medical documents
- 👁️ **OCR Integration**: Google Gemini Flash for excellent text extraction
- 🧠 **Smart Analysis**: Claude (Anthropic) for document understanding
- 📊 **Rich Metadata**: Extract vendors, amounts, dates, summaries
- 💰 **Cost Effective**: Only analyzes first 3 pages to minimize tokens

## AI Service Used

### Claude 3 Haiku (Vision + Analysis)
- **Purpose**: OCR, document classification, and metadata extraction
- **Why**: Excellent vision capabilities + healthcare document understanding
- **Usage**: Directly analyzes PDFs and images (including scanned documents)
- **Handles**: PDFs, JPG, PNG, GIF, WebP images

## Setup Instructions

### Step 1: Get API Keys

#### Claude API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create account / Sign in
3. Navigate to API Keys
4. Create new key
5. Copy the key (starts with `sk-ant-api03-...`)

#### Google Gemini API Key  
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key

### Step 2: Configure Environment Variables

Create `.env.local` file in `/packages/dashboard-shadcn/`:

```bash
# Claude API Key (required for classification)
VITE_CLAUDE_API_KEY=sk-ant-api03-your-claude-key-here

# Google Gemini API Key (optional, fallback to pdf-parse)
VITE_GEMINI_API_KEY=your-gemini-key-here

# API Base URL
VITE_API_BASE_URL=https://your-worker.workers.dev
```

### Step 3: Test the Setup

1. Upload a PDF with "invoice" in filename
2. System will:
   - Extract text using Gemini OCR (first 3 pages)
   - Analyze with Claude for classification
   - Show result: "AI classified as invoices: Medical equipment invoice for Q1 supplies"

## Enhanced Categories

The AI system now supports 6 categories:
- **invoices**: Bills, invoices, statements, payment requests
- **contracts**: Agreements, MSAs, SOWs, service contracts  
- **workflows**: Process documents, procedures, diagrams
- **reports**: Analytics, summaries, performance reports
- **forms**: Applications, intake forms, surveys
- **other**: Everything else

## AI Features

### Smart Classification
- Analyzes actual document content, not just filename
- Healthcare-optimized prompts
- High confidence thresholds (>70%) for AI results

### Metadata Extraction
- **Vendor**: Company/organization names
- **Amounts**: Dollar amounts and financial data
- **Dates**: Key dates in documents
- **Summary**: 1-2 sentence description
- **Key Entities**: Important terms and concepts

### Fallback System
- No API keys? → Filename-based classification
- Gemini fails? → pdf-parse text extraction
- Claude fails? → Filename classification
- Non-PDF files? → Filename classification

## Cost Management

### Token Optimization
- Only first 3 pages analyzed (saves 70%+ tokens)
- Text limited to 2000 chars for Claude
- Uses Claude Haiku (most cost-effective)
- Gemini Flash (fastest, cheapest OCR)

### Expected Costs
- **Per Document**: ~$0.01-0.03
- **1000 docs/month**: ~$10-30
- **Enterprise scale**: Very affordable

## Production Deployment

### Environment Variables (Production)
```bash
# Add to your hosting platform (Vercel, Netlify, etc.)
VITE_CLAUDE_API_KEY=sk-ant-api03-...
VITE_GEMINI_API_KEY=...
VITE_API_BASE_URL=https://your-production-worker.workers.dev
```

### Security Considerations
- API keys are client-side (consider proxy for production)
- Rate limiting recommended for API calls
- Monitor usage and costs

## Monitoring & Analytics

### Success Indicators
- Classification confidence >70%
- Vendor extraction accuracy
- User satisfaction with auto-categorization

### Logs to Monitor
- AI classification results
- Fallback usage rates  
- API response times
- Error rates

## Demo Scenarios

### Test Files to Try
Upload PDFs with these characteristics:

1. **Medical Invoice**: Should detect vendor, amount, categorize as "invoices"
2. **Service Contract**: Should identify as "contracts", extract vendor
3. **Lab Report**: Should categorize as "reports", provide summary
4. **Patient Form**: Should identify as "forms"

## Troubleshooting

### Common Issues
1. **No API keys**: System falls back to filename classification
2. **Large PDFs**: Only first 3 pages analyzed (by design)
3. **Image-only PDFs**: Gemini OCR should handle well
4. **API limits**: Check usage quotas

### Debug Mode
Add to console to see AI processing:
```javascript
localStorage.setItem('debug-ai', 'true')
```

## Future Enhancements

### Possible Additions
- Custom healthcare entity recognition
- Integration with EHR systems
- Batch processing for historical documents
- Advanced compliance checking
- Custom classification rules per health group

The AI system is designed to grow with your needs while maintaining cost efficiency and privacy standards.