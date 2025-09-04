import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

const ClassifyDocumentInput = z.object({
	filename: z.string(),
	fileData: z.string(), // base64 encoded file
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
			
			// Enhanced AI analysis with improved data extraction
			const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				prompt: `Analyze this document and extract key business information.

DOCUMENT NAME: ${data.filename}
FILE TYPE: ${data.mimeType}
CONTEXT: This is a business/healthcare document management system.

Provide ONLY the following information (write "UNKNOWN" if not found):

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