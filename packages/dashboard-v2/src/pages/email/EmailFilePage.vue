<template>
  <template v-if="this.file">
  <div>
    <q-card>
      <q-card-section class="bg-grey-2 text-black" vertical>
          <q-btn-group unelevated>
            <q-btn push icon="arrow_back" :to="{ name: `email-folder`, params: { bucket: $route.params.bucket, folder: $route.params.folder }}">
              <q-tooltip>Back</q-tooltip>
            </q-btn>
            <q-btn push icon="chevron_left">
              <q-tooltip>More recent</q-tooltip>
            </q-btn>
            <q-btn push icon="chevron_right">
              <q-tooltip>More older</q-tooltip>
            </q-btn>
            <q-btn push icon="mark_email_unread">
              <q-tooltip>Mark email as unread</q-tooltip>
            </q-btn>
          </q-btn-group>
      </q-card-section>

      <q-card-section vertical>
        <h5 class="font-18">{{ file.subject }}</h5>
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
          <iframe v-if="file.html" frameborder="0" scrolling="no" class="w-100 d-block" @load="contentFinishedLoading"
                  ref="renderWindow"
                  :srcdoc="file.html"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  csp="script-src 'none'"
          />
          <div v-else v-html="file.text.replaceAll('\n', '<br>')"></div>
        </div>
      </q-card-actions>


      <q-card-actions vertical v-if="file.attachments.length > 0">
        <q-separator/>
        <h6 class="q-my-md">Attachments</h6>

        <div class="row">
          <div class="col-xl-4 col-lg-6 col-md-6" v-for="attachment of file.attachments" :key="attachment.filename">
            <div class="card mb-1 shadow-none border">
              <div class="p-2">
                <div class="row align-items-center">
                  <div class="col-auto">
                    <div class="avatar-sm">
                    <span class="avatar-title bg-soft-primary text-primary rounded">
                        .{{ attachment.filename.split(".").pop() }}
                    </span>
                    </div>
                  </div>
                  <div class="col ps-0">
                    <span class="text-muted fw-bold">{{ attachment.filename }}</span>
                    <!--                  <p class="mb-0">{{ bytesToSize(attachment.size) }}</p>-->
                  </div>
                  <div class="col-auto">
                    <a :href="attachment.downloadUrl" class="btn btn-link btn-lg text-muted">
                      <i class="bi bi-download"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
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

export default defineComponent({
  name: "EmailFolderPage",
  data: function() {
    return {
      file: null,
      timeInterval: null
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
      this.$refs.renderWindow.style.height = this.$refs.renderWindow.contentWindow.document.documentElement.scrollHeight + "px";
    },

    fetchEmail: async function() {
      const fileName = decode(this.selectedFile)
      const filePath = `.r2-explorer/emails/${this.selectedFolder}/${fileName}`

      const fileData = await apiHandler.downloadFile(this.selectedBucket, filePath, {})

      const filename = fileName.split(".json")[0];
      for (const att of fileData.data.attachments) {
        att.downloadUrl = `${this.mainStore.serverUrl}/api/buckets/${this.selectedBucket}/${encode(`${filename}/${att.filename}`)}`;
      }
      this.file = fileData.data;
      console.log(this.file)

      this.timeInterval = setInterval(function() {
        this.resizeIframe()
      }, 400);

      try {
        // Up to 1.0.6 there was a bug in the file head endpoint
        const fileHead = await apiHandler.headFile(this.selectedBucket, filePath)

        if (fileHead.data.customMetadata.read === false) {
          await apiHandler.updateMetadata(this.selectedBucket, filePath, {
            ...fileHead.data.customMetadata,
            read: true
          });
        }
      } catch (e) {
        // Empty
      }

    }
  },
  created() {
    this.fetchEmail();
  },
  setup() {
    return {
      mainStore: useMainStore()
    };
  }
});
</script>

<style scoped lang="scss">
iframe {
  width: 100%;
}
</style>
