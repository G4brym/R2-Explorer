import { JsonResponse } from './core'

async function isRegisted (request, env, context) {
  return JsonResponse({ result: context.s3Client !== null })
}

export { isRegisted }
