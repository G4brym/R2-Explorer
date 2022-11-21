import { JsonResponse } from './core'

export async function deleteObject(request: any, env: any, context: any) {
  const body = await request.json()

  const { disk } = request.params
  const bucket = env[disk]

  const { name } = body
  const { path } = body

  await bucket.delete(`${path}${name}`)

  return JsonResponse({})
}
