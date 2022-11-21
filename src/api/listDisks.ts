import { JsonResponse } from './core'

export async function listDisks(request: any, env: any, context: any) {
  const buckets = []

  for (const [key, value] of Object.entries(env)) {
    // @ts-ignore
    if (value.get && value.put) {
      buckets.push({ Name: key })
    }
  }

  return JsonResponse({ Buckets: buckets })
}
