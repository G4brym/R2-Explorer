import { JsonResponse } from '../core'

export async function completeUpload(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({ msg: 'unauthorized' }, 401)

  const data = await request.json()
  const uploadId = data.uploadId
  const key = decodeURIComponent(escape(atob(data.key)))
  const parts = data.parts
  console.log(key)
  console.log(uploadId)

  const { disk } = request.params
  const bucket = env[disk]

  const multipartUpload = await bucket.resumeMultipartUpload(key, uploadId);
  // console.log(multipartUpload)
  try {
    const resp = await multipartUpload.complete(parts);
    // console.log(resp)
    return JsonResponse({
      status: 'ok',
      str: resp,
    })

  } catch (error: any) {
    console.log(error)
    console.log(error.message)
    return new Response(error.message, { status: 400 });
  }
}
