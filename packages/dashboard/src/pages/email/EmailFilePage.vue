<template>
  <template v-if="this.file">
  <div>
    <q-card>
      <q-card-section class="bg-grey-2 text-black" vertical>
          <q-btn-group unelevated>
            <q-btn push icon="arrow_back" :to="{ name: `email-folder`, params: { bucket: $route.params.bucket, folder: $route.params.folder }}">
              <q-tooltip>Back</q-tooltip>
            </q-btn>
<!--            <q-btn push icon="chevron_left">-->
<!--              <q-tooltip>More recent</q-tooltip>-->
<!--            </q-btn>-->
<!--            <q-btn push icon="chevron_right">-->
<!--              <q-tooltip>More older</q-tooltip>-->
<!--            </q-btn>-->
            <template v-if="fileHead">
              <q-btn push icon="mark_email_unread" @click="markAsUnread" v-if="fileHead.customMetadata.read === 'true'">
                <q-tooltip>Mark email as unread</q-tooltip>
              </q-btn>
              <q-btn push icon="mark_email_read" @click="markAsRead" v-else>
                <q-tooltip>Mark email as read</q-tooltip>
              </q-btn>
            </template>
          </q-btn-group>
      </q-card-section>

      <q-card-section vertical>
        <h5 class="font-18 q-my-none">{{ file.subject }}</h5>
      </q-card-section>

      <q-card-section horizontal class="q-px-sm">
        <div class="d-flex row">
          <q-icon name="account_circle" size="xl" class="q-mr-sm"/>
          <div class="d-flex column">
            <span>{{ file.from.name }} <small class="text-muted">&lt;{{ file.from.address }}></small></span>
            <span>to {{ file.to[0].address }}</span>
          </div>
        </div>

        <div class="q-ml-auto">
          <small class="">{{ file.date }} ({{timeSince(new Date(file.date))}})</small>
        </div>
      </q-card-section>

      <q-card-actions vertical>
        <div class="overflow-auto d-block email-wrapper">
          <iframe v-if="srcdoc" frameborder="0" scrolling="no" class="w-100 d-block" @load="contentFinishedLoading"
                  ref="renderWindow"
                  id="renderWindow"
                  :srcdoc="srcdoc"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  csp="script-src 'none'"
          />
          <div v-else v-html="file.text.replaceAll('\n', '<br>')"></div>
        </div>
      </q-card-actions>


      <q-card-actions vertical v-if="attachments.length > 0">
        <q-separator/>
        <h6 class="q-my-md">Attachments</h6>

        <div class="row attachments">
            <div v-for="attachment of file.attachments" class="col-md-4 col-sm-12" :key="attachment.filename">

              <q-card>
                <q-card-section class="q-pa-sm flex" style="align-items: center">
                  <q-icon name="description" size="md" color="blue" class="q-mr-sm"/>
                  {{ attachment.filename }}
                  <q-btn color="white" text-color="black" icon="download" class="q-mr-0 q-ml-auto" @click="downloadAtt(attachment)" />
                </q-card-section>
              </q-card>

            </div>
        </div>
      </q-card-actions>
    </q-card>

  </div>
  </template>

    <template v-else>
      <div class="text-center q-my-lg">
        <q-spinner
          color="primary"
          size="3em"
        />
      </div>
    </template>

</template>

<script>
import { defineComponent } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";
import { apiHandler, decode, encode, timeSince } from "../../appUtils";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "EmailFolderPage",
  data: function() {
    return {
      srcdoc: null,
      file: null,
      fileHead: null,
      timeInterval: null,
      attachments: []
    };
  },
  computed: {
    selectedBucket: function() {
      return this.$route.params.bucket;
    },
    selectedFolder: function() {
      return this.$route.params.folder;
    },
    selectedFile: function() {
      return this.$route.params.file;
    },
    filePath: function() {
      const fileName = decode(this.selectedFile)
      return `.r2-explorer/emails/${this.selectedFolder}/${fileName}`
    }
  },
  watch: {
    selectedBucket(newVal) {
      this.$router.push({ name: `email-folder`, params: { bucket: newVal, folder: encode(this.selectedFolder) }})
    }
  },
  methods: {
    timeSince,
    contentFinishedLoading() {
      clearInterval(this.timeInterval)
      this.timeInterval = null

      this.resizeIframe()
    },
    resizeIframe() {
      if (this.$refs.renderWindow) {
        this.$refs.renderWindow.style.height = this.$refs.renderWindow.contentWindow.document.documentElement.scrollHeight + "px";
      }
    },

    fetchEmail: async function() {
      const self = this
      const fileName = decode(this.selectedFile)

      const fileData = await apiHandler.downloadFile(this.selectedBucket, this.filePath, {})

      const filename = fileName.split(".json")[0];

      this.file = fileData.data;
      let htmlContent = fileData.data.html

      if (htmlContent) {
        // Add target blank to all links
        htmlContent = htmlContent.replaceAll(/<a(.*?)>(.*?)<\/a>/gi, '<a$1 target="_blank">$2</a>');

        // Inject attachment url and replace in html to point to correct path
        for (const att of fileData.data.attachments) {
          att.display = true
          att.downloadUrl = `${this.mainStore.serverUrl}/api/buckets/${this.selectedBucket}/${encode(`.r2-explorer/emails/${this.selectedFolder}/${filename}/${att.filename}`)}`;

          let contentId = att.contentId
          if (contentId){
            if (contentId.startsWith('<') && contentId.endsWith('>')){
              contentId = contentId.substring(1, contentId.length-1);
            }

            const matchString = `cid:${contentId}`
            if (htmlContent.includes(matchString)) {
              htmlContent = htmlContent.replaceAll(`cid:${contentId}`, att.downloadUrl)
              att.display = false
            }
          }
        }

        this.srcdoc = htmlContent
      }

      this.attachments = fileData.data.attachments.filter((obj) => obj.display)

      apiHandler.headFile(this.selectedBucket, this.filePath).then(async (obj) => {
        if (obj.customMetadata.read === 'false') {
          self.fileHead = await apiHandler.updateMetadata(self.selectedBucket, self.filePath, {
            ...obj.customMetadata,
            read: true
          });
        } else {
          self.fileHead = obj
        }
      })

      setTimeout(function() {
        self.contentFinishedLoading()
      }, 10000)

      this.timeInterval = setInterval(function() {
        self.resizeIframe()
      }, 400);
    },
    markAsUnread: async function () {
      this.fileHead = await apiHandler.updateMetadata(this.selectedBucket, this.filePath, {
        ...this.fileHead.customMetadata,
        read: false
      });

      this.q.notify({
        group: false,
        icon: 'done', // we add an icon
        spinner: false, // we reset the spinner setting so the icon can be displayed
        message: 'Email marked as unread!',
        timeout: 2500 // we will timeout it in 2.5s
      })
    },
    markAsRead: async function () {
      this.fileHead = await apiHandler.updateMetadata(this.selectedBucket, this.filePath, {
        ...this.fileHead.customMetadata,
        read: true
      });

      this.q.notify({
        group: false,
        icon: 'done', // we add an icon
        spinner: false, // we reset the spinner setting so the icon can be displayed
        message: 'Email marked as read!',
        timeout: 2500 // we will timeout it in 2.5s
      })
    },
    downloadAtt: function(attachment) {
      console.log(attachment)
      // return
      const link = document.createElement('a')
      link.download = attachment.filename

      link.href = attachment.downloadUrl

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  },
  created() {
    this.fetchEmail();
  },
  setup() {
    return {
      mainStore: useMainStore(),
      q: useQuasar()
    };
  }
});
</script>

<style scoped lang="scss">
iframe {
  width: 100%;
}

.attachments {
  gap: 10px;

  @media (max-width: 992px) {
    flex-direction: column;
  }
}
</style>
