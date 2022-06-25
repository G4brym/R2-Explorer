import { JsonResponse } from './core'
import { PutObjectCommand } from '@aws-sdk/client-s3'

async function createFolder (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  const { disk } = request.params

  const { path } = body.path

  const command = new PutObjectCommand({
    Bucket: disk,
    Key: `${path}`,
    ContentLength: 0,
    Body: 'Folder placeholder'
  })

  const data = await s3Client.send(command)

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { createFolder }
