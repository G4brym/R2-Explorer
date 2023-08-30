import {config} from "../settings";
import {GetInfo} from "./api/getInfo";
import {OpenAPIRouter} from "@cloudflare/itty-router-openapi";


export const serverRouter = OpenAPIRouter({
  base: '/api/server',
  raiseUnknownParameters: config.raiseUnknownParameters,
  generateOperationIds: config.generateOperationIds,
})

serverRouter.get('/config', GetInfo)
