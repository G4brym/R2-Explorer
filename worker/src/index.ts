// @ts-ignore
import html from 'explorer:index.html'
// @ts-ignore
import app from 'explorer:js/app.js'
// @ts-ignore
import favicon from 'explorer:favicon.svg'
import { Router } from 'itty-router'
import { listBuckets } from './api/listBuckets'
import { listContents } from './api/listContents'
import { uploadFiles } from './api/uploadFiles'
import { createFolder } from './api/createFolder'
import { deleteObject } from './api/deleteObject'
import { renameObject } from './api/renameObject'
import { downloadFile } from './api/downloadFile'
import {partUpload} from "./api/multipart/partUpload";
import {createUpload} from "./api/multipart/createUpload";
import {completeUpload} from "./api/multipart/completeUpload";
import {R2ExplorerConfig} from "./interfaces";
import {authenticateUser} from "./access";



export function R2Explorer(config?: R2ExplorerConfig) {
  config = config || {}
  if (config.readonly !== false) config.readonly = true

  const router = Router()

  // This route must be the first defined
  if(config.cfAccessTeamName) {
    router.all('*', authenticateUser)
  }


  router.get('/js/app.js', () => {
    return new Response(atob(app), {
      status: 200,
      headers: {
        'content-type': 'text/javascript;charset=UTF-8',
      },
    })
  })

  router.get('/favicon.svg', () => {
    return new Response(atob(favicon), {
      status: 200,
      headers: {
        'content-type': 'image/svg+xml',
      },
    })
  })

  router.get('/api/buckets', listBuckets)
  router.get('/api/buckets/:disk', listContents)
  router.post('/api/buckets/:disk/rename', renameObject)
  router.post('/api/buckets/:disk/folder', createFolder)
  router.post('/api/buckets/:disk/upload', uploadFiles)
  router.post('/api/buckets/:disk/multipart/create', createUpload)
  router.post('/api/buckets/:disk/multipart/upload', partUpload)
  router.post('/api/buckets/:disk/multipart/complete', completeUpload)
  router.post('/api/buckets/:disk/delete', deleteObject)
  router.get('/api/buckets/:disk/:file', downloadFile)

  router.get('/api/*', (request: any, env: any, context: any) => {
    return new Response(JSON.stringify({ msg: '404, not found!' }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
      status: 404,
    })
  })

  if (config.cors === true) {
    router.options('/api/*', (request, env, context) => {
      return new Response(JSON.stringify({ msg: 'ready' }), {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        status: 200,
      })
    })
  }

  router.get('*', () => {
    return new Response(atob(html), {
      status: 200,
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    })
  })

  router.all('*', () => new Response('404, not found!', { status: 404 }))

  return (request, env, context) => {
    return router.handle(request, env, { ...context, config: config }).then((response) => {
      if (config.cors === true) {
        // can modify response here before final return, e.g. CORS headers
        Object.entries({
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
          'timing-allow-origin': '*',
        }).forEach((entry) => {
          const [key, value] = entry

          if (!response.headers.has(key)) {
            response.headers.set(key, value)
          }
        })
      }

      return response
    })
  }
}
