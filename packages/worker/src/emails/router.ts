import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { config } from "../settings";
import { SendEmail } from "./api/sendEmail";

export const emailsRouter = OpenAPIRouter({
	base: "/api/emails",
	raiseUnknownParameters: config.raiseUnknownParameters,
	generateOperationIds: config.generateOperationIds,
});

emailsRouter.post("/send", SendEmail);
