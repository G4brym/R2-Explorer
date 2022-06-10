<template>
  <h5 class="mb-3" v-if="$store.state.files.length > 0">Files</h5>

  <div>
    <table class="table table-centered table-nowrap mb-0">
      <thead class="table-light">
      <tr>
        <th class="border-0">Name</th>
        <th class="border-0">Last Modified</th>
        <th class="border-0">Size</th>
        <th class="border-0" style="width: 80px;">Action</th>
      </tr>
      </thead>
      <tbody>

      <template v-if="$store.state.files.length > 0">
        <tr v-for="file in $store.state.files" :key="file.Key">
          <td>
            <i data-feather="folder" class="icon-dual"></i>
            <span class="ms-2 fw-semibold"><a href="javascript: void(0);" class="text-reset"
                                              v-text="file.name"></a></span>
          </td>
          <td>{{ timeAgo(file.LastModified) }} ago</td>
          <td>{{ bytesToSize(file.Size) }}</td>
          <td>
            <div class="btn-group dropdown">
              <a href="javascript: void(0);" class="table-action-btn dropdown-toggle arrow-none btn btn-light btn-xs"
                 data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-three-dots-vertical"></i></a>
              <div class="dropdown-menu dropdown-menu-end">
                <a class="dropdown-item pointer" @click="open(file)"><i
                  class="bi bi-box-arrow-in-right me-1 pointer"></i>Open</a>
                <a class="dropdown-item pointer" @click="notImplemented"><i class="bi bi-share-fill me-1 pointer"></i>Get
                  Sharable Link</a>
                <a class="dropdown-item pointer" @click="renameFile(file)"><i
                  class="bi bi-pencil-fill me-1 pointer"></i>Rename</a>
                <a class="dropdown-item pointer" @click="download(file)"><i
                  class="bi bi-cloud-download-fill me-1 pointer"></i>Download</a>
                <a class="dropdown-item pointer" @click="deleteFile(file)"><i class="bi bi-trash-fill me-1 pointer"></i>Remove</a>
              </div>
            </div>
          </td>
        </tr>
      </template>

      <template v-else>
        <tr>
          <td colspan="100%">
            <div class="empty-list">
              <span class="title">This Folder is empty</span>
              <span class="desc">Drag and Drop files to upload</span>
            </div>

          </td>
        </tr>
      </template>

      </tbody>
    </table>

    <file-preview v-if="openedFile !== undefined" :fileData="openedFile" @close="openedFile = undefined"/>

  </div>
  <a style="display: none" ref="downloader"></a>
</template>

<script>
import { saveAs } from 'file-saver'
import utils from '../utils'
import FilePreview from '@/components/FilePreview'
import Swal from 'sweetalert2'

export default {
  data: function () {
    return {
      openedFile: undefined
    }
  },
  methods: {
    deleteFile (file) {
      const self = this

      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.$store.state.s3.deleteObject({
            Bucket: this.$store.state.activeBucket,
            Key: file.Key
          }).promise()
          self.$store.commit('refreshObjects')
        }
      })
    },
    renameFile (file) {
      const self = this

      Swal.fire({
        title: 'Rename file',
        input: 'text',
        inputValue: file.name,
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something!'
          }
        }
      }).then((data) => {
        if (data.isConfirmed === true) {
          self.$store.state.s3.copyObject({
            Bucket: self.$store.state.activeBucket,
            CopySource: `${self.$store.state.activeBucket}/${file.Key}`,
            Key: `${file.path}${data.value}`
          })
            .promise()
            .then(() => {
              self.$store.state.s3.deleteObject({
                Bucket: self.$store.state.activeBucket,
                Key: file.Key
              }).promise()
              self.$toast.open({
                message: 'File deleted',
                type: 'success'
              })
              self.$store.commit('refreshObjects')
            }
            )
            .catch((e) => console.error(e))
        }
      })
    },
    timeAgo (time) {
      return utils.timeSince(time)
    },
    bytesToSize (time) {
      return utils.bytesToSize(time)
    },
    open (file) {
      const self = this
      this.$store.state.s3.getObject({
        Bucket: this.$store.state.activeBucket,
        Key: file.Key
      }, function (err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else {
          const blob = new Blob([data.Body], { type: data.ContentType })
          self.openedFile = {
            title: file.name,
            data: URL.createObjectURL(blob),
            contentType: data.ContentType
          }
        }
      })
    },
    download (file) {
      // const self = this
      this.$store.state.s3.getObject({
        Bucket: this.$store.state.activeBucket,
        Key: file.Key
      }, function (err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else {
          console.log(data)
          const blob = new Blob([data.Body], { type: data.ContentType })

          saveAs(blob, file.name)
        }
      })
    },
    notImplemented () {
      this.$toast.open({
        message: 'Not implemented yet',
        type: 'error'
      })
    }
  },
  components: {
    FilePreview
  }
}
</script>

<style scoped lang="scss">
.empty-list {
  display: flex;
  flex-direction: column;
  margin: 4em 0;
  text-align: center;

  .title {
    font-weight: bold;
    font-size: 24px;
  }
}
</style>
