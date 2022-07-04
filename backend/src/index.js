import { Router } from 'itty-router'
import { config } from './config'
import { listDisks } from './api/listDisks'
import { listContents } from './api/listContents'
import { getDownloadUrl } from './api/getDownloadUrl'
import { uploadFiles } from './api/uploadFiles'
import { createFolder } from './api/createFolder'
import { deleteObject } from './api/deleteObject'
import { renameObject } from './api/renameObject'
import { registerEmail } from './api/register'
import { isRegisted } from './api/isRegisted'
import { getS3ForEmail } from './api/core'

const router = Router()

router.get('/api/is-registed', isRegisted)
router.post('/api/register', registerEmail)

router.get('/api/disks', listDisks)
router.get('/api/disks/:disk', listContents)
router.post('/api/disks/:disk/rename', renameObject)
router.post('/api/disks/:disk/folder', createFolder)
router.post('/api/disks/:disk/download', getDownloadUrl)
router.post('/api/disks/:disk/upload', uploadFiles)
router.post('/api/disks/:disk/delete', deleteObject)

// Handle CORS
router.options('/api/*', (request, env, context) => {
  return new Response(JSON.stringify({ msg: 'ready' }), {
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    },
    status: 200
  })
})

router.all('*', () => new Response('404, not found!', { status: 404 }))

export default {
  async fetch (request, env, context) {
    const s3Client = await getS3ForEmail(env, request.headers.get('Cf-Access-Authenticated-User-Email'))

    return router
      .handle(request, env, { ...context, s3Client })
      .then(response => {
        // can modify response here before final return, e.g. CORS headers
        Object.entries(config.corsHeaders).forEach(entry => {
          const [key, value] = entry

          if (!response.headers.has(key)) {
            response.headers.set(key, value)
          }
        })
        return response
      })
  }
}
