
import { AppContext } from "../../types";
import { OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";

export class SendEmail extends OpenAPIRoute {
  schema = {
		operationId: "post-email-send",
		tags: ["Emails"],
		summary: "Send Email",
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              subject: Str({example: "Look! No servers"}),
              from: z.object({
                email: Str({example: "sender@example.com"}),
                name: Str({example: "Workers - MailChannels integration"}),
              }),
              to: z.object({ email: Str({example: "test@example.com"}), name: Str({example: "Test Recipient"}) }).array(),
              content: z.object({
              }).catchall(z.string()),
            }),
          },
        },
      },
    },
	};

	async handle(c: AppContext) {
		if (c.get('config').readonly === true)
			return Response.json({ msg: "unauthorized" }, { status: 401 });

    // TODO: re-enable this with cloudflare workers
		// const emailResp = await fetch("https://api.mailchannels.net/tx/v1/send", {
		// 	method: "POST",
		// 	headers: {
		// 		"content-type": "application/json",
		// 	},
		// 	body: JSON.stringify({
		// 		personalizations: [
		// 			{
		// 				to: data.body.to,
		// 			},
		// 		],
		// 		from: data.body.from,
		// 		subject: data.body.subject,
		// 		content: [
		// 			{
		// 				type: "text/plain",
		// 				value: data.body.content["text/plain"],
		// 			},
		// 		],
		// 	}),
		// });

    return {
      success: false,
      error: 'unavailable'
    }

		// return { msg: await emailResp.text() };
	}
}
