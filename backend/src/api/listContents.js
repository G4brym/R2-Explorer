import { JsonResponse } from './core'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

async function listContents (request, env, context) {
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)
  const { disk } = request.params
  const { path } = request.query || ''

  const data = await s3Client.send(new ListObjectsV2Command({
    Bucket: disk,
    Prefix: path,
    Delimiter: '/'
  }))

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { listContents }
