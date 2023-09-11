<template>
  <template v-if="this.file">
    <div>
      <div class="btn-group">
        <router-link
          class="btn btn-sm btn-light waves-effect"
          :to="{ name: `email-folder`, params: { bucket: $route.params.bucket, folder: $route.params.folder }}"
        >
          <i class="bi bi-arrow-return-left"></i>
        </router-link>
      </div>

      <h5 class="font-18">{{ file.subject }}</h5>

      <hr />

      <div class="d-flex align-items-start mb-3 mt-1">
        <i class="bi bi-person-circle fs-3 me-2"></i>
        <div class="w-100">
          <small class="float-end">{{ file.date }}</small>
          <h6 class="m-0 font-14">{{ file.from.name }}</h6>
          <small class="text-muted">From: {{ file.from.address }}</small>
        </div>
      </div>

      <div class="overflow-auto d-block email-wrapper">
        <iframe v-if="file.html" frameborder="0" scrolling="no" class="w-100 d-block" @load="contentFinishedLoading" ref="renderWindow"
                :srcdoc="file.html"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                csp="script-src 'none'"
        />
        <div v-else v-html="file.text.replaceAll('\n', '<br>')"></div>
      </div>

      <template v-if="file.attachments.length > 0">

      <hr />

        <h5 class="mb-3">Attachments</h5>

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
      </template>
      <!-- end row-->

      <!--  <div class="mt-5">-->
      <!--    <a href="" class="btn btn-secondary me-2"><i class="mdi mdi-reply me-1"></i> Reply</a>-->
      <!--    <a href="" class="btn btn-light">Forward <i class="mdi mdi-forward ms-1"></i></a>-->
      <!--  </div>-->
    </div>
  </template>

  <template v-else>
    <div class="text-center">
      <div class="lds-dual-ring"></div>
    </div>
  </template>

</template>
<script>
import utils from "@/utils";
import apiHandler from "@/api";

export default {
  data: function() {
    return {
      file: null,
      timeInterval: null
    };
  },
  methods: {
    timeAgo(time) {
      return utils.timeSince(new Date(time));
    },
    contentFinishedLoading() {
      clearInterval(this.timeInterval)
      this.timeInterval = null

      this.resizeIframe()
    },
    resizeIframe() {
      this.$refs.renderWindow.style.height = this.$refs.renderWindow.contentWindow.document.documentElement.scrollHeight + "px";
    },
    bytesToSize(time) {
      return utils.bytesToSize(time);
    }
  },
  async mounted() {
    const self = this;
    await this.$store.dispatch("refreshObjects");

    for (const file of this.$store.state.files) {
      if (file.hash === this.$route.params.file) {
        apiHandler.downloadFile(file).then(response => {
          const filename = file.key.split(".json")[0];
          for (const att of response.data.attachments) {
            att.downloadUrl = `${self.$store.state.serverUrl}/api/buckets/${self.$store.state.activeBucket}/${btoa(unescape(encodeURIComponent(`${filename}/${att.filename}`)))}`;
          }
          self.file = response.data;

          self.timeInterval = setInterval(function() {
            self.resizeIframe()
          }, 400);

          apiHandler.updateMetadata(file, {
            ...file.customMetadata,
            read: true
          });
        });
      }
    }

  }
};
</script>

<style scoped lang="scss">
@media (max-width: 992px) {
  .email-wrapper {
    margin: 0 -1.5rem
  }
}
</style>
