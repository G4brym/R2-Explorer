<template>
  <modal :show="type !== undefined" v-if="type !== undefined" @close="close">
    <template v-slot:header-title>
      {{ filename }}
    </template>

    <template v-slot:body>
      <template v-if="type === 'pdf'">
        <pdf-viewer :pdfUrl="fileData"/>
      </template>

      <template v-else-if="type === 'image'">
        <img :src="fileData" class="preview-image" />
      </template>

      <template v-else>
        <h4 class="text-center">Unsupported file type</h4>
      </template>
    </template>
  </modal>
</template>

<script>
import PdfViewer from '@/components/PdfViewer'
import modal from './modal'

export default {
  components: {
    PdfViewer,
    modal
  },
  data: function () {
    return {
      type: undefined,
      filename: undefined,
      fileData: undefined
    }
  },
  methods: {
    openPreview (file) {
      this.type = this.getType(file.extension)
      this.fileData = file.data
      this.filename = file.name
    },
    close () {
      this.type = undefined
      this.fileData = undefined
      this.filename = undefined
    },
    getType (extension) {
      if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
        return 'image'
      } else if (['pdf'].includes(extension)) {
        return 'pdf'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.preview-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: auto;
}
</style>
