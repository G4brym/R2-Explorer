<template>
  <div
    ref="dragContainer"
    class="upload-box"
    :class="{ 'active': isHover || false }"
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
  <input style="display: none" @change="inputFiles" type="file" name="files[]" ref="uploader" multiple />
</template>

<script>
import repo from '@/repo'

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
  methods: {
    openUploader () {
      this.$refs.uploader.click()
    },
    dragover (event) {
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
      console.log(event.dataTransfer)
      event.preventDefault()
      // console.log('drop', event.dataTransfer.files)
      this.uploadFiles(event.dataTransfer.files)
    }
  }
}
</script>
