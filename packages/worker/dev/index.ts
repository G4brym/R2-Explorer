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
			username: "spendrule_admin", 
			password: "Admin_2025", // Admin user with full access
		},
	],

	// Email routing disabled for initial deployment
	emailRouting: false,
};

export default {
	async email(event, env, context) {
		await R2Explorer(spendRuleConfig).email(event, env, context);
	},
	async fetch(request, env, context) {
		return R2Explorer(spendRuleConfig).fetch(request, env, context);
	},
};
