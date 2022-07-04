import { JsonResponse } from './core'
import { ListBucketsCommand } from '@aws-sdk/client-s3'

async function listDisks (request, env, context) {
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)

  const email = request.headers.get('Cf-Access-Authenticated-User-Email')
  const data = await s3Client.send(new ListBucketsCommand({}))

  return JsonResponse({ user: email, ...data }, data.$metadata.httpStatusCode)
}

export { listDisks }
