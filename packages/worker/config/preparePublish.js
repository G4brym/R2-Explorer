const fs = require("node:fs");

// Apply version numbers
const files = [
	"packages/worker/src/foundation/settings.ts",
	"packages/worker/package.json",
];

for (const file of files) {
	fs.readFile(file, "utf8", (err, data) => {
		if (err) {
			console.log(err);
			process.exit(1);
		}

		const version = process.env.RELEASE_VERSION.replace("v", "");
		const result = data.replace("0.0.1", version);

		fs.writeFile(file, result, "utf8", (err) => {
			if (err) {
				console.log(err);
				process.exit(1);
			}
		});
	});
}
