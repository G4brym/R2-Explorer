import { JsonResponse } from './core'
import { ListBucketsCommand } from '@aws-sdk/client-s3'

async function listDisks (request, env, context) {
  const { s3Client } = context

  const data = await s3Client.send(new ListBucketsCommand({}))

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { listDisks }
