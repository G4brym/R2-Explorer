import { JsonResponse } from './core'

export async function uploadFiles(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({ msg: 'unauthorized' }, 401)

  const { disk } = request.params
  const bucket = env[disk]
  const { path } = request.query

  const filename = decodeURIComponent(escape(atob(request.headers.get('x-filename'))))
  const buf = await request.arrayBuffer()

  try {
    await bucket.put(`${path}${filename}`, buf)
  } catch (e) {
    return new Response(e.message)
  }

  return JsonResponse({ status: 'ok' })
}
