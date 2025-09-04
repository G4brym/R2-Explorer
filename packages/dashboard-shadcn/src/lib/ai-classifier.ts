/**
 * AI-Powered Document Classification for SpendRule
 * Uses Claude (Anthropic) for analysis and Google Gemini Flash for OCR
 */

interface DocumentClassification {
  category: 'invoices' | 'contracts' | 'workflows' | 'reports' | 'forms' | 'other'
  confidence: number
  vendor?: string
  summary?: string
  extractedData?: {
    patientId?: string
    date?: string
    amount?: string
    vendor?: string
    documentType?: string
    keyEntities?: string[]
  }
}

interface AIConfig {
  claudeApiKey?: string
  geminiApiKey?: string
  enabled: boolean
}

// Configuration - Always enabled since API key is in worker
const aiConfig: AIConfig = {
  claudeApiKey: undefined, // API key handled by worker
  geminiApiKey: undefined, // Not using Gemini
  enabled: true // Always enabled, worker will handle fallback
}

export async function classifyDocumentWithAI(
  file: File,
  filename: string
): Promise<DocumentClassification> {
  // Debug logging
  console.log('🧠 AI Config:', {
    enabled: aiConfig.enabled,
    useWorkerProxy: true,
    filename: filename
  })
  
  // Fallback to filename-based classification
  const filenameResult = classifyByFilename(filename)
  
  if (!aiConfig.enabled) {
    console.log('❌ AI disabled')
    return filenameResult
  }
  
  try {
    // Handle different file types
    if (file.type === 'application/pdf') {
      // For PDFs: Use Claude Vision API directly
      return await analyzeWithClaudeVision(file, filename)
    } else if (file.type.startsWith('image/')) {
      // For images: Use Claude Vision API
      return await analyzeWithClaudeVision(file, filename)
    } else {
      // For other files: Extract text first, then analyze
      const extractedText = await extractWithPdfParse(file)
      return await analyzeWithClaudeText(extractedText, filename)
    }
  } catch (error) {
    console.warn('AI classification failed, using filename fallback:', error)
    return filenameResult
  }
}

// Simple PDF text extraction using pdf-parse

// Fallback text extraction using pdf-parse
async function extractWithPdfParse(pdfFile: File): Promise<string> {
  try {
    // Dynamic import to avoid loading pdf-parse unless needed
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js')
    const arrayBuffer = await pdfFile.arrayBuffer()
    const data = await pdfParse.default(arrayBuffer, { max: 3 }) // Only first 3 pages
    return data.text
  } catch (error) {
    console.warn('PDF parsing failed:', error)
    return "Could not extract text from PDF"
  }
}


// Claude Vision API via Worker Proxy - handles PDFs, images, and scanned documents
async function analyzeWithClaudeVision(file: File, filename: string): Promise<DocumentClassification> {
  try {
    console.log('📄 Starting Claude Vision analysis via worker for:', filename, 'Type:', file.type)
    const base64Data = await fileToBase64(file)
    const mediaType = file.type === 'application/pdf' ? 'application/pdf' : file.type
    
    // Import API helper
    const { api } = await import('@/lib/api')
    
    console.log('🚀 Making API call to worker proxy...')
    const response = await api.post('/ai/classify', {
      filename,
      fileData: base64Data,
      mimeType: mediaType
    })
    
    console.log('📥 Worker proxy response:', response.data)
    
    const result = response.data.result
    console.log('✅ Worker AI result:', result)

    return {
      category: result.category || 'other',
      confidence: result.confidence || 0.7,
      vendor: result.vendor,
      summary: result.summary,
      extractedData: result.extractedData
    }
  } catch (error) {
    console.error('🚨 Worker AI analysis failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return classifyByFilename(filename)
  }
}

// Text-only analysis for non-visual files
async function analyzeWithClaudeText(text: string, filename: string): Promise<DocumentClassification> {
  const prompt = `
Analyze this healthcare document and provide classification:

DOCUMENT TEXT:
${text.substring(0, 2000)} // Limit to ~2000 chars to save tokens

FILENAME: ${filename}

Please respond with ONLY a JSON object in this exact format:
{
  "category": "invoices|contracts|workflows|reports|forms|other",
  "confidence": 0.85,
  "vendor": "Company Name if found",
  "summary": "Brief 1-2 sentence summary of document purpose",
  "extractedData": {
    "documentType": "Medical Invoice",
    "amount": "$1,234.56",
    "date": "2024-03-15",
    "vendor": "Medical Supply Co",
    "keyEntities": ["patient care", "medical supplies", "Q1 2024"]
  }
}

CLASSIFICATION RULES:
- invoices: Bills, invoices, statements, payment requests
- contracts: Agreements, MSAs, SOWs, service contracts  
- workflows: Process documents, procedures, diagrams
- reports: Analytics, summaries, performance reports
- forms: Applications, intake forms, surveys
- other: Everything else

Focus on healthcare context. Be confident in classification.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': aiConfig.claudeApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast and cost-effective
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })
    
    const result = await response.json()
    const aiResponse = result.content?.[0]?.text || '{}'
    
    // Parse Claude's JSON response
    const parsed = JSON.parse(aiResponse)
    return {
      category: parsed.category || 'other',
      confidence: parsed.confidence || 0.7,
      vendor: parsed.vendor,
      summary: parsed.summary,
      extractedData: parsed.extractedData
    }
  } catch (error) {
    console.error('Claude analysis failed:', error)
    // Return filename-based fallback
    return classifyByFilename(filename)
  }
}

function classifyByFilename(filename: string): DocumentClassification {
  const lower = filename.toLowerCase()
  
  if (['invoice', 'inv', 'bill', 'statement', 'payment'].some(k => lower.includes(k))) {
    return { category: 'invoices', confidence: 0.6 }
  }
  if (['contract', 'agreement', 'msa', 'sow', 'terms'].some(k => lower.includes(k))) {
    return { category: 'contracts', confidence: 0.6 }
  }
  if (['workflow', 'process', 'diagram', 'flow', 'procedure'].some(k => lower.includes(k))) {
    return { category: 'workflows', confidence: 0.6 }
  }
  if (['report', 'analysis', 'summary', 'analytics'].some(k => lower.includes(k))) {
    return { category: 'reports', confidence: 0.6 }
  }
  if (['form', 'application', 'intake', 'survey'].some(k => lower.includes(k))) {
    return { category: 'forms', confidence: 0.6 }
  }
  
  return { category: 'other', confidence: 0.5 }
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove data:mime-type;base64, prefix
      resolve(base64.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Enhanced categorization for health groups
export const HEALTH_GROUP_CATEGORIES = {
  invoices: 'invoices',
  contracts: 'contracts', 
  workflows: 'workflows',
  reports: 'reports',
  forms: 'forms',
  other: 'other'
} as const