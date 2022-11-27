import { JsonResponse } from './core'

export async function listContents(request: any, env: any, context: any) {
  const { disk } = request.params
  const bucket = env[disk]

  const { path } = request.query || ''

  const contents = []
  const prefixes = []
  const data = await bucket.list({ prefix: path, delimiter: '/' })

  if (data.objects) {
    for (const obj of data.objects) {
      contents.push({ Key: obj.key, Size: obj.size, LastModified: obj.uploaded })
    }
  }

  if (data.delimitedPrefixes) {
    for (const prefix of data.delimitedPrefixes) {
      prefixes.push({ Prefix: prefix })
    }
  }

  return JsonResponse({ Contents: contents, CommonPrefixes: prefixes })
}
