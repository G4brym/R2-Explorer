export async function downloadFile(request: any, env: any, context: any) {
  const { disk, file } = request.params
  const bucket = env[disk]

  const filePath = decodeURIComponent(escape(atob(file)));

  const object = await bucket.get(filePath)

  if (object === null) {
    return new Response('Object Not Found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Content-Disposition', `attachment; filename="${filePath.split('/').pop()}"`)

  return new Response(object.body, {
    headers,
  })
}
