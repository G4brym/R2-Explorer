import { R2Explorer } from "r2-explorer";

// Read all available configurations here: https://r2explorer.com/getting-started/configuration/
export default R2Explorer({
	readonly: false,
	// Basic Auth: protects /api/* routes with username/password authentication.
	//
	// For GitHub deployments, DO NOT hardcode credentials here — they will be
	// visible in your repository. Instead, add a GitHub Repository Secret named
	// R2EXPLORER_BASIC_AUTH with JSON format:
	//   [{"username":"user1","password":"pass1"},{"username":"user2","password":"pass2"}]
	//
	// For manual/standalone deployments, you can uncomment and set credentials below:
	// basicAuth: [
	// 	{ username: "admin", password: "changeme" },
	// ],
	buckets: {
		"pathology-bites-audio": {
			publicUrl: "https://pub-9b9085c172ac445ca3d87dec27a0518f.r2.dev",
		},
	},
});
