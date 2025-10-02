/**
 * SpendRule Document Management System
 * Built on R2-Explorer framework
 */
import { R2Explorer } from "../src";

// SpendRule-specific configuration
const spendRuleConfig = {
	readonly: false, // Allow uploads
	cors: true, // Enable CORS for web interface
	showHiddenFiles: true, // Show hidden files for admin debugging
	
	// SpendRule authentication configuration
	basicAuth: [
		{
			username: "henryford_user",
			password: "HF_Secure_2025", // Henry Ford Health user
		},
		{
			username: "kettering_user",
			password: "Kettering_Secure_2025", // Kettering Health user
		},
		{
			username: "osf_user",
			password: "OSF_Secure_2025", // OSF HealthCare user
		},
		{
			username: "endeavor_user",
			password: "Endeavor_Secure_2025", // Endeavor Health user
		},
		{
			username: "memorialcare_user",
			password: "MemorialCare_Secure_2025", // MemorialCare user
		},
		{
			username: "musc_user",
			password: "MUSC_Secure_2025", // MUSC Health user
		},
		{
			username: "confluence_user",
			password: "Confluence_Secure_2025", // Confluence Health user
		},
		{
			username: "christianacare_user",
			password: "ChristianaCare_Secure_2025", // ChristianaCare user
		},
		{
			username: "advocate_user",
			password: "Advocate_Secure_2025", // Advocate user
		},
		{
			username: "test_user",
			password: "Test_Secure_2025", // Test user for testing
		},
		{
			username: "spendrule_admin",
			password: "Admin_2025", // Admin user with full access
		},
	],

	// Email routing disabled for initial deployment
	emailRouting: false,
};

export default {
	async email(event, env, context) {
		const explorer = R2Explorer(spendRuleConfig);
		return await explorer.email(event, env, context);
	},
	async fetch(request, env, context) {
		const url = new URL(request.url);
		
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}
		
		// Only handle API routes, let dashboard be served separately
		if (url.pathname.startsWith('/api/')) {
			try {
				const explorer = R2Explorer(spendRuleConfig);
				const response = await explorer.fetch(request, env, context);
				
				// Add CORS headers to API responses
				response.headers.set('Access-Control-Allow-Origin', '*');
				response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
				response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
				
				return response;
			} catch (error) {
				// Return error with CORS headers
				return new Response(JSON.stringify({
					error: error.message,
					path: url.pathname,
					method: request.method
				}), {
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					},
				});
			}
		}
		
		// For non-API routes, return info about the API
		return new Response(JSON.stringify({
			message: "SpendRule Document Management API",
			version: "1.0.0",
			endpoints: {
				server_config: "/api/server/config",
				list_files: "/api/buckets/secure-uploads",
				upload_file: "/api/buckets/secure-uploads/upload",
				download_file: "/api/buckets/secure-uploads/{key}",
				delete_file: "/api/buckets/secure-uploads/delete",
				create_folder: "/api/buckets/secure-uploads/folder",
			},
			test_endpoints: {
				"GET /api/server/config": "Server configuration and auth info",
				"GET /api/buckets/secure-uploads": "List files (requires auth)",
				"GET /api/buckets/secure-uploads/{key}": "Download file (requires auth)",
				"POST /api/buckets/secure-uploads/upload": "Upload file (requires auth)",
			},
			dashboard: "Deploy dashboard separately on Cloudflare Pages",
			authentication: "Basic Auth required for all API endpoints"
		}), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		});
	},
};
