<template>
  <div
    :class="{ 'upload-box': isHover }"
    @dragover.prevent="dragover"
    @dragleave.prevent="dragleave"
    @drop.prevent="drop"
  >
    <slot></slot>
  </div>

  <!--  <input style="display: none" @change="inputFiles" type="file" name="files[]" ref="uploader" multiple directory="" webkitdirectory="" moxdirectory=""/>-->
  <input style="display: none" @change="inputFiles" type="file" name="files[]" ref="uploader" multiple />
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
    async uploadFiles (files) {
      this.isHover = false
      const self = this

      for (let i = 0; i < files.length; i++) {
        const toast = self.$toast.open({
          message: `Uploading file ${i + 1} from ${files.length}`,
          type: 'warning'
        })

        await repo.uploadObjects(files[i])

        toast.dismiss()
      }

      self.$toast.open({
        message: `${files.length} Files uploaded successfully`,
        type: 'success'
      })

      self.$store.dispatch('refreshObjects')
    },
    drop (event) {
      event.preventDefault()
      // console.log('drop', event.dataTransfer.files)
      this.uploadFiles(event.dataTransfer.files)
    }
  }
}
</script>
