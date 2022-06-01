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
                <a class="dropdown-item" @click="notImplemented"><i class="bi bi-share-fill me-1 pointer"></i>Get
                  Sharable Link</a>
                <a class="dropdown-item" @click="notImplemented"><i
                  class="bi bi-pencil-fill me-1 pointer"></i>Rename</a>
                <a class="dropdown-item" @click="download(file)" :download="compiledfile"><i
                  class="bi bi-cloud-download-fill me-1 pointer"></i>Download</a>
                <a class="dropdown-item" @click="notImplemented"><i class="bi bi-trash-fill me-1 pointer"></i>Remove</a>
              </div>
            </div>
          </td>
        </tr>
      </template>

      <template v-else>
        <tr>
          <td colspan="100%">
            <div class="empty-list">
              <span class="title">This bucket is empty</span>
              <span class="desc">Drag and Drop files to upload</span>
            </div>

          </td>
        </tr>
      </template>

      </tbody>
    </table>
  </div>
  <a style="display: none" ref="downloader"></a>
</template>

<script>
import { saveAs } from 'file-saver'
import utils from '../utils'

export default {
  data: function () {
    return {
      compiledfile: undefined
    }
  },
  methods: {
    timeAgo: (time) => {
      return utils.timeSince(time)
    },
    bytesToSize: (time) => {
      return utils.bytesToSize(time)
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
