<template>
  <q-dialog
    v-model="open"
    full-width
    full-height
    @hide="close"
  >
    <q-card class="flex column">
      <q-card-section class="row items-center q-p-sm bg-grey-3" style="font-size: 20px">

        <div>{{ filename }}</div>

        <template v-if="editMode">
          <q-btn icon="delete" label="Cancel" size="md" class="q-ml-md" color="red" dense @click="cancelEdit" />
          <q-btn icon="save" label="Save" size="md" class="q-ml-md" color="green" dense @click="saveEdit" />
        </template>
        <template v-else>
          <q-btn icon="edit" label="edit" size="md" class="q-ml-md" color="orange" dense @click="enableEdit" />
        </template>

        <q-space />
        <q-btn icon="close" size="md" round dense v-close-popup />
      </q-card-section>

      <q-card-section class="scroll" style="flex: 1">
        <template v-if="fileData === undefined && type">

          <div class="text-center q-my-lg">
            <q-spinner
              color="primary"
              size="3em"
            />
          </div>

          <div class="text-center q-my-lg">
            <q-linear-progress stripe size="10px" :value="downloadProgress" />
          </div>

        </template>
        <template v-else>
          <template v-if="editMode">
            <div class="flex column" style="height: 100%">
              <q-card class="bg-orange-2" flat square>
                <q-card-section>
                  File editing is still in tests!
                </q-card-section>
              </q-card>
              <div class="file-edit">
                <q-input
                  v-model="fileDataEdited"
                  filled
                  outlined
                  type="textarea"
                />
              </div>
            </div>
          </template>

          <template v-else-if="type === 'pdf'">
            <pdf-viewer :pdfUrl="fileData" />
          </template>

          <template v-else-if="type === 'image'">
            <img :src="fileData" class="preview-image" />
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

          <template v-else-if="fileData">
            <div class="flex column" style="height: 100%; flex-wrap: nowrap; max-width: 100%; line-break: anywhere;">
              <q-card class="bg-orange-2" flat square>
                <q-card-section>
                  This in a unknown file type, opening as text.
                </q-card-section>
              </q-card>
              <div class="file-edit">
                <div v-html="fileData.replaceAll('\n', '<br>')"></div>
              </div>
            </div>
          </template>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import PdfViewer from "components/preview/PdfViewer.vue";
import LogGz from "components/preview/logGz.vue";
import EmailViewer from "components/preview/EmailViewer.vue";
import { parseMarkdown } from "src/parsers/markdown";
import { apiHandler, bytesToMegabytes, decode, ROOT_FOLDER } from "src/appUtils";
import { useQuasar } from "quasar";

export default {
  components: {
    LogGz,
    PdfViewer,
    EmailViewer
  },
  data: function() {
    return {
      open: false,
      editMode: false,

      downloadProgress: 0,
      abortControl: undefined,
      type: undefined,
      file: undefined,
      filename: undefined,
      fileData: undefined,
      fileDataEdited: undefined,

      previewConfig: [
        {
          extensions: ["png", "jpg", "jpeg", "webp", "avif"],
          type: "image",
          downloadType: "objectUrl"
        },
        {
          extensions: ["mp3"],
          type: "audio",
          downloadType: "objectUrl"
        },
        {
          extensions: ["mp4", "ogg"],
          type: "video",
          downloadType: "objectUrl"
        },
        {
          extensions: ["pdf"],
          type: "pdf",
          downloadType: "objectUrl"
        },
        {
          extensions: ["txt"],
          type: "text",
          downloadType: "text"
        },
        {
          extensions: ["md"],
          type: "markdown",
          downloadType: "text"
        },
        {
          extensions: ["csv"],
          type: "csv",
          downloadType: "text"
        },
        {
          extensions: ["json"],
          type: "json",
          downloadType: "text"
        },
        {
          extensions: ["html"],
          type: "html",
          downloadType: "text"
        },
        {
          extensions: ["log.gz"],
          type: "logs",
          downloadType: "blob"
        },
        {
          extensions: ["eml"],
          type: "email",
          downloadType: "text"
        }
      ]
    };
  },
  methods: {
    getType(filename) {
      for (const config of this.previewConfig) {
        for (const extension of config.extensions) {
          if (filename.endsWith(extension)) {
            return { type: config.type, downloadType: config.downloadType };
          }
        }
      }

      // Open unknown files as text
      return {
        type: "unknown",
        downloadType: "text"
      }
    },
    async openFile(file) {
      if (bytesToMegabytes(file.size) > 200) {
        this.q.notify({
          message: "File is too big to preview.",
          color: "orange"
        });

        return;
      }

      const previewConfig = this.getType(file.name);
      // if (previewConfig === undefined) {
      //   this.q.notify({
      //     message: "File preview is not supported.",
      //     color: "orange"
      //   });
      //
      //   return;
      // }

      this.abortControl = new AbortController();

      await this.$router.push({
        name: "files-file",
        params: {
          bucket: this.$route.params.bucket,
          folder: this.$route.params.folder || ROOT_FOLDER,
          file: file.nameHash
        }
      });

      // This needs to be set before download to open the modal
      this.filename = file.name;
      this.file = file;
      this.open = true;

      if (previewConfig) {
        this.type = previewConfig.type;

        const response = await apiHandler.downloadFile(this.$route.params.bucket, file.key, previewConfig, (progressEvent) => {
          this.downloadProgress = progressEvent.loaded / progressEvent.total;
        }, this.abortControl);

        let data;
        if (previewConfig.downloadType === "objectUrl") {
          const blob = new Blob([response.data]);
          data = URL.createObjectURL(blob);
        } else if (previewConfig.downloadType === "blob") {
          data = response.data;
        } else {
          data = response.data;
        }

        this.fileData = data;
      }

    },
    close() {
      if (this.abortControl) {
        this.abortControl.abort();
      }

      this.cancelEdit();

      // console.log('call')
      if (this.$route.params.file) {
        if (this.$route.params.folder === ROOT_FOLDER) {

          // File was in root folder, mount files home
          this.$router.push({
            name: "files-home",
            params: {
              bucket: this.$route.params.bucket
            }
          });

        } else {

          // File was in folder, mount that folder
          this.$router.push({
            name: "files-folder",
            params: {
              bucket: this.$route.params.bucket,
              folder: this.$route.params.folder
            }
          });

        }
      }

      this.type = undefined;
      this.fileData = undefined;
      this.filename = undefined;
      this.abortControl = undefined;
      this.downloadProgress = 0;
    },
    markdownParser(text) {
      return parseMarkdown(text);
    },
    csvParser: function(text) {
      let result = "";
      const rows = text.split("\n");
      if (rows.length === 0) {
        return "<h2>Empty csv</h2>";
      }

      for (const [index, row] of rows.entries()) {
        let line = "";
        const columns = row.split(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g).filter(item => {
          return item !== "" && item !== ",";
        });

        for (const col of columns) {
          if (index === 0) {
            line += `<th>${col.replaceAll("\"", "")}</th>`;
          } else {
            line += `<td>${col.replaceAll("\"", "")}</td>`;
          }
        }

        result += `<tr>${line}</tr>`;
      }

      return `<table class="table">${result}</table>`;
    },

    // Edit functions
    enableEdit: function() {
      if (typeof this.fileData === 'object') {
        this.fileDataEdited = JSON.stringify(this.fileData, null, 2)
      } else {
        this.fileDataEdited = this.fileData;
      }
      this.editMode = true;
    },
    cancelEdit: function() {
      this.editMode = false;
      this.fileDataEdited = undefined;
    },
    validateEdit: function(type, content) {
      if (type === 'json') {
        try {
          JSON.parse(content)
          return true
        } catch (e) {
          return false
        }
      }

      return true
    },
    saveEdit: async function() {
      const isValid = this.validateEdit(this.type, this.fileDataEdited)
      if (!isValid) {
        this.q.notify({
          type: 'negative',
          message: `Content is not valid ${this.type}.`
        })
        return
      }

      const notif = this.q.notify({
        group: false,
        spinner: true,
        message: `Updating file...`,
        caption: '0%',
        timeout: 0
      })

      const blobProperties = {}
      if (this.file.httpMetadata?.contentType) {
        blobProperties['type'] = this.file.httpMetadata?.contentType
      }
      const newFile = new Blob([this.fileDataEdited], blobProperties);

      await apiHandler.uploadObjects(newFile, this.file.key, this.selectedBucket, (progressEvent) => {
        notif({
          caption: `${parseInt((progressEvent.loaded) * 100 / (newFile.size))}%`
        });
      });

      notif({
        icon: 'done', // we add an icon
        spinner: false, // we reset the spinner setting so the icon can be displayed
        caption: '100%',
        message: 'File updated!',
        timeout: 5000 // we will timeout it in 5s
      })

      this.cancelEdit()
      this.openFile(this.file)
    }
  },
  computed: {
    selectedBucket: function () {
      return this.$route.params.bucket
    },
  },
  setup() {
    return {
      q: useQuasar()
    };
  }
};
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

.file-edit {
  flex: 1;

  > .q-field {
    height: 100%;

    .q-field__control {
      height: 100%;

      textarea {
        resize: none;
      }
    }
  }
}
</style>
