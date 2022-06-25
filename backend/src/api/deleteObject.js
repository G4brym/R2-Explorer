import { JsonResponse } from './core'
import { DeleteBucketCommand } from '@aws-sdk/client-s3'

async function deleteObject (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  const { disk } = request.params

  const { name } = body.name
  const { path } = body.path

  const command = new DeleteBucketCommand({
    Bucket: disk,
    Key: `${path}${name}`
  })

  const data = await s3Client.send(command)

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { deleteObject }
