import type { MiddlewareHandler } from "hono";
import type { AppContext } from "../../types";

/**
 * Document Auto-Categorization for SpendRule
 * Automatically categorizes uploaded documents based on filename
 */

export type DocumentType = "contracts" | "invoices" | "workflows" | "reports" | "forms" | "other";

export const detectDocumentType = (filename: string): DocumentType => {
	const normalizedName = filename.toLowerCase();

	// Contract keywords
	const contractKeywords = ["contract", "agreement", "msa", "sow", "terms"];
	if (contractKeywords.some((keyword) => normalizedName.includes(keyword))) {
		return "contracts";
	}

	// Invoice keywords
	const invoiceKeywords = ["invoice", "inv", "bill", "statement", "payment"];
	if (invoiceKeywords.some((keyword) => normalizedName.includes(keyword))) {
		return "invoices";
	}

	// Workflow keywords
	const workflowKeywords = ["workflow", "process", "diagram", "flow", "procedure"];
	if (workflowKeywords.some((keyword) => normalizedName.includes(keyword))) {
		return "workflows";
	}

	// Report keywords
	const reportKeywords = ["report", "analysis", "summary", "analytics"];
	if (reportKeywords.some((keyword) => normalizedName.includes(keyword))) {
		return "reports";
	}

	// Form keywords
	const formKeywords = ["form", "application", "intake", "survey"];
	if (formKeywords.some((keyword) => normalizedName.includes(keyword))) {
		return "forms";
	}

	return "other";
};

export const sanitizeFilename = (filename: string): string => {
	// Remove or replace dangerous characters but preserve the original name structure
	return filename
		.replace(/[<>:"/\\|?*]/g, "_") // Replace dangerous chars with underscore
		.replace(/\s+/g, " ") // Normalize whitespace
		.trim();
};

export const autoCategorizationMiddleware: MiddlewareHandler = async (
	c: AppContext,
	next,
) => {
	// Only apply to PUT/POST operations (uploads)
	if (c.req.method === "POST" || c.req.method === "PUT") {
		// Determine incoming key: path param, query param, or JSON body
		let key = c.req.param("key") as string | undefined;
		if (!key) {
			const url = new URL(c.req.url);
			const qKey = url.searchParams.get("key");
			if (qKey) {
				try {
					key = decodeURIComponent(escape(atob(qKey)));
				} catch {
					key = qKey;
				}
			}
		}
		if (!key) {
			try {
				const cloned = c.req.raw.clone();
				const contentType = c.req.header("content-type") || "";
				if (contentType.includes("application/json")) {
					const body = await cloned.json().catch(() => undefined) as any;
					const bodyKey = body?.key ?? body?.newKey ?? body?.to;
					if (bodyKey) {
						try {
							key = decodeURIComponent(escape(atob(bodyKey)));
						} catch {
							key = String(bodyKey);
						}
					}
				}
			} catch {
				// ignore
			}
		}

		const userHealthGroup = c.get("user_health_group");

		if (key && userHealthGroup && userHealthGroup !== "admin") {
			// Extract filename from the key
			const filename = key.split("/").pop() || "";
			const documentType = detectDocumentType(filename);
			const sanitizedFilename = sanitizeFilename(filename);
			const username = c.get("authentication_username") || "unknown_user";

			// Check if the file is being uploaded to the correct category folder
			// New format: health_group/category/filename (no username subfolder)
			const expectedPath = `${userHealthGroup}/${documentType}/`;
			if (!key.startsWith(expectedPath)) {
				// Auto-redirect to the correct category folder
				const newKey = `${expectedPath}${sanitizedFilename}`;
				
				// Store the suggested path for the frontend
				c.set("suggested_path", newKey);
				c.set("document_type", documentType);
				c.set("original_filename", filename);
				c.set("sanitized_filename", sanitizedFilename);
			}

			// Add document metadata
			c.set("document_metadata", {
				healthGroup: userHealthGroup,
				documentType,
				originalFilename: filename,
				sanitizedFilename,
				uploadedAt: new Date().toISOString(),
			});
		}
	}

	await next();
};
