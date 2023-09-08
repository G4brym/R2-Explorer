import { Context } from "../../interfaces";


export async function validateBasicAuth(request: any, env: any, context: Context) {
  let decodedCredentials: any = false;
  let username = undefined

  try {
    decodedCredentials = getBasicAuth(request).split(':')

    if (!Array.isArray(context.config.basicAuth)) {
      context.config.basicAuth = [context.config.basicAuth]
    }

    for (const credentials of context.config.basicAuth) {
      if (credentials.username === decodedCredentials[0] && credentials.password === decodedCredentials[1]) {
        username = credentials.username
        break
      }
    }

  } catch (e) {
  }

  if (decodedCredentials === false || username === undefined) {
    return Response.json({
      success: false,
      errors: [{ code: 10000, message: "Authentication error! This server requires Basic Auth" }]
    }, { status: 401 });
  }

  context.username = username;
}

function getBasicAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }
  return atob(authHeader.replace('Basic', '').trim());
}
