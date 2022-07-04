import { S3Client } from '@aws-sdk/client-s3'

function JsonResponse (json, status = 200, headers = {}) {
  return new Response(JSON.stringify(json), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
      ...headers
    },
    status
  })
}

function getS3 (accountId, accessToken, secretToken) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {

      accessKeyId: `${accessToken}`,
      secretAccessKey: `${secretToken}`
    },
    accessKeyId: `${accessToken}`,
    secretAccessKey: `${secretToken}`,
    s3DisableBodySigning: false,
    s3ForcePathStyle: true,
    maxRetries: 2
  })
}

async function getS3ForEmail (env, email) {
  let data = await env.WEB_DRIVE.get(email)
  console.log(data)
  if (!data) {
    return null
  }

  data = JSON.parse(data)

  return getS3(data.accountId, data.accessToken, data.secretToken)
}

export { JsonResponse, getS3, getS3ForEmail }
