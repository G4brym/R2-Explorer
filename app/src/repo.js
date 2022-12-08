import axios from 'axios'
import store from './store'

export default {
  createFolder: (name) => {
    const folderPath = store.state.currentFolder + name + '/'

    return axios.post(`/api/buckets/${store.state.activeBucket}/folder`, {
      path: folderPath
    })
  },
  createDisk: (name) => {
    return axios.post(`/api/buckets/${name}`)
  },
  deleteObject: (path, name) => {
    return axios.post(`/api/buckets/${store.state.activeBucket}/delete`, {
      name,
      path
    })
  },
  downloadFile: (file) => {
    const extra = {}
    if (file.preview.render === 'arraybuffer') {
      extra.responseType = 'arraybuffer'
    }

    return axios.post(
      `/api/buckets/${store.state.activeBucket}/download-file`,
      {
        name: file.name,
        path: store.state.currentFolder
      },
      extra
    )
  },
  getDownloadPresignUrl: (name) => {
    return axios.post(`/api/buckets/${store.state.activeBucket}/download`, {
      name,
      path: store.state.currentFolder
    })
  },
  renameObject: (oldName, newName) => {
    return axios.post(`/api/buckets/${store.state.activeBucket}/rename`, {
      oldName,
      newName,
      path: store.state.currentFolder
    })
  },
  uploadObjects: (file) => {
    return axios.post(`/api/buckets/${store.state.activeBucket}/upload?path=${store.state.currentFolder}`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-filename': btoa(unescape(encodeURIComponent(file.name)))
      }
    })
  },
  listObjects: async () => {
    const response = await axios.get(`/api/buckets/${store.state.activeBucket}`, {
      params: {
        path: store.state.currentFolder
      }
    })

    function getType (extension) {
      if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
        return { type: 'image', render: 'arraybuffer' }
      } else if (['pdf'].includes(extension)) {
        return { type: 'pdf', render: 'arraybuffer' }
      } else if (['txt'].includes(extension)) {
        return { type: 'text', render: 'text' }
      } else if (['md'].includes(extension)) {
        return { type: 'markdown', render: 'text' }
      } else if (['csv'].includes(extension)) {
        return { type: 'csv', render: 'text' }
      }
    }

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
          preview: getType(extension)
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
          Key: obj.Prefix
        }
      })
    }

    return {
      files,
      folders
    }
  }
}
