import { JsonResponse } from './core'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

async function getDownloadUrl (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  const { disk } = request.params

  const { name } = body.name
  const { path } = body.path

  const command = new GetObjectCommand({
    Bucket: disk,
    Key: `${path}${name}`
  })

  // Create the presigned URL.
  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600
  })

  return JsonResponse({ url: signedUrl })
}

export { getDownloadUrl }
