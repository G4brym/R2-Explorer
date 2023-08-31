const PreviewConfigs = [
  {
    extensions: ['png', 'jpg', 'jpeg', 'webp'],
    type: 'image',
    downloadType: 'objectUrl'
  },
  {
    extensions: ['mp3'],
    type: 'audio',
    downloadType: 'objectUrl'
  },
  {
    extensions: ['mp4', 'ogg'],
    type: 'video',
    downloadType: 'objectUrl'
  },
  {
    extensions: ['pdf'],
    type: 'pdf',
    downloadType: 'objectUrl'
  },
  {
    extensions: ['txt'],
    type: 'text',
    downloadType: 'text'
  },
  {
    extensions: ['md'],
    type: 'markdown',
    downloadType: 'text'
  },
  {
    extensions: ['csv'],
    type: 'csv',
    downloadType: 'text'
  },
  {
    extensions: ['json'],
    type: 'json',
    downloadType: 'text'
  },
  {
    extensions: ['html'],
    type: 'html',
    downloadType: 'text'
  },
  {
    extensions: ['log.gz'],
    type: 'logs',
    downloadType: 'blob'
  }
]

export default {
  getType: (filename) => {
    for (const config of PreviewConfigs) {
      for (const extension of config.extensions) {
        if (filename.endsWith(extension)) {
          return { type: config.type, downloadType: config.downloadType }
        }
      }
    }
  }
}
