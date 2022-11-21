export async function renameObject(request: any, env: any, context: any) {
  const body = await request.json()

  const { disk } = request.params
  const bucket = env[disk]

  const { path } = body
  const { oldName } = body
  const { newName } = body

  const object = await bucket.get(`${path}${oldName}`)

  await bucket.put(`${path}${newName}`, object.body)

  await bucket.delete(`${path}${oldName}`)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, {
    headers,
  })
}
