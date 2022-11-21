import { Router } from 'itty-router'
import { listDisks } from './api/listDisks'
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
import favicon from 'explorer:favicon.png'

export function R2Explorer() {
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

  router.get('/favicon.png', () => {
    return new Response(atob(favicon), {
      status: 200,
      headers: {
        'content-type': 'image/png',
      },
    })
  })

  router.get('/api/disks', listDisks)
  router.get('/api/disks/:disk', listContents)
  router.post('/api/disks/:disk/rename', renameObject)
  router.post('/api/disks/:disk/folder', createFolder)
  router.post('/api/disks/:disk/download-file', downloadFile)
  router.post('/api/disks/:disk/upload', uploadFiles)
  router.post('/api/disks/:disk/delete', deleteObject)

  router.get('/api/*', (request: any, env: any, context: any) => {
    return new Response(JSON.stringify({ msg: '404, not found!' }), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
      status: 404,
    })
  })

  router.all('*', () => new Response('404, not found!', { status: 404 }))

  return router
}
