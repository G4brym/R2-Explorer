import { config } from "../settings";
import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { SendEmail } from "./api/sendEmail";


export const emailsRouter = OpenAPIRouter({
  base: "/api/emails",
  raiseUnknownParameters: config.raiseUnknownParameters,
  generateOperationIds: config.generateOperationIds
});

emailsRouter.post("/send", SendEmail);
