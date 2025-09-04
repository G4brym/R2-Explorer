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
	extractedData?: {
		documentType?: string;
		amount?: string;
		date?: string;
		vendor?: string;
		serviceType?: string;
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
			
			// Use Cloudflare's text-based AI model for robust document analysis
			// This works with ANY file type by analyzing filename and metadata
			const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
				prompt: `You are a document classification expert. Analyze this file and provide classification with a brief summary.

Filename: ${data.filename}
File Type: ${data.mimeType}
Context: This is a healthcare/business document management system.

Based on the filename and file type, classify this document and provide a brief summary.

CATEGORIES (choose one):
- invoices: Bills, invoices, statements, payments, medical bills
- contracts: Agreements, MSAs, SOWs, contracts, legal documents  
- workflows: Procedures, processes, diagrams, protocols, guidelines
- other: Everything else

EXTRACTION REQUIREMENTS:
- Extract vendor/company name if identifiable from filename
- Identify service type (e.g., "Medical Services", "Legal Services", "Consulting", "IT Support")
- Provide brief summary of document purpose

Respond with ONLY this JSON format:
{
  "category": "invoices|contracts|workflows|other",
  "confidence": 0.90,
  "vendor": "Company/Vendor Name",
  "serviceType": "Type of service provided",
  "summary": "Brief 1-2 sentence description of what this document contains"
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
				vendor: parsed.vendor,
				serviceType: parsed.serviceType,
				summary: parsed.summary,
				extractedData: parsed.extractedData
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
			return { category: 'invoices', confidence: 0.6 };
		}
		if (['contract', 'agreement', 'msa', 'sow', 'terms'].some(k => lower.includes(k))) {
			return { category: 'contracts', confidence: 0.6 };
		}
		if (['workflow', 'process', 'diagram', 'flow', 'procedure'].some(k => lower.includes(k))) {
			return { category: 'workflows', confidence: 0.6 };
		}
		
		return { category: 'other', confidence: 0.5 };
	}
}