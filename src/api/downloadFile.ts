export async function downloadFile(request: any, env: any, context: any) {
  const body = await request.json()

  const { disk } = request.params
  const bucket = env[disk]

  const { name } = body
  const { path } = body

  const object = await bucket.get(`${path}${name}`)

  if (object === null) {
    return new Response('Object Not Found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, {
    headers,
  })
}
