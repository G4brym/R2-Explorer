import { R2Explorer } from "../../worker/src";

export default {
	async fetch(request, env, context) {
		return R2Explorer({
			readonly: false,
			cors: true,
		}).fetch(request, env, context);
	},
};
