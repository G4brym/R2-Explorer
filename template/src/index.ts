import { R2Explorer } from "r2-explorer";

// Read all available configurations here: https://r2explorer.com/getting-started/configuration/
export default R2Explorer({
	// Authentication mode:
	// - 'session': Session-based auth with D1 database (default)
	// - 'disabled': No authentication - public access
	// - { mode: 'cloudflare-access', teamName: 'your-team' }: Use Cloudflare Access
	auth: "session",

	// Allow write operations (upload, delete, move files)
	readonly: false,

	// Enable CORS headers
	// cors: true,
});
