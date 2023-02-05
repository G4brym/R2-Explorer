const PreviewConfigs = [
  {
    extensions: ['png', 'jpg', 'jpeg', 'webp'],
    type: 'image',
    downloadType: 'arraybuffer'
  },
  {
    extensions: ['mp3'],
    type: 'audio',
    downloadType: 'arraybuffer'
  },
  {
    extensions: ['mp4', 'ogg'],
    type: 'video',
    downloadType: 'arraybuffer'
  },
  {
    extensions: ['pdf'],
    type: 'pdf',
    downloadType: 'arraybuffer'
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
  }
]

export default {
  getType: (extension) => {
    for (const config of PreviewConfigs) {
      if (config.extensions.includes(extension)) {
        return { type: config.type, downloadType: config.downloadType }
      }
    }
  }
}
