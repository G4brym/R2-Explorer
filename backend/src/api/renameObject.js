import { JsonResponse } from './core'
import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

async function renameObject (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  const { disk } = request.params

  const { path } = body
  const { oldName } = body
  const { newName } = body

  const command = new CopyObjectCommand({
    Bucket: disk,
    CopySource: `${disk}/${path}${oldName}`,
    Key: `${path}${newName}`
  })

  const data = await s3Client.send(command)

  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: disk,
      Key: `${path}${oldName}`
    }))
  } catch {

  }

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { renameObject }
