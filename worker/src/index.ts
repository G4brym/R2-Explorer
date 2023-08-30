import {createCors} from 'itty-router'
import {R2ExplorerConfig} from "./interfaces";
import {OpenAPIRouter} from "@cloudflare/itty-router-openapi";
import {bucketsRouter} from "./buckets/router";
import {authenticateUser} from "./authentication/api/access";
import {dashboardProxy} from "./dashbord";
import {receiveEmail} from "./emails/receiveEmail";
import {serverRouter} from "./server/router";
import {config as settings} from "./settings"

export function R2Explorer(config?: R2ExplorerConfig) {
  config = config || {}
  if (config.readonly !== false) config.readonly = true

  const router = OpenAPIRouter({
    schema: {
      info: {
        title: 'R2 Explorer API',
        version: settings.version,
      },
    }
  })
  const {preflight, corsify} = createCors()

  // This route must be the first defined
  if (config.cfAccessTeamName) {
    router.all('*', authenticateUser)
  }

  if (config.cors === true) {
    router.all('*', preflight)
  }

  router.all('/api/server/*', serverRouter)
  router.all('/api/buckets/*', bucketsRouter)

  router.original.get('*', dashboardProxy)

  router.all('*', () => Response.json({msg: '404, not found!'}, {status: 404}))

  return {
    async email(event, env, context) {
      await receiveEmail(event, env, {
        executionContext: context, config: config
      })
    },
    async fetch(request, env, context) {
      let resp = await router.handle(request, env, {
        executionContext: context, config: config
      })

      if (config.cors === true) {
        resp = corsify(resp)
      }

      return resp
    }
  };
}
