import { JsonResponse } from './core'

export async function uploadFiles(request: any, env: any, context: any) {
  if(context.config.readonly === true) return JsonResponse({msg: 'unauthorized'}, 401)

  const form = await request.formData()

  const { disk } = request.params
  const bucket = env[disk]
  const { path } = request.query

  // const path = form.get('path')
  const files = form.get('files')

  if (Array.isArray(files)) {
    Array.from(files).forEach(async (file) => {
      await bucket.put(`${path}${file.name}`, file)
    })
  } else {
    console.log(files)
    await bucket.put(`${path}${files.name}`, files)
  }

  return JsonResponse({ status: 'ok' })
}
