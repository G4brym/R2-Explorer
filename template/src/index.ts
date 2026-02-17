import { R2Explorer } from "r2-explorer";

// Read all available configurations here: https://r2explorer.com/getting-started/configuration/
export default R2Explorer({
	readonly: true,
	// basicAuth: {
	// 	username: "username",
	// 	password: "password",
	// },
	buckets: {
		"pathology-bites-audio": {
			publicUrl: "https://pub-9b9085c172ac445ca3d87dec27a0518f.r2.dev",
		},
	},
});
