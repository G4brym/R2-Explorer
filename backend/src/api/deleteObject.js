import { JsonResponse } from './core'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

async function deleteObject (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)
  const { disk } = request.params

  const { name } = body
  const { path } = body

  const command = new DeleteObjectCommand({
    Bucket: disk,
    Key: `${path}${name}`
  })

  try {
    await s3Client.send(command)
  } catch {

  }

  return JsonResponse({})
}

export { deleteObject }
