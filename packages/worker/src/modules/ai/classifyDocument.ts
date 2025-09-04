import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

const ClassifyDocumentInput = z.object({
	filename: z.string(),
	fileData: z.string(), // base64 encoded file content for AI analysis
	mimeType: z.string(),
});

interface DocumentClassification {
	category: 'invoices' | 'contracts' | 'workflows' | 'other';
	confidence: number;
	vendor?: string;
	serviceType?: string;
	summary?: string;
	amount?: string;
	dueDate?: string;
	priority?: 'URGENT' | 'HIGH' | 'NORMAL';
	extractedData?: {
		documentType?: string;
		amount?: string;
		date?: string;
		vendor?: string;
		serviceType?: string;
		priority?: string;
		keyEntities?: string[];
	};
}

export class ClassifyDocument extends OpenAPIRoute {
	schema = {
		operationId: "classify-document",
		tags: ["AI"],
		summary: "Classify document using Claude AI",
		requestBody: {
			content: {
				"application/json": {
					schema: ClassifyDocumentInput,
				},
			},
		},
		responses: {
			"200": {
				description: "Document classification result",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: z.object({
								category: z.string(),
								confidence: z.number(),
								vendor: z.string().optional(),
								summary: z.string().optional(),
								extractedData: z.object({}).optional(),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof ClassifyDocumentInput>();

		try {
			console.log('🤖 Worker: Starting AI classification for:', data.filename, 'Type:', data.mimeType);
			
			// Extract text content from file based on type
			let extractedText = '';
			
			if (data.fileData && data.fileData.trim()) {
				try {
					// Decode base64 file data
					const fileBuffer = Uint8Array.from(atob(data.fileData), c => c.charCodeAt(0));
					extractedText = await this.extractTextFromFile(fileBuffer, data.mimeType, data.filename);
				} catch (error) {
					console.warn('Failed to extract text from file:', error);
					extractedText = `[Could not extract text from ${data.mimeType} file]`;
				}
			}
			
			// Fallback to filename analysis if no text extracted
			if (!extractedText || extractedText.includes('[Could not extract text')) {
				console.log('📄 Using filename-based analysis as fallback');
				extractedText = `Filename: ${data.filename} (${data.mimeType})`;
			}
			
			// Enhanced AI analysis with actual document content
			const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				prompt: `Analyze this document and extract key business information.

DOCUMENT NAME: ${data.filename}
FILE TYPE: ${data.mimeType}
DOCUMENT CONTENT: ${extractedText.slice(0, 6000)}

Based on the actual document content above, provide ONLY the following information (write "UNKNOWN" if not found):

DOCUMENT TYPE: [Must be one of: invoices, contracts, workflows, other]
VENDOR: [Company name providing services]
AMOUNT: [Dollar amount if invoice or contract - include $ symbol]
DUE DATE: [Payment due date or contract end date if applicable]
SERVICE TYPE: [What service or product this relates to]
PRIORITY: [URGENT if due within 7 days, HIGH if within 30 days, otherwise NORMAL]
SUMMARY: [First sentence: What this document is. Second sentence: What action is needed.]

Respond with ONLY this JSON format:
{
  "category": "invoices|contracts|workflows|other",
  "confidence": 0.90,
  "vendor": "Company/Vendor Name or UNKNOWN",
  "amount": "$1,234.56 or UNKNOWN", 
  "dueDate": "March 15, 2025 or UNKNOWN",
  "serviceType": "Type of service provided or UNKNOWN",
  "priority": "URGENT|HIGH|NORMAL",
  "summary": "Brief description of document and required action"
}`
			});

			console.log('📥 Worker: Cloudflare AI response:', aiResponse);
			
			// Parse the response - it should be JSON
			let parsed;
			try {
				const responseText = aiResponse.response || aiResponse.content || aiResponse;
				parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
			} catch (parseError) {
				console.warn('Failed to parse AI response as JSON, using fallback');
				return {
					success: false,
					error: "AI response was not valid JSON",
					result: this.classifyByFilename(data.filename)
				};
			}

			console.log('✅ Worker: Parsed AI result:', parsed);

			const classification: DocumentClassification = {
				category: parsed.category || 'other',
				confidence: parsed.confidence || 0.7,
				vendor: parsed.vendor && parsed.vendor !== 'UNKNOWN' ? parsed.vendor : undefined,
				serviceType: parsed.serviceType && parsed.serviceType !== 'UNKNOWN' ? parsed.serviceType : undefined,
				summary: parsed.summary,
				amount: parsed.amount && parsed.amount !== 'UNKNOWN' ? parsed.amount : undefined,
				dueDate: parsed.dueDate && parsed.dueDate !== 'UNKNOWN' ? parsed.dueDate : undefined,
				priority: parsed.priority || 'NORMAL',
				extractedData: {
					documentType: parsed.category,
					amount: parsed.amount && parsed.amount !== 'UNKNOWN' ? parsed.amount : undefined,
					date: parsed.dueDate && parsed.dueDate !== 'UNKNOWN' ? parsed.dueDate : undefined,
					vendor: parsed.vendor && parsed.vendor !== 'UNKNOWN' ? parsed.vendor : undefined,
					serviceType: parsed.serviceType && parsed.serviceType !== 'UNKNOWN' ? parsed.serviceType : undefined,
					priority: parsed.priority || 'NORMAL',
					keyEntities: [parsed.vendor, parsed.serviceType].filter(Boolean)
				}
			};

			return {
				success: true,
				result: classification
			};

		} catch (error) {
			console.error('🚨 Worker: Cloudflare AI call failed:', error);
			
			// Return filename-based fallback
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				result: this.classifyByFilename(data.filename)
			};
		}
	}

	private async extractTextFromFile(fileBuffer: Uint8Array, mimeType: string, filename: string): Promise<string> {
		try {
			// Handle different file types
			if (mimeType.includes('text/') || filename.endsWith('.txt')) {
				// Plain text files
				const decoder = new TextDecoder();
				return decoder.decode(fileBuffer);
			}
			
			if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
				// For PDFs, we'd need a PDF parsing library
				// For now, return a placeholder that indicates we need PDF support
				return '[PDF content extraction not yet implemented - add PDF parsing library]';
			}
			
			if (mimeType.startsWith('image/')) {
				// For images, we'd need OCR
				// For now, return a placeholder that indicates we need OCR
				return '[Image OCR not yet implemented - add OCR capability]';
			}
			
			if (mimeType.includes('application/vnd.openxmlformats') || filename.endsWith('.docx')) {
				// Word documents would need specific parsing
				return '[Word document parsing not yet implemented]';
			}
			
			if (mimeType.includes('application/vnd.ms-excel') || filename.endsWith('.xlsx')) {
				// Excel files would need specific parsing  
				return '[Excel parsing not yet implemented]';
			}
			
			// Try to decode as text for unknown types
			const decoder = new TextDecoder();
			const text = decoder.decode(fileBuffer);
			
			// Check if it looks like readable text (not binary)
			const printableChars = text.match(/[\x20-\x7E\s]/g) || [];
			if (printableChars.length / text.length > 0.7) {
				return text;
			}
			
			return `[Cannot extract text from ${mimeType} file type]`;
			
		} catch (error) {
			console.error('Text extraction error:', error);
			return `[Error extracting text from ${mimeType}: ${error.message}]`;
		}
	}

	private classifyByFilename(filename: string): DocumentClassification {
		const lower = (filename || 'unknown').toLowerCase();
		
		if (['invoice', 'inv', 'bill', 'statement', 'payment'].some(k => lower.includes(k))) {
			return { 
				category: 'invoices', 
				confidence: 0.6,
				summary: 'Invoice document uploaded. Manual review required for amount and due date.',
				priority: 'NORMAL'
			};
		}
		if (['contract', 'agreement', 'msa', 'sow', 'terms'].some(k => lower.includes(k))) {
			return { 
				category: 'contracts', 
				confidence: 0.6,
				summary: 'Contract document uploaded. Manual review required for terms and dates.',
				priority: 'NORMAL'
			};
		}
		if (['workflow', 'process', 'diagram', 'flow', 'procedure'].some(k => lower.includes(k))) {
			return { 
				category: 'workflows', 
				confidence: 0.6,
				summary: 'Workflow document uploaded. Manual review required for process details.',
				priority: 'NORMAL'
			};
		}
		
		return { 
			category: 'other', 
			confidence: 0.5,
			summary: 'Document uploaded. Manual classification and review required.',
			priority: 'NORMAL'
		};
	}
}