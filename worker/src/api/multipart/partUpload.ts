import {JsonResponse} from '../core'

export async function partUpload(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({msg: 'unauthorized'}, 401)

  const uploadId = request.query.uploadId
  const partNumber = parseInt(request.query.partNumber)
  const key = decodeURIComponent(escape(atob(request.query.key)))

  const {disk} = request.params
  const bucket = env[disk]
  console.log(key)
  console.log(uploadId)
  const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

  try {
    const uploadedPart = await multipartUpload.uploadPart(partNumber, request.body);
    return JsonResponse(uploadedPart)

  } catch (error: any) {
    console.log(error)
    console.log(error.message)
    return new Response(error.message, {status: 400});
  }
}
