<template>
  <template v-if="this.file">
    <div class="btn-group">
      <router-link
        class="btn btn-sm btn-light waves-effect"
        :to="{ name: `email-folder`, params: { bucket: $route.params.bucket, folder: $route.params.folder }}"
      >
        <i class="bi bi-arrow-return-left"></i>
      </router-link>
    </div>

    <h5 class="font-18">{{ file.subject }}</h5>

    <hr/>

    <div class="d-flex align-items-start mb-3 mt-1">
      <i class="bi bi-person-circle fs-3 me-2"></i>
      <div class="w-100">
        <small class="float-end">{{ file.date }}</small>
        <h6 class="m-0 font-14">{{ file.from.name }}</h6>
        <small class="text-muted">From: {{ file.from.address }}</small>
      </div>
    </div>

    <div class="overflow-auto" v-html="file.html || file.text"></div>

    <hr/>

    <template v-if="file.attachments.length > 0">

      <h5 class="mb-3">Attachments</h5>

      <div class="row">
        <div class="col-xl-4" v-for="attachment of file.attachments" :key="attachment.filename">
          <div class="card mb-1 shadow-none border">
            <div class="p-2">
              <div class="row align-items-center">
                <div class="col-auto">
                  <div class="avatar-sm">
                  <span class="avatar-title bg-soft-primary text-primary rounded">
                      .{{ attachment.filename.split('.').pop() }}
                  </span>
                  </div>
                </div>
                <div class="col ps-0">
                  <a href="javascript:void(0);" class="text-muted fw-bold">{{ attachment.filename }}</a>
                  <p class="mb-0">2.3 MB</p>
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
import axios from "axios";

export default {
  data: function () {
    return {
      file: null,
    }
  },
  methods: {
    axios,
    timeAgo(time) {
      return utils.timeSince(new Date(time))
    },
  },
  async mounted() {
    const self = this
    await this.$store.dispatch('refreshObjects')

    for (const file of this.$store.state.files) {
      if (file.hash === this.$route.params.file) {
        apiHandler.downloadFile(file).then(response => {
          const filename = file.key.split('.json')[0]
          for (const att of response.data.attachments) {
            att.downloadUrl = `${self.$store.state.serverUrl}/api/buckets/${self.$store.state.activeBucket}/${btoa(unescape(encodeURIComponent(`${filename}/${att.filename}`)))}`
          }
          self.file = response.data

          if (self.$store.state.serverVersionInt > 100)
          apiHandler.updateMetadata(file, {
            ...file.customMetadata,
            read: true,
          })
        })
      }
    }

  }
}
</script>
