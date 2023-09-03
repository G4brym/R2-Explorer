<template>
  <div class="btn-group">
    <button class="btn btn-sm btn-light waves-effect" @click="$store.dispatch('refreshObjects')">
      <i class="bi bi-arrow-clockwise"></i>
    </button>
  </div>

  <div class="table-responsive table-files">
    <table class="table table-centered table-hover mb-0">
      <tbody>
      <template v-if="$store.state.files.length > 0">
        <tr class="pointer" v-for="file in $store.state.files" :key="file.key"
            :class="{'unread': file.customMetadata.read !== 'true'}"
            @click="$router.push({name: 'email-file', params: {bucket: this.$route.params.bucket, folder: 'inbox',
          file: file.hash}})"
        >
          <td class="col-name">
            <i class="bi bi-envelope-at"></i>
            <span class="ms-2">{{
                file.customMetadata.from_name || file.customMetadata.from_address
              }}</span>
          </td>
          <td>
            <span class="ms-2">{{ file.customMetadata.subject }}</span>
          </td>
          <td>
            {{ timeAgo(file.uploaded) }} ago
          </td>
        </tr>
      </template>

      <template v-else>
        <tr>
          <td colspan="100%">
            <div class="text-center">
              <p class="fs-3">This bucket don't have any emails yet!</p>
              <p class="fs-5">Learn how to setup the Email Explorer in the official documentation</p>
              <a target="_blank" href="https://r2explorer.dev/guides/setup-email-explorer/" class="fs-5">https://r2explorer.dev</a>
            </div>
          </td>
        </tr>
      </template>
      </tbody>
    </table>
  </div>

  <!--        <div class="row mt-3">-->
  <!--          <div class="col-7 mt-1">-->
  <!--            Showing 1 - 20 of 289-->
  <!--          </div> &lt;!&ndash; end col&ndash;&gt;-->
  <!--          <div class="col-5">-->
  <!--            <div class="btn-group float-end">-->
  <!--              <button type="button" class="btn btn-light btn-sm"><i class="bi bi-chevron-left"></i></button>-->
  <!--              <button type="button" class="btn btn-info btn-sm"><i class="bi bi-chevron-right"></i></button>-->
  <!--            </div>-->
  <!--          </div> &lt;!&ndash; end col&ndash;&gt;-->
  <!--        </div>-->
  <!-- end row-->
</template>
<script>
import utils from "@/utils";

export default {
  methods: {
    timeAgo(time) {
      return utils.timeSince(new Date(time))
    },
  },
  created() {
    this.$watch(
      () => this.$route.params.folder,
      (newFolder) => {
        if (this.$store.state.activeTab === 'email') {
          this.$store.dispatch('refreshObjects')
        }
      }
    )
  }
}
</script>

<style scoped>
.unread {
  font-weight: 600;
}
</style>
