import {JsonResponse} from './core'
import {Context} from "../interfaces";

export async function listBuckets(request: any, env: any, context: Context) {
  const buckets = []

  for (const [key, value] of Object.entries(env)) {
    // @ts-ignore
    if (value.get && value.put) {
      buckets.push({Name: key})
    }
  }

  console.log(request)
  return JsonResponse({
    Buckets: buckets,
    config: context.config,
    user: {
      email: context.userEmail
    }
  })
}
