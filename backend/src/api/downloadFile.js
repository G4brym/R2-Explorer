import { JsonResponse } from './core'
import { GetObjectCommand } from '@aws-sdk/client-s3'

async function downloadFile (request, env, context) {
  const body = await request.json()
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)
  const { disk } = request.params

  const { name } = body
  const { path } = body

  const command = new GetObjectCommand({
    Bucket: disk,
    Key: `${path}${name}`
  })

  const data = await s3Client.send(command)

  return new Response(data.Body)
}

export { downloadFile }
