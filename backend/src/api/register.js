import { getS3, JsonResponse } from './core'
import { ListBucketsCommand } from '@aws-sdk/client-s3'

async function registerEmail (request, env, context) {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email') || 'g4bryrm98@gmail.com'
  const body = await request.json()
  const { accountId, accessToken, secretToken } = body

  const s3Client = getS3(accountId, accessToken, secretToken)
  console.log(body)
  // Test the credentials
  try {
    await s3Client.send(new ListBucketsCommand({}))
  } catch (err) {
    console.log(err)
    return JsonResponse({ result: 'unauthorized' }, 401)
  }

  await env.WEB_DRIVE.put(email, JSON.stringify({
    accountId, accessToken, secretToken
  }))

  return JsonResponse({ result: 'success' })
}

export { registerEmail }
