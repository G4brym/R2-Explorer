import { getCurrentTimestampSeconds } from "../dates";
import { AppContext } from "../../types";


// This var will hold already imported jwt keys, this reduces the load of importing the key on every request
let builtJWTKeys: Record<string, CryptoKey> = {};
let JWTExpiration = 0;

function getAccessHost(teamName: string): string {
	return `https://${teamName}.cloudflareaccess.com`;
}

export async function accessMiddleware(c: AppContext, next: CallableFunction) {
  const encodedToken = getJwt(c);

  if (encodedToken === null) {
    return Response.json(
      {
        success: false,
        errors: [
          {
            code: 10000,
            message:
              "Authentication error: Missing bearer token",
          },
        ],
      },
      { status: 401 },
    );
  }

  const cfAccessTeamName = c.get('config').cfAccessTeamName as string
	let decodedJwt: any = false;
	try {
		decodedJwt = await isValidJwt(encodedToken, cfAccessTeamName);
	} catch (e) {}

	if (decodedJwt === false) {
		return Response.json(
			{
				success: false,
				errors: [
					{
						code: 10001,
						message:
							"Authentication error: Unable to decode Bearer token",
					},
				],
			},
			{ status: 401 },
		);
	}

  c.set('username', decodedJwt.payload.email)
  await next()
}

async function getPublicKeys(cfAccessTeamName: string): Promise<Record<string, CryptoKey>> {
	const jwtUrl = `${getAccessHost(cfAccessTeamName)}/cdn-cgi/access/certs`;

	const result = await fetch(jwtUrl, {
		method: "GET",
		// @ts-ignore
		cf: {
			// Dont cache error responses
			cacheTtlByStatus: { "200-299": 30, "300-599": 0 },
		},
		headers: {
			"Content-Type": "application/json; charset=UTF-8",
		},
	});

	const data: any = await result.json();

	JWTExpiration = getCurrentTimestampSeconds() + 3600; // 1h
	const importedKeys: Record<string, CryptoKey> = {};
	for (const key of data.keys) {
		importedKeys[key.kid] = await crypto.subtle.importKey(
			"jwk",
			key,
			{
				name: "RSASSA-PKCS1-v1_5",
				hash: "SHA-256",
			},
			false,
			["verify"],
		);
	}

	return importedKeys;
}

export async function isValidJwt(encodedToken: string, cfAccessTeamName: string) {
  // Load jwt keys if they are not in memory or already expired
	if (
		Object.keys(builtJWTKeys).length === 0 ||
		Math.floor(Date.now() / 1000) < JWTExpiration
	) {
		builtJWTKeys = await getPublicKeys(cfAccessTeamName);
	}

	// Decode payload
	let token;
	try {
		token = decodeJwt(encodedToken);
	} catch (err) {
    return Response.json(
      {
        success: false,
        errors: [
          {
            code: 10001,
            message:
              "Authentication error: Unable to decode Bearer token",
          },
        ],
      },
      { status: 401 },
    );
	}

	// Is the token expired?
	const expiryDate = new Date(token.payload.exp * 1000);
	const currentDate = new Date(Date.now());
	if (expiryDate <= currentDate) {
    return Response.json(
      {
        success: false,
        errors: [
          {
            code: 10002,
            message:
              "Authentication error: Token is expired",
          },
        ],
      },
      { status: 401 },
    );
	}

	if (token.payload?.iss !== getAccessHost(cfAccessTeamName)) {
    return Response.json(
      {
        success: false,
        errors: [
          {
            code: 10003,
            message:
              `Authentication error: Expected team name ${cfAccessTeamName}, but received ${token.payload?.iss}`,
          },
        ],
      },
      { status: 401 },
    );
	}

	// Check is token is valid against all public keys
	if (!await isValidJwtSignature(token)) {
    return Response.json(
      {
        success: false,
        errors: [
          {
            code: 10004,
            message: "Authentication error: Invalid Token",
          },
        ],
      },
      { status: 401 },
    );
	}

	// All good, return payload
	return token;
}

/**
 * For this example, the JWT is passed in as part of the Authorization header,
 * after the Bearer scheme.
 * Parse the JWT out of the header and return it.
 */
function getJwt(c: AppContext) {
	const authHeader = c.req.header("cf-access-jwt-assertion");
	if (!authHeader) {
		return null;
	}
	return authHeader.trim();
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
type DecodedToken = {
  header: object,
  payload: {iss?: string, exp: number},
  signature: string,
  raw: { header?: string, payload?: string, signature?: string },
}

function decodeJwt(token: string): DecodedToken {
	const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error('Invalid token')
  }

	const header = JSON.parse(atob((parts[0] as string)));
	const payload = JSON.parse(atob((parts[1] as string)));
	const signature = atob((parts[2] as string).replace(/_/g, "/").replace(/-/g, "+"));

	return {
		header: header,
		payload: payload,
		signature: signature,
		raw: { header: parts[0], payload: parts[1], signature: parts[2] },
	};
}

/**
 * Validate the JWT.
 *
 * Steps:
 * Reconstruct the signed message from the Base64 encoded strings.
 * Load the RSA public key into the crypto library.
 * Verify the signature with the message and the key.
 */
async function isValidJwtSignature(token: DecodedToken) {
	const encoder = new TextEncoder();
	const data = encoder.encode([token.raw.header, token.raw.payload].join("."));
	// @ts-ignore
	const signature = new Uint8Array(
		Array.from(token.signature).map((c) => c.charCodeAt(0)),
	);

	for (const key of Object.values(builtJWTKeys)) {
		const isValid = await validateSingleKey(key, signature, data);

		if (isValid) return true;
	}

	return false;
}

async function validateSingleKey(key: CryptoKey, signature: Uint8Array, data: Uint8Array): Promise<boolean> {
	return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data);
}
