import { JsonResponse } from './core'
import { CopyObjectCommand, DeleteBucketCommand } from '@aws-sdk/client-s3'

async function renameObject (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  const { disk } = request.params

  const { path } = body.path
  const { oldName } = body.oldName
  const { newName } = body.newName

  const command = new CopyObjectCommand({
    Bucket: disk,
    CopySource: `${disk}/${path}${oldName}`,
    Key: `${path}${newName}`
  })

  const data = await s3Client.send(command)

  await s3Client.send(new DeleteBucketCommand({
    Bucket: disk,
    Key: `${path}${oldName}`
  }))

  return JsonResponse(data, data.$metadata.httpStatusCode)
}

export { renameObject }
