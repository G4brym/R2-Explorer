import { JsonResponse } from './core'

export async function renameObject(request: any, env: any, context: any) {
  if (context.config.readonly === true) return JsonResponse({ msg: 'unauthorized' }, 401)

  const body = await request.json()

  const { disk } = request.params
  const bucket = env[disk]

  const { path } = body
  const { oldName } = body
  const { newName } = body

  const object = await bucket.get(`${path}${oldName}`)

  const updated = await bucket.put(`${path}${newName}`, object.body)

  await bucket.delete(`${path}${oldName}`)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(updated.body, {
    headers,
  })
}
