import { JsonResponse } from './core'
import { PutObjectCommand } from '@aws-sdk/client-s3'

async function createFolder (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)
  const { disk } = request.params
  console.log(body)

  const { path } = body

  const command = new PutObjectCommand({
    Bucket: disk,
    Key: `${path}`,
    ContentLength: 18,
    Body: 'Folder placeholder'
  })

  const data = await s3Client.send(command)

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { createFolder }
