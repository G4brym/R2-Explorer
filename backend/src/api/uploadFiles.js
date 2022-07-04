import { JsonResponse } from './core'
import { PutObjectCommand } from '@aws-sdk/client-s3'

async function uploadFiles (request, env, context) {
  const form = await request.formData()
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)
  const { disk } = request.params

  // const path = form.get('path')
  const files = form.get('files')

  Array.from(files).forEach(async file => {
    console.log(file)
    const command = new PutObjectCommand({
      Bucket: disk,
      Key: `${file.name}`,
      Body: file
    })

    await s3Client.send(command)
  })
  // console.log(data)

  return JsonResponse({ status: 'ok' })
}

export { uploadFiles }
