import { api } from "boot/axios";

export const ROOT_FOLDER = "IA=="  // IA== is a space

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
  downloadFile: (bucket, file, previewConfig, onDownloadProgress, abortControl) => {
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
      `/buckets/${bucket}/${encode(file.key)}`,
      extra
    );
  },
  // renameObject: (oldName, newName) => {
  //   return axios.post(`/buckets/${store.state.activeBucket}/move`, {
  //     oldKey: encodeKey(oldName, store.state.currentFolder),
  //     newKey: encodeKey(newName, store.state.currentFolder)
  //   })
  // },
  // updateMetadata: (file, metadata) => {
  //   const filePath = encodeKey(file.name, getCurrentFolder())
  //
  //   return axios.post(
  //     `/buckets/${store.state.activeBucket}/${filePath}`,
  //     {
  //       customMetadata: metadata
  //     }
  //   )
  // },
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
    console.log(key)
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
}
