<template>
  <modal :show="type !== undefined" v-if="type !== undefined" @close="close">
    <template v-slot:header-title>
      {{ filename }}
    </template>

    <template v-slot:body>
      <template v-if="fileData === undefined">
        <div class="text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <h4 class="text-center">Loading File</h4>
      </template>
      <template v-else>
        <template v-if="type === 'pdf'">
          <pdf-viewer :pdfUrl="fileData"/>
        </template>

        <template v-else-if="type === 'image'">
          <img :src="fileData" class="preview-image"/>
        </template>

        <template v-else-if="type === 'text'">
          <div v-html="fileData.replaceAll('\n', '<br>')"></div>
        </template>

        <template v-else-if="type === 'markdown'">
          <div class="markdown" v-html="markdownParser(fileData)"></div>
        </template>

        <template v-else-if="type === 'csv'">
          <div class="markdown" v-html="csvParser(fileData)"></div>
        </template>

        <template v-else>
          <h4 class="text-center">Unsupported file type</h4>
        </template>
      </template>
    </template>
  </modal>
</template>

<script>
import PdfViewer from '@/components/PdfViewer'
import modal from './modal'
import { parseMarkdown } from '@/parsers/markdown'

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
      this.type = file.preview?.type
      this.fileData = file.data
      this.filename = file.name
    },
    close () {
      this.type = undefined
      this.fileData = undefined
      this.filename = undefined
    },
    markdownParser (text) {
      return parseMarkdown(text)
    },
    csvParser: function (text) {
      let result = ''
      const rows = text.split('\n')
      if (rows.length === 0) {
        return '<h2>Empty csv</h2>'
      }

      for (const [index, row] of rows.entries()) {
        let line = ''
        const columns = row.split(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g).filter(item => {
          return item !== '' && item !== ','
        })

        for (const col of columns) {
          if (index === 0) {
            line += `<th>${col.replaceAll('"', '')}</th>`
          } else {
            line += `<td>${col.replaceAll('"', '')}</td>`
          }
        }

        result += `<tr>${line}</tr>`
      }

      return `<table class="table">${result}</table>`
    }
  }
}
</script>

<style lang="scss">
.preview-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: auto;
}

.markdown > img {
  width: 100%;
  height: auto;
}
</style>
