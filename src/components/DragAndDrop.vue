<template>

  <div :class="{'upload-box': isHover}" @dragover.prevent="dragover" @dragleave.prevent="dragleave"
       @drop.prevent="drop">
    <slot></slot>
  </div>

  <input style="display: none" @change="inputFiles" type="file" name="files[]" ref="uploader" multiple directory="" webkitdirectory="" moxdirectory=""/>

</template>

<script>
import repo from '@/repo'

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
      repo.uploadObjects(files).then(() => {
        self.isHover = false
        self.$toast.open({
          message: 'File uploaded!',
          type: 'success'
        })
        self.$store.dispatch('refreshObjects')
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
