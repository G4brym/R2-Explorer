import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";

export const ROOT_FOLDER = "IA=="  // IA== is a space

function mapFile(obj, prefix) {
  const date = new Date(obj.uploaded)

  return {
    ...obj,
    hash: encode(obj.key),
    nameHash: encode(obj.key.replace(prefix, '')),
    name: obj.key.replace(prefix, ''),
    lastModified: timeSince(date),
    timestamp: date.getTime(),
    size: bytesToSize(obj.size),
    sizeRaw: obj.size,
    type: 'file',
    icon: 'article',
    color: 'grey',
  }
}

export const timeSince = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  let calc;

  if (interval > 1) {
    // calc = Math.floor(interval)
    // return calc + (calc === 1 ? ' year' : ' years')
    return date.toLocaleDateString();
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    // calc = Math.floor(interval)
    // return calc + (calc === 1 ? ' month' : ' months')
    return date.toLocaleDateString();
  }
  interval = seconds / 86400;
  if (interval > 1) {
    // calc = Math.floor(interval)
    // return calc + (calc === 1 ? ' day' : ' days')
    return date.toLocaleDateString();
  }
  interval = seconds / 3600;
  if (interval > 1) {
    calc = Math.floor(interval);
    return calc + (calc === 1 ? " hour" : " hours");
  }
  interval = seconds / 60;
  if (interval > 1) {
    calc = Math.floor(interval);
    return calc + (calc === 1 ? " minute" : " minutes");
  }

  calc = Math.floor(interval);
  return calc + (calc === 1 ? " second" : " seconds");
};
export const bytesToSize = (bytes) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
};

export const bytesToMegabytes = (bytes) => {
  return Math.round(bytes / Math.pow(1024, 2));
};

export const encode = (key) => {
  if (key && key !== '/' && key.startsWith('/')) {
    // File keys should never start with /
    key = key.slice(1)
  }
  return btoa(unescape(encodeURIComponent(key)));
};

export const decode = (key) => {
  return decodeURIComponent(escape(atob(key)));
};

export const apiHandler = {
  createFolder: (key, bucket) => {
    return api.post(`/buckets/${bucket}/folder`, {
      key: encode(key)
    })
  },
  deleteObject: (key, bucket) => {
    return api.post(`/buckets/${bucket}/delete`, {
      key: encode(key)
    })
  },
  downloadFile: (bucket, key, previewConfig, onDownloadProgress, abortControl) => {
    const extra = {};
    if (previewConfig.downloadType === "objectUrl" || previewConfig.downloadType === "blob") {
      extra.responseType = "arraybuffer";
    }
    if (abortControl) {
      extra.signal = abortControl.signal;
    }
    if (onDownloadProgress) {
      extra.onDownloadProgress = onDownloadProgress;
    }

    return api.get(
      `/buckets/${bucket}/${encode(key)}`,
      extra
    );
  },
  headFile: async (bucket, key) => {
    let prefix = ''
    if (key.includes('/')) {
      prefix = key.replace(key.split('/').pop(), '')
    }

    const resp = await api.get(`/buckets/${bucket}/${encode(key)}/head`);

    if (resp.status === 200) {
      return mapFile(resp.data, prefix)
    }
  },
  renameObject: (bucket, oldKey, newKey) => {
    return api.post(`/buckets/${bucket}/move`, {
      oldKey: encode(oldKey),
      newKey: encode(newKey)
    })
  },
  updateMetadata: async (bucket, key, metadata) => {
    let prefix = ''
    if (key.includes('/')) {
      prefix = key.replace(key.split('/').pop(), '')
    }

    const resp = await api.post(
      `/buckets/${bucket}/${encode(key)}`,
      {
        customMetadata: metadata
      }
    )

    if (resp.status === 200) {
      return mapFile(resp.data, prefix)
    }
  },
  multipartCreate: (file, key, bucket) => {
    return api.post(`/buckets/${bucket}/multipart/create`, null, {
      params: {
        key: encode(key),
        httpMetadata: encode(JSON.stringify({
          contentType: file.type
        }))
      }
    })
  },
  multipartComplete: (file, key, bucket, parts, uploadId) => {
    return api.post(`/buckets/${bucket}/multipart/complete`, {
      key: encode(key),
      uploadId,
      parts
    })
  },
  multipartUpload: (uploadId, partNumber, bucket, key, chunk, callback) => {
    return api.post(`/buckets/${bucket}/multipart/upload`, chunk, {
      params: {
        key: encode(key),
        uploadId,
        partNumber
      },
      onUploadProgress: callback,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  uploadObjects: (file, key, bucket, callback) => {
    // console.log(key)
    return api.post(`/buckets/${bucket}/upload`, file, {
      params: {
        key: encode(key),
        httpMetadata: encode(JSON.stringify({
          contentType: file.type
        }))
      },
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: callback
    })
  },
  listObjects: async (bucket, prefix, delimiter = '/', cursor = null) => {
    return await api.get(`/buckets/${bucket}?include=customMetadata&include=httpMetadata`, {
      params: {
        delimiter: delimiter,
        prefix: prefix && prefix !== '/' ? encode(prefix) : '',
        cursor: cursor
      }
    })
  },
  fetchFile: async (bucket, prefix, delimiter = '/') => {
    const mainStore = useMainStore();
    let truncated = true
    let cursor = null
    let contentFiles = []
    let contentFolders = []

    while (truncated) {
      const response = await apiHandler.listObjects(bucket, prefix, delimiter, cursor)

      truncated = response.data.truncated
      cursor = response.data.cursor

      if (response.data.objects) {
        const files = response.data.objects.filter(function(obj) {
          return !(obj.key.endsWith('/') && delimiter !== '') && obj.key !== prefix  // Remove selected folder when delimiter is defined
        }).map((obj) => mapFile(obj, prefix)).filter(obj => {
          // Remove hidden files
          return !(mainStore.showHiddenFiles !== true && obj.name.startsWith('.'))
        })

        for (const f of files) {
          contentFiles.push(f)
        }
      }

      if (response.data.delimitedPrefixes) {
        const folders = response.data.delimitedPrefixes.map(function (obj) {
          return {
            name: obj.replace(prefix, ''),
            hash: encode(obj.key),
            key: obj,
            lastModified: '--',
            timestamp: 0,
            size: '--',
            sizeRaw: 0,
            type: 'folder',
            icon: 'folder',
            color: 'orange',
          }
        }).filter(obj => {
          // Remove hidden files
          return !(mainStore.showHiddenFiles !== true && obj.name.startsWith('.'))
        })

        for (const f of folders) {
          contentFolders.push(f)
        }
      }
    }

    return [
      ...contentFolders,
      ...contentFiles
    ]
  }
}
