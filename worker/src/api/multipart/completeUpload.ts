import { JsonResponse } from '../core'

export async function completeUpload(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({ msg: 'unauthorized' }, 401)

  const data = await request.json()
  console.log(data)
  console.log(data.parts)
  const uploadId = data.uploadId
  const key = decodeURIComponent(escape(atob(data.key)))
  const parts = data.parts

  const { disk } = request.params
  const bucket = env[disk]

  const multipartUpload = await bucket.resumeMultipartUpload(key, uploadId);

  try {
    await multipartUpload.complete(parts);
    return JsonResponse({
      status: 'ok'
    })

  } catch (error: any) {
    console.log(error)
    console.log(error.message)
    return new Response(error.message, { status: 400 });
  }
}
