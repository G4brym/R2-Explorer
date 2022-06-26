import { Router } from 'itty-router'
import { config } from './config'
import { S3Client } from '@aws-sdk/client-s3'
import { listDisks } from './api/listDisks'
import { listContents } from './api/listContents'
import { getDownloadUrl } from './api/getDownloadUrl'
import { uploadFiles } from './api/uploadFiles'
import { createFolder } from './api/createFolder'
import { deleteObject } from './api/deleteObject'
import { renameObject } from './api/renameObject'

const router = Router()

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
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountid}.r2.cloudflarestorage.com`,
      credentials: {

        accessKeyId: `${config.access_key_id}`,
        secretAccessKey: `${config.access_key_secret}`
      },
      accessKeyId: `${config.access_key_id}`,
      secretAccessKey: `${config.access_key_secret}`,
      s3DisableBodySigning: false,
      s3ForcePathStyle: true,
      maxRetries: 2
    })

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
