import { Request, Router } from 'itty-router'
import { listBuckets } from './api/listBuckets'
import { listContents } from './api/listContents'
import { uploadFiles } from './api/uploadFiles'
import { createFolder } from './api/createFolder'
import { deleteObject } from './api/deleteObject'
import { renameObject } from './api/renameObject'
import { downloadFile } from './api/downloadFile'
// @ts-ignore
import html from 'explorer:index.html'
// @ts-ignore
import app from 'explorer:js/app.js'
// @ts-ignore
import favicon from 'explorer:favicon.svg'

export interface R2ExplorerConfig {
  readonly?: boolean
}

export function R2Explorer(config?: R2ExplorerConfig) {
  config = config || {}
  if (config.readonly !== false) config.readonly = true

  const router = Router()

  router.get('/', () => {
    return new Response(atob(html), {
      status: 200,
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    })
  })

  router.get('/js/app.js', () => {
    return new Response(atob(app), {
      status: 200,
      headers: {
        'content-type': 'text/js;charset=UTF-8',
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
  router.post('/api/buckets/:disk/download-file', downloadFile)
  router.post('/api/buckets/:disk/upload', uploadFiles)
  router.post('/api/buckets/:disk/delete', deleteObject)

  router.get('/api/*', (request: any, env: any, context: any) => {
    return new Response(JSON.stringify({ msg: '404, not found!' }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
      status: 404,
    })
  })

  router.all('*', () => new Response('404, not found!', { status: 404 }))

  return (request, env, context) => {
    return router.handle(request, env, { ...context, config: config })
  }
}