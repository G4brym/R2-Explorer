import { JsonResponse } from './core'
import { PutObjectCommand } from '@aws-sdk/client-s3'

async function uploadFiles (request, env, context) {
  const form = await request.formData()
  const { s3Client } = context
  if (s3Client === null) return JsonResponse('unauthorized', 401)
  const { disk } = request.params
  const { path } = request.query

  // const path = form.get('path')
  const files = form.get('files')

  if (Array.isArray(files)) {
    Array.from(files).forEach(async file => {
      await uploadFile(s3Client, disk, file, path)
    })
  } else {
    await uploadFile(s3Client, disk, files, path)
  }

  return JsonResponse({ status: 'ok' })
}

async function uploadFile (s3Client, disk, file, path) {
  const command = new PutObjectCommand({
    Bucket: disk,
    Key: `${path}${file.name}`,
    Body: file
  })

  const data = await s3Client.send(command)
  // console.log(data)
}

export { uploadFiles }
