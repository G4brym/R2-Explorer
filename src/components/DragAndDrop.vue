<template>

    <div :class="{'upload-box': isHover}" @dragover.prevent="dragover" @dragleave.prevent="dragleave" @drop.prevent="drop">
        <slot></slot>
    </div>

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
    dragover (event) {
      this.isHover = true
    },
    dragleave (event) {
      this.isHover = false
    },
    drop (event) {
      const self = this
      event.preventDefault()
      // console.log('drop', event.dataTransfer.files)
      Array.from(event.dataTransfer.files).forEach(obj => {
        const upload = new AWS.S3.ManagedUpload({
          params: {
            Bucket: self.$store.state.activeBucket,
            Key: self.$store.state.currentFolder + obj.name,
            Body: obj
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
    }
  }
}
</script>
