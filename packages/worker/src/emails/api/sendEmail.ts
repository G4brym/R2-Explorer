import { OpenAPIRoute } from "@cloudflare/itty-router-openapi";
import { Context } from "../../interfaces";
import { OpenAPIRouteSchema } from "@cloudflare/itty-router-openapi/dist/src/types";

export class SendEmail extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    operationId: "post-email-send",
    tags: ["Emails"],
    summary: "Send Email",
    requestBody: {
      subject: "Look! No servers",
      from: {
        email: "sender@example.com",
        name: "Workers - MailChannels integration"
      },
      to: [{ email: "test@example.com", name: "Test Recipient" }],
      content: {
        "text/plain": "And no email service accounts and all for free too!"
      }
    }
  };

  async handle(
    request: Request,
    env: any,
    context: Context,
    data: any
  ) {
    if (context.config.readonly === true) return Response.json({ msg: "unauthorized" }, { status: 401 });

    const emailResp = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: data.body.to
          }
        ],
        from: data.body.from,
        subject: data.body.subject,
        content: [
          {
            type: "text/plain",
            value: data.body.content["text/plain"]
          }
        ]
      })
    });

    return { msg: await emailResp.text() };
  }
}
