<template>
  <q-dialog
    :v-model="type !== undefined"
    full-width
    full-height
    @close="close"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ filename }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <template v-if="fileData === undefined">
          <h4 class="text-center">Loading File</h4>
          <div class="progress mb-2">
            <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" role="progressbar"
                 :aria-valuenow="downloadProgress || 0" aria-valuemin="0" aria-valuemax="100"
                 :style="{ 'width': `${downloadProgress || 0}%` }"></div>
          </div>
        </template>
        <template v-else>
          <template v-if="type === 'pdf'">
            <pdf-viewer :pdfUrl="fileData"/>
          </template>

          <template v-else-if="type === 'image'">
            <img :src="fileData" class="preview-image"/>
          </template>

          <template v-else-if="type === 'audio'">
            <div class="text-center">
              <audio controls>
                <source :src="fileData">
                Your browser does not support the audio element.
              </audio>
            </div>
          </template>

          <template v-else-if="type === 'video'">
            <div class="text-center">
              <video controls style="max-width: 100%; height: auto">
                <source :src="fileData">
                Your browser does not support the video tag.
              </video>
            </div>
          </template>

          <template v-else-if="type === 'text'">
            <div v-html="fileData.replaceAll('\n', '<br>')"></div>
          </template>

          <template v-else-if="type === 'json'">
            <pre v-html="JSON.stringify(fileData, null, 2)"></pre>
          </template>

          <template v-else-if="type === 'html'">
            <pre v-html="fileData"></pre>
          </template>

          <template v-else-if="type === 'markdown'">
            <div class="markdown" v-html="markdownParser(fileData)"></div>
          </template>

          <template v-else-if="type === 'csv'">
            <div class="markdown" v-html="csvParser(fileData)"></div>
          </template>

          <template v-else-if="type === 'logs'">
            <log-gz :filedata="fileData" />
          </template>

          <template v-else-if="type === 'email'">
            <email-viewer :filedata="fileData" />
          </template>

          <template v-else>
            <h4 class="text-center">Unsupported file type</h4>
          </template>
        </template>
      </q-card-section>

      <q-card-actions align="right" class="bg-white text-teal">
        <q-btn flat label="OK" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import PdfViewer from "components/preview/PdfViewer.vue";
import LogGz from "components/preview/logGz.vue";
import EmailViewer from "components/preview/EmailViewer.vue";
import { parseMarkdown } from "src/parsers/markdown";

export default {
  components: {
    LogGz,
    PdfViewer,
    EmailViewer,
  },
  data: function () {
    return {
      downloadProgress: 0,
      abortControl: undefined,
      type: undefined,
      filename: undefined,
      fileData: undefined
    }
  },
  methods: {
    openFile(file) {
      if (utils.bytesToMegabytes(file.size) > 200) {
        this.$store.dispatch('makeToast', {
          message: 'File is too big to preview', timeout: 5000
        })

        return
      }
      this.abortControl = new AbortController()

      if (this.$route.params.file === undefined) {
        this.$router.push({
          name: 'storage-file',
          params: {
            bucket: this.$route.params.bucket,
            folder: this.$route.params.folder || 'IA==',  // IA== is a space
            file: file.hash
          }
        })
      }

      this.type = file.preview.type
      repo.downloadFile(file, (progressEvent) => {
        this.downloadProgress = (progressEvent.loaded * 100) / progressEvent.total
      }, this.abortControl).then((response) => {
        let data
        if (file.preview.downloadType === 'objectUrl') {
          const blob = new Blob([response.data])
          data = URL.createObjectURL(blob)
        } else if (file.preview.downloadType === 'blob') {
          data = response.data
        } else {
          data = response.data
        }

        const prevFile = {
          ...file,
          data
        }

        this.type = prevFile.preview?.type
        this.fileData = prevFile.data
        this.filename = prevFile.name
      })
    },
    close() {
      if (this.abortControl) {
        this.abortControl.abort()
      }

      if (this.$route.params.file) {
        this.$router.push({
          name: 'storage-folder',
          params: {
            bucket: this.$route.params.bucket,
            folder: this.$route.params.folder || 'IA==',  // IA== is a space
          }
        })
      }

      this.type = undefined
      this.fileData = undefined
      this.filename = undefined
      this.abortControl = undefined
      this.downloadProgress = 0
    },
    markdownParser(text) {
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
