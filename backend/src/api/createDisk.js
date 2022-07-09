import { JsonResponse } from './core'
import { CreateBucketCommand } from '@aws-sdk/client-s3'

async function createDisk (request, env, context) {
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)
  const { disk } = request.params

  const command = new CreateBucketCommand({
    Bucket: disk
  })

  const data = await s3Client.send(command)

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { createDisk }
