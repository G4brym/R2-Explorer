<template>
  <modal :show="fileData !== undefined" @close="$emit('close')">
    <template v-slot:header-title>
      {{ fileData.title }}
    </template>

    <template v-slot:body>
      <template v-if="fileData.contentType.substring('pdf')">
        <pdf-viewer :pdfUrl="fileData.data"/>
      </template>
      <template v-else>
        <h4>Unsupported file type</h4>
      </template>
    </template>
  </modal>
</template>

<script>
import PdfViewer from '@/components/PdfViewer'
import modal from './modal'

export default {
  props: ['fileData'],
  components: {
    PdfViewer,
    modal
  }
}
</script>
