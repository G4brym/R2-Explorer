<template>

  <div :class="{'upload-box': isHover}" @dragover.prevent="dragover" @dragleave.prevent="dragleave"
       @drop.prevent="drop">
    <slot></slot>
  </div>

  <input style="display: none" @change="inputFiles" type="file" name="files[]" ref="uploader" multiple directory="" webkitdirectory="" moxdirectory=""/>

</template>

<script>

import * as AWS from 'aws-sdk'

export default {
  data: function () {
    return {
      isHover: false,
      filelist: [] // Store our uploaded files
    }
  },
  methods: {
    openUploader () {
      this.$refs.uploader.click()
    },
    dragover (event) {
      this.isHover = true
    },
    dragleave (event) {
      this.isHover = false
    },
    inputFiles (event) {
      this.uploadFiles(event.target.files)
    },
    uploadFiles (files) {
      const self = this

      Array.from(files).forEach(obj => {
        const upload = new AWS.S3.ManagedUpload({
          params: {
            Bucket: self.$store.state.activeBucket,
            Key: self.$store.state.currentFolder + obj.name,
            Body: obj,
            ContentType: obj.type
          }
        })

        const promise = upload.promise()

        promise.then(
          function (data) {
            self.isHover = false
            self.$toast.open({
              message: 'File uploaded!',
              type: 'success'
            })
            self.$store.commit('refreshObjects')
            console.log('Successfully uploaded ', data)
          },
          function (err) {
            self.isHover = false
            self.$toast.open({
              message: 'Something went wrong!',
              type: 'error'
            })
            console.log('There was an error uploading your photo: ', err.message)
          }
        )
      })
    },
    drop (event) {
      event.preventDefault()
      // console.log('drop', event.dataTransfer.files)
      this.uploadFiles(event.dataTransfer.files)
    }
  }
}
</script>
