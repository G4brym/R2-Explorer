/**
 * AI-Powered Document Classification for SpendRule
 * Uses Claude (Anthropic) for analysis and Google Gemini Flash for OCR
 */

interface DocumentClassification {
  category: 'invoices' | 'contracts' | 'workflows' | 'other'
  confidence: number
  vendor?: string
  serviceType?: string
  summary?: string
  amount?: string
  dueDate?: string
  priority?: 'URGENT' | 'HIGH' | 'NORMAL'
  extractedData?: {
    patientId?: string
    date?: string
    amount?: string
    vendor?: string
    serviceType?: string
    documentType?: string
    priority?: string
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
  console.log('🤖 AI document classification for:', filename, 'Type:', file.type)
  
  try {
    // Import API helper
    const { api } = await import('@/lib/api')
    
    // Convert file to base64 for content analysis
    console.log('📄 Converting file to base64 for content analysis...')
    const base64Data = await fileToBase64(file)
    
    // Send file content to worker for AI analysis
    console.log('🚀 Sending file content to AI worker...')
    const response = await api.post('/ai/classify', {
      filename,
      fileData: base64Data, // Send actual file content for analysis
      mimeType: file.type
    })
    
    console.log('📥 AI response:', response.data)
    
    if (response.data?.success && response.data?.result) {
      return response.data.result
    } else {
      // Fallback to filename classification
      console.log('🔄 AI failed, using filename fallback')
      return classifyByFilename(filename)
    }
    
  } catch (error) {
    console.warn('❌ AI classification error:', error)
    return classifyByFilename(filename)
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




function classifyByFilename(filename: string): DocumentClassification {
  const lower = filename.toLowerCase()
  
  if (['invoice', 'inv', 'bill', 'statement', 'payment'].some(k => lower.includes(k))) {
    return { 
      category: 'invoices', 
      confidence: 0.6,
      summary: 'Invoice document identified by filename. Manual review recommended.',
      priority: 'NORMAL'
    }
  }
  if (['contract', 'agreement', 'msa', 'sow', 'terms'].some(k => lower.includes(k))) {
    return { 
      category: 'contracts', 
      confidence: 0.6,
      summary: 'Contract document identified by filename. Manual review recommended.',
      priority: 'NORMAL'
    }
  }
  if (['workflow', 'process', 'diagram', 'flow', 'procedure'].some(k => lower.includes(k))) {
    return { 
      category: 'workflows', 
      confidence: 0.6,
      summary: 'Workflow document identified by filename. Manual review recommended.',
      priority: 'NORMAL'
    }
  }
  // Forms are now classified as 'other' or more specific categories
  
  return { 
    category: 'other', 
    confidence: 0.5,
    summary: 'Document uploaded. Manual classification required.',
    priority: 'NORMAL'
  }
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
  other: 'other'
} as const