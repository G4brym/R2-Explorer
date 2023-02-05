import axios from 'axios'
import store from './store'
import preview from '@/preview'

const apiHandler = {
  createFolder: (name) => {
    const folderPath = store.state.currentFolder + name + '/'

    return axios.post(`/api/buckets/${store.state.activeBucket}/folder`, {
      path: folderPath
    })
  },
  deleteObject: (path, name) => {
    return axios.post(`/api/buckets/${store.state.activeBucket}/delete`, {
      name,
      path
    })
  },
  downloadFile: (file, onDownloadProgress, abortControl) => {
    const extra = {}
    if (file.preview?.downloadType === 'arraybuffer') {
      extra.responseType = 'arraybuffer'
    }
    if (abortControl) {
      extra.signal = abortControl.signal
    }
    if (onDownloadProgress) {
      extra.onDownloadProgress = onDownloadProgress
    }

    const filePath = btoa(unescape(encodeURIComponent(`${store.state.currentFolder}${file.name}`)))

    return axios.get(
      `/api/buckets/${store.state.activeBucket}/${filePath}`,
      extra
    )
  },
  renameObject: (oldName, newName) => {
    return axios.post(`/api/buckets/${store.state.activeBucket}/rename`, {
      oldName,
      newName,
      path: store.state.currentFolder
    })
  },
  getKey: (folder, file) => {
    folder = folder || store.state.currentFolder

    if (folder !== '' && !folder.endsWith('/')) {
      folder = folder + '/'
    }

    return `${folder}${file}`
  },
  multipartCreate: (file, folder) => {
    const key = apiHandler.getKey(folder, file.name)
    return axios.post(`/api/buckets/${store.state.activeBucket}/multipart/create`, null, {
      params: {
        key: btoa(unescape(encodeURIComponent(key)))
      }
    })
  },
  multipartComplete: (file, folder, parts, uploadId) => {
    const key = apiHandler.getKey(folder, file.name)
    return axios.post(`/api/buckets/${store.state.activeBucket}/multipart/complete`, {
      key: btoa(unescape(encodeURIComponent(key))),
      uploadId,
      parts
    })
  },
  multipartUpload: (uploadId, partNumber, key, chunk, callback) => {
    return axios.post(`/api/buckets/${store.state.activeBucket}/multipart/upload`, chunk, {
      params: {
        key: btoa(unescape(encodeURIComponent(key))),
        uploadId,
        partNumber
      },
      onUploadProgress: callback,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  uploadObjects: (file, folder, callback) => {
    folder = folder || store.state.currentFolder

    return axios.post(`/api/buckets/${store.state.activeBucket}/upload?path=${btoa(unescape(encodeURIComponent(folder)))}`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-filename': btoa(unescape(encodeURIComponent(file.name)))
      },
      onUploadProgress: callback
    })
  },
  listObjects: async () => {
    const response = await axios.get(`/api/buckets/${store.state.activeBucket}`, {
      params: {
        path: store.state.currentFolder
      }
    })

    let files = []
    if (response.data.Contents) {
      files = response.data.Contents.filter(function (obj) {
        return !obj.Key.endsWith('/')
      })
      files = files.map(function (obj) {
        const name = obj.Key.replace(store.state.currentFolder, '')
        const extension = name.split('.').pop()

        return {
          ...obj,
          name,
          path: store.state.currentFolder,
          extension,
          preview: preview.getType(extension),
          isFile: true
        }
      })
    }

    let folders = []
    if (response.data.CommonPrefixes) {
      folders = response.data.CommonPrefixes.map(function (obj) {
        const split = obj.Prefix.split('/')

        return {
          ...obj,
          name: split[split.length - 2],
          path: store.state.currentFolder,
          Key: obj.Prefix,
          isFolder: true,
          hash: btoa(unescape(encodeURIComponent(obj.Prefix)))
        }
      })
    }

    return {
      files,
      folders
    }
  }
}

export default apiHandler
