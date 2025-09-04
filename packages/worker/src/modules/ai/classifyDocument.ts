import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../types";

const ClassifyDocumentInput = z.object({
	filename: z.string(),
	fileData: z.string(), // base64 encoded file
	mimeType: z.string(),
});

interface DocumentClassification {
	category: 'invoices' | 'contracts' | 'workflows' | 'reports' | 'forms' | 'other';
	confidence: number;
	vendor?: string;
	summary?: string;
	extractedData?: {
		documentType?: string;
		amount?: string;
		date?: string;
		vendor?: string;
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
			console.log('🧠 Worker: Starting Cloudflare AI classification for:', data.filename);
			
			// Use Cloudflare Workers AI instead of external Claude API
			const aiResponse = await c.env.AI.run('@cf/llama-3.2-11b-vision-instruct', {
				messages: [{
					role: 'user',
					content: [
						{
							type: 'text',
							text: `Analyze this healthcare document (filename: ${data.filename}). 

Classify the document and extract key information.

Respond with ONLY this JSON format:
{
  "category": "invoices|contracts|workflows|reports|forms|other",
  "confidence": 0.85,
  "vendor": "Company Name if found",
  "summary": "Brief 1-2 sentence summary",
  "extractedData": {
    "documentType": "Medical Invoice",
    "amount": "$1,234.56 if found",
    "date": "2024-03-15 if found",
    "vendor": "Company name",
    "keyEntities": ["key", "terms", "found"]
  }
}

CATEGORIES:
- invoices: Bills, invoices, statements, payments
- contracts: Agreements, MSAs, SOWs, contracts
- workflows: Procedures, processes, diagrams
- reports: Analytics, summaries, reports
- forms: Applications, intake forms, surveys
- other: Everything else`
						},
						{
							type: 'image_url',
							image_url: {
								url: `data:${data.mimeType};base64,${data.fileData}`
							}
						}
					]
				}],
				max_tokens: 512
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
		if (['report', 'analysis', 'summary', 'analytics'].some(k => lower.includes(k))) {
			return { category: 'reports', confidence: 0.6 };
		}
		if (['form', 'application', 'intake', 'survey'].some(k => lower.includes(k))) {
			return { category: 'forms', confidence: 0.6 };
		}
		
		return { category: 'other', confidence: 0.5 };
	}
}