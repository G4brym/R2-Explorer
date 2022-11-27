export function JsonResponse(json: any, status = 200, headers = {}) {
  return new Response(JSON.stringify(json), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
      ...headers,
    },
    status,
  })
}
