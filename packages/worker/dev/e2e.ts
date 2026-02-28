import { R2Explorer } from "../src";

export default {
	async fetch(request, env, context) {
		return R2Explorer({
			readonly: false,
			cors: true,
			showHiddenFiles: true,
		}).fetch(request, env, context);
	},
};
