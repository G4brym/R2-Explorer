import {getCurrentTimestampMilliseconds} from "../dates";
import {Context} from "../interfaces";
import PostalMime from 'postal-mime';

async function streamToArrayBuffer(stream, streamSize) {
  let result = new Uint8Array(streamSize);
  let bytesRead = 0;
  const reader = stream.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }
    result.set(value, bytesRead);
    bytesRead += value.length;
  }
  return result;
}

export async function receiveEmail(event, env, ctx: Context) {
  let bucket = undefined

  if (ctx.config?.emailRouting?.targetBucket && env[ctx.config.emailRouting.targetBucket]) {
    bucket = env[ctx.config.emailRouting.targetBucket]
  }

  if (!bucket) {
    // Bucket not set, default to first defined
    for (const [key, value] of Object.entries(env)) {
      // @ts-ignore
      if (value.get && value.put) {
        bucket = value
        break
      }
    }
  }

  const rawEmail = await streamToArrayBuffer(event.raw, event.rawSize);
  const parser = new PostalMime()
  const parsedEmail = await parser.parse(rawEmail);

  const emailPath = `${getCurrentTimestampMilliseconds()}-${crypto.randomUUID()}`

  await bucket.put(`.r2-explorer/emails/inbox/${emailPath}.json`, JSON.stringify(parsedEmail), {
    customMetadata: {
      subject: parsedEmail.subject,
      from_address: parsedEmail.from?.address,
      from_name: parsedEmail.from?.name,
      to_address: (parsedEmail.to.length > 0) ? parsedEmail.to[0].address : null,
      to_name: (parsedEmail.to.length > 0) ? parsedEmail.to[0].name : null,
      has_attachments: parsedEmail.attachments.length > 0,
      read: false,
      timestamp: Date.now()
    }
  })

  for (const att of parsedEmail.attachments) {
    await bucket.put(`.r2-explorer/emails/inbox/${emailPath}/${att.filename}`, att.content)
  }
}
