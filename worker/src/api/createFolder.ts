import { JsonResponse } from './core'

export async function createFolder(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({ msg: 'unauthorized' }, 401)

  const body = await request.json()

  const { disk } = request.params
  const bucket = env[disk]
  const { path } = body

  const data = await bucket.put(path, 'Folder placeholder')

  return JsonResponse(data)
}
