<template>
  <div
    ref="dragContainer"
    class="upload-box"
    :class="{ 'active': isHover }"
    @dragover.prevent="dragover"
    @dragleave.prevent="dragleave"
    @drop.prevent="drop"
  >
    <slot></slot>
    <div class="drop-files">
      <div class="box">
        <h3>Drop files to upload</h3>
        <span class="font-28"><i class="bi bi-cloud-upload-fill"></i></span>
      </div>
    </div>
  </div>

  <!--  <input style="display: none" @change="inputFiles" type="file" name="files[]" ref="uploader" multiple directory="" webkitdirectory="" moxdirectory=""/>-->
  <input style="display: none" @change="inputFiles" type="file" name="files[]" ref="filesUploader" multiple/>
  <input style="display: none" @change="inputFolders" type="file" webkitdirectory name="files[]" ref="foldersUploader"
         multiple/>
</template>

<script>

import { useMainStore } from "stores/main-store";
import { apiHandler, decode, ROOT_FOLDER } from "src/appUtils";

export default {
  data: function () {
    return {
      isHover: false,
      filelist: [], // Store our uploaded files
      dragContainer: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    }
  },
  computed: {
    selectedBucket: function () {
      return this.$route.params.bucket
    },
    selectedFolder: function () {
      if (this.$route.params.folder && this.$route.params.folder !== ROOT_FOLDER) {
        return decode(this.$route.params.folder)
      }
      return ''
    },
  },
  methods: {
    openFilesUploader () {
      this.$refs.filesUploader.click()
    },
    openFoldersUploader () {
      this.$refs.foldersUploader.click()
    },
    dragover (event) {
      if (this.mainStore.readonly) {
        return
      }

      const coordinates = this.$refs.dragContainer.getBoundingClientRect()
      this.dragContainer = {
        top: coordinates.top,
        bottom: coordinates.bottom,
        left: coordinates.left,
        right: coordinates.right
      }

      this.isHover = true
    },
    dragleave (event) {
      if (
        event.clientX < this.dragContainer.left ||
        event.clientX > this.dragContainer.right ||
        event.clientY > this.dragContainer.bottom ||
        event.clientY < this.dragContainer.top
      ) {
        this.isHover = false
      }
    },
    inputFiles (event) {
      this.uploadFiles({
        '': event.target.files
      })
    },
    inputFolders (event) {
      const folders = {}
      for (const file of event.target.files) {
        const lastIndex = file.webkitRelativePath.lastIndexOf('/')
        const path = file.webkitRelativePath.slice(0, lastIndex)

        if (folders[path] === undefined) {
          folders[path] = []
        }

        folders[path].push(file)
      }

      this.uploadFiles(folders)
    },
    async uploadFiles (folders) {
      let totalFiles = 0
      const filenames = []

      // Create folders and count files
      for (const [folder, files] of Object.entries(folders)) {
        // if (folder.slice(-1) === '/') {
        //   folder = folder.slice(0, -1)
        // }

        if (folder !== '') {
          await apiHandler.createFolder(this.selectedFolder + folder + '/', this.selectedBucket)
        }

        totalFiles += files.length

        for (const file of files) {
          filenames.push(file.name)
        }
      }

      this.$bus.emit('fetchFiles')
      // self.$store.dispatch('addUploadingFiles', filenames)  // TODO!

      // Upload files
      let uploadCount = 0
      for (const [folder, files] of Object.entries(folders)) {
        let targetFolder = this.selectedFolder + folder
        if (targetFolder.slice(-1) !== '/') {
          targetFolder += '/'
        }

        for (const file of files) {
          uploadCount += 1
          const key = targetFolder + file.name

          const chunkSize = 95 * 1024 * 1024
          // Files bigger than 100MB require multipart upload
          if (file.size > chunkSize) {
            const { uploadId, key } = (await apiHandler.multipartCreate(file, key, this.selectedBucket)).data

            let partNumber = 1
            const parts = []
            // console.log('total: ', file.size)
            // console.log('chunk: ', chunkSize)

            for (let start = 0; start < file.size; start += chunkSize) {
              const end = Math.min(start + chunkSize, file.size)
              const chunk = file.slice(start, end)
              // console.log(`${start} -> ${end}`)

              const { data } = await apiHandler.multipartUpload(uploadId, partNumber, this.selectedBucket, key, chunk, (progressEvent) => {
                console.log((start + progressEvent.loaded) * 100 / file.size)
                // self.$store.dispatch('setUploadProgress', {
                //   filename: file.name,
                //   progress: (start + progressEvent.loaded) * 100 / file.size
                // })  // TODO
              })

              parts.push(data)
              partNumber += 1
            }

            await apiHandler.multipartComplete(file, key, this.selectedBucket, parts, uploadId)
          } else {
            await apiHandler.uploadObjects(file, key, this.selectedBucket, (progressEvent) => {
              console.log(progressEvent.loaded * 100 / file.size)
              // self.$store.dispatch('setUploadProgress', {
              //   filename: file.name,
              //   progress: progressEvent.loaded * 100 / file.size
              // })  // TODO
            })
          }
        }
      }

      // this.$store.dispatch('makeToast', {
      //   message: `${totalFiles} Files uploaded successfully`, timeout: 5000
      // })

      this.$bus.emit('fetchFiles')
    },
    async traverseFileTree (item, path, folders, depth) {
      const self = this
      path = path || ''

      // Root files are handled outside
      if (item.isFile && depth > 0) {
        const filePromise = new Promise(function (resolve, reject) {
          item.file(function (file) {
            folders[path].push(file)

            resolve()
          })
        })

        await filePromise
      } else if (item.isDirectory) {
        const newPath = path ? path + '/' + item.name : item.name
        if (folders[newPath] === undefined) {
          folders[newPath] = []
        }

        // Get folder contents
        const dirReader = item.createReader()

        const promise = new Promise(function (resolve, reject) {
          dirReader.readEntries(async function (entries) {
            for (let i = 0; i < entries.length; i++) {
              await self.traverseFileTree(entries[i], newPath, folders, depth + 1)
            }
            resolve()
          })
        })

        await promise
      }
    },
    async drop (event) {
      if (!this.isHover) {
        return
      }

      // files uploaded on root
      const rootFiles = event.dataTransfer.files

      // folders and files
      const items = await event.dataTransfer.items
      const folders = {}

      for (const item of items) {
        // webkitGetAsEntry is where the magic happens
        const entry = item.webkitGetAsEntry()
        if (entry) {
          await this.traverseFileTree(entry, '', folders, 0)
        }
      }

      // Root files also include the root folders
      const cleanedRootFiles = []
      for (const rootFile of rootFiles) {
        if (folders[rootFile.name] === undefined) {
          cleanedRootFiles.push(rootFile)
        }
      }

      folders[''] = cleanedRootFiles

      // console.log(cleanedRootFiles)
      // console.log(folders)

      this.uploadFiles(folders)

      this.isHover = false
    }
  },
  mounted() {
    this.$bus.on('openFilesUploader', this.openFilesUploader)
    this.$bus.on('openFoldersUploader', this.openFoldersUploader)
  },
  beforeUnmount() {
    this.$bus.off('openFilesUploader')
    this.$bus.off('openFoldersUploader')
  },
  setup () {
    return {
      mainStore: useMainStore()
    }
  },
}
</script>

<style lang="scss" scoped>
.upload-box {
  .box {
    display: none;
  }

  .drop-files {
    align-items: center;
    justify-content: center;
    z-index: -1;
    display: flex;
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    flex-direction: column;
  }

  &.active {
    outline: 2px dashed black;
    border-radius: 5px;
    height: 100%;

    .box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px;
      border-radius: 5px;
      background: rgb(255 255 255 / 85%);
    }

    .drop-files {
      background: rgb(0 0 0 / 10%);
      z-index: 10;
    }

  }

}
</style>
