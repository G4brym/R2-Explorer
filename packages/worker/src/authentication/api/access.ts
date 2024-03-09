// This var will hold already imported jwt keys, this reduces the load of importing the key on every request
import {Context, R2ExplorerConfig} from "../../interfaces";
import {getCurrentTimestampSeconds} from "../../dates";

let builtJWTKeys: Record<string, CryptoKey> = {}
let JWTExpiration = 0

function getAccessHost(teamName: string): string {
  return `https://${teamName}.cloudflareaccess.com`
}


export async function validateAccessJwt(request: any, env: any, context: Context) {
  let decodedJwt: any = false
  try {
    decodedJwt = await isValidJwt(request, context.config)
  } catch (e) {
  }

  if (decodedJwt === false) {
    return Response.json({
      success: false,
      errors: [{code: 10000, message: 'Authentication error! Verify that the Cloudflare Access Team name is correct'}]
    }, {status: 401})
  }

  context.username = decodedJwt.payload.email
}

async function getPublicKeys(config: R2ExplorerConfig): Promise<Record<string, CryptoKey>> {
  let jwtUrl = `${getAccessHost(config.cfAccessTeamName)}/cdn-cgi/access/certs`

  const result = await fetch(jwtUrl, {
    method: 'GET',
    // @ts-ignore
    cf: {
      // Dont cache error responses
      cacheTtlByStatus: {'200-299': 30, '300-599': 0},
    },
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  })

  const data: any = await result.json()

  JWTExpiration = getCurrentTimestampSeconds() + 3600  // 1h
  const importedKeys: Record<string, CryptoKey> = {}
  for (const key of data.keys) {
    importedKeys[key.kid] = await crypto.subtle.importKey(
      'jwk',
      key,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['verify'],
    )
  }

  return importedKeys
}

export async function isValidJwt(request, config: R2ExplorerConfig) {
  // Get raw jwt token
  const encodedToken = getJwt(request)
  if (encodedToken === null) {
    return false
  }

  // Load jwt keys if they are not in memory or already expired
  if (Object.keys(builtJWTKeys).length === 0 || Math.floor(Date.now() / 1000) < JWTExpiration) {
    builtJWTKeys = await getPublicKeys(config)
  }

  // Decode payload
  let token
  try {
    token = decodeJwt(encodedToken)
  } catch (err) {
    return false
  }

  // Is the token expired?
  const expiryDate = new Date(token.payload.exp * 1000)
  const currentDate = new Date(Date.now())
  if (expiryDate <= currentDate) {
    console.log('expired token')
    return false
  }

  if (token.payload?.iss !== getAccessHost(config.cfAccessTeamName)) {
    console.log('invalid access signer')
    return false
  }

  // Check is token is valid against all public keys
  if (!isValidJwtSignature(token)) {
    return false
  }

  // All good, return payload
  return token
}

/**
 * For this example, the JWT is passed in as part of the Authorization header,
 * after the Bearer scheme.
 * Parse the JWT out of the header and return it.
 */
function getJwt(request) {
  const authHeader = request.headers.get('cf-access-jwt-assertion')
  if (!authHeader) {
    return null
  }
  return authHeader.trim()
}

/**
 * Parse and decode a JWT.
 * A JWT is three, base64 encoded, strings concatenated with ‘.’:
 *   a header, a payload, and the signature.
 * The signature is “URL safe”, in that ‘/+’ characters have been replaced by ‘_-’
 *
 * Steps:
 * 1. Split the token at the ‘.’ character
 * 2. Base64 decode the individual parts
 * 3. Retain the raw Bas64 encoded strings to verify the signature
 */
function decodeJwt(token) {
  const parts = token.split('.')
  const header = JSON.parse(atob(parts[0]))
  const payload = JSON.parse(atob(parts[1]))
  const signature = atob(parts[2].replace(/_/g, '/').replace(/-/g, '+'))
  // console.log(header)
  return {
    header: header,
    payload: payload,
    signature: signature,
    raw: {header: parts[0], payload: parts[1], signature: parts[2]},
  }
}

/**
 * Validate the JWT.
 *
 * Steps:
 * Reconstruct the signed message from the Base64 encoded strings.
 * Load the RSA public key into the crypto library.
 * Verify the signature with the message and the key.
 */
async function isValidJwtSignature(token) {
  const encoder = new TextEncoder()
  const data = encoder.encode([token.raw.header, token.raw.payload].join('.'))
  // @ts-ignore
  const signature = new Uint8Array(Array.from(token.signature).map((c) => c.charCodeAt(0)))

  for (const key of Object.values(builtJWTKeys)) {
    const isValid = await validateSingleKey(key, signature, data)

    if (isValid) return true
  }

  return false
}

async function validateSingleKey(key, signature, data): Promise<boolean> {
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
}
