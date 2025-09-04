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
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							filename: z.string(),
							fileData: z.string(),
							mimeType: z.string(),
						}),
					},
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
		const data = await this.getValidatedData<typeof this.schema>();

		console.log('🔍 Received data:', JSON.stringify(data, null, 2));

		// Use filename or default if not provided
		const filename = data.body.filename || 'unknown-document';
		
		// Ensure mimeType is not undefined
		const mimeType = data.body.mimeType || 'application/octet-stream';

		try {
			console.log('🤖 Worker: Starting AI classification for:', filename, 'Type:', mimeType);
			
			// Use vision model to analyze file directly - no text extraction needed!
			const isImageFile = mimeType.startsWith('image/');
			let aiResponse;
			
			if (data.body.fileData && data.body.fileData.trim() && isImageFile) {
				console.log('📸 Using vision model for image analysis');
				// Use Llama Vision model for direct image analysis
				aiResponse = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
					messages: [
						{
							role: 'user',
							content: [
								{
									type: 'text',
									text: `Analyze this business document image and extract key information.

DOCUMENT NAME: ${filename}
FILE TYPE: ${mimeType}

Based on what you can see in this document, provide ONLY the following information (write "UNKNOWN" if not found):

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
								},
								{
									type: 'image_url',
									image_url: {
										url: `data:${mimeType};base64,${data.body.fileData}`
									}
								}
							]
						}
					],
					max_tokens: 500
				});
			} else {
				console.log('📄 Using text model for filename/fallback analysis');
				// For non-images or when no file data, use text model
				aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
					prompt: `Analyze this file and provide business document classification.

DOCUMENT NAME: ${filename}
FILE TYPE: ${mimeType}

Based on the filename and file type, classify this document:

DOCUMENT TYPE: [Must be one of: invoices, contracts, workflows, other]
VENDOR: [Company name if identifiable from filename]
AMOUNT: [UNKNOWN - cannot determine from filename alone]
DUE DATE: [UNKNOWN - cannot determine from filename alone]
SERVICE TYPE: [General service type if identifiable]
PRIORITY: [NORMAL - cannot determine urgency from filename alone]
SUMMARY: [Brief description based on filename]

Respond with ONLY this JSON format:
{
  "category": "invoices|contracts|workflows|other",
  "confidence": 0.60,
  "vendor": "Company/Vendor Name or UNKNOWN",
  "amount": "UNKNOWN", 
  "dueDate": "UNKNOWN",
  "serviceType": "Type of service or UNKNOWN",
  "priority": "NORMAL",
  "summary": "Brief description based on filename"
}`
				});
			}

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
					result: this.classifyByFilename(filename)
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
				result: this.classifyByFilename(filename)
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