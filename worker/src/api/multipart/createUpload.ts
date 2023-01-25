import { JsonResponse } from '../core'

export async function createUpload(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({ msg: 'unauthorized' }, 401)

  const key = decodeURIComponent(escape(atob(request.query.key)))

  const { disk } = request.params
  const bucket = env[disk]


  const multipartUpload = await bucket.createMultipartUpload(key);
  console.log(multipartUpload)
  console.log(multipartUpload.uploadId)

  return JsonResponse({
    uploadId: multipartUpload.uploadId,
    key: multipartUpload.key,
  })
}
