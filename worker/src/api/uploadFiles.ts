import { JsonResponse } from './core'

export async function uploadFiles(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({ msg: 'unauthorized' }, 401)

  const { disk } = request.params
  const bucket = env[disk]
  let { path } = request.query
  path = decodeURIComponent(escape(atob(path)))

  if (path !== '' && !path.endsWith('/')) {
    path = path + '/'
  }

  const filename = decodeURIComponent(escape(atob(request.headers.get('x-filename'))))

  await bucket.put(`${path}${filename}`, request.body)

  return JsonResponse({ status: 'ok' })
}
