<template>
  <base-layout>
    <bucket-explorer-wrapper>

      <div class="card-body">

        <email-side-bar/>

        <div>
          <email-list/>
        </div>

        <div class="clearfix"></div>
      </div>

    </bucket-explorer-wrapper>
  </base-layout>
</template>

<script>
import BucketExplorerWrapper from "@/components/BucketExplorerWrapper.vue";
import EmailSideBar from "@/components/email/EmailSideBar.vue";
import EmailList from "@/components/email/EmailList.vue";
import BaseLayout from "@/components/base/BaseLayout.vue";

export default {
  components: { BaseLayout, EmailList, EmailSideBar, BucketExplorerWrapper},
  created() {
    this.$store.commit('changeTab', 'email')

    if (this.$route.params.folder === undefined) {
      this.$router.push({name: 'email-folder', params: {bucket: this.$route.params.bucket, folder: 'inbox'}})
    }
  }
}
</script>
