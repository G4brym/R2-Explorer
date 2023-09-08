<template>
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <div class="d-md-flex justify-content-between align-items-center mobile-adjust">
            <div class="d-flex flex-row">
              <button type="button" class="btn btn-app" :class="{'active': $store.state.activeTab === 'storage'}"
                      @click="changeToStorage">
                Storage
              </button>
              <button type="button" class="btn btn-app ms-2" :class="{'active': $store.state.activeTab === 'email'}"
                      @click="changeToEmail">Email
              </button>
            </div>
            <div class="m-1 m-sm-0">
              <folder-tree/>
            </div>
          </div>
        </div>
      </div>
      <div class="card h-100">

        <slot></slot>

      </div>
    </div>
  </div>
</template>

<script>
import FolderTree from "@/components/FolderTree.vue";
import EventBus from "@/EventBus";

export default {
  components: {FolderTree},
  methods: {
    changeToStorage() {
      this.$store.commit('changeTab', 'storage')
      this.$router.push({name: 'storage-home', params: {bucket: this.$route.params.bucket}})
    },
    changeToEmail() {
      this.$store.commit('changeTab', 'email')
      this.$router.push({name: 'email-folder', params: {bucket: this.$route.params.bucket, folder: 'inbox'}})
    }
  },
  async created() {
    if (this.$route.params.bucket) {
      this.$store.commit('changeBucket', this.$route.params.bucket)
      if (this.$route.params.folder) {

        if (this.$route.params.folder !== 'IA==') {  // IA== is empty space
          if (this.$store.state.activeTab === 'email') {
            await this.$store.dispatch('navigate', this.$route.params.folder)
            await this.$store.dispatch('refreshObjects')
          } else {
            await this.$store.dispatch('navigate', decodeURIComponent(escape(atob(this.$route.params.folder))))
          }
        } else {
          await this.$store.dispatch('refreshObjects')
        }

        if (this.$route.params.file) {
          EventBus.$emit('openFile', decodeURIComponent(escape(atob(this.$route.params.file))))
        }

      } else {
        this.$store.dispatch('refreshObjects')
      }
    }

    this.$watch(
      () => this.$route.params.bucket,
      (bucket, previousBucket) => {
        if (bucket !== previousBucket) {
          this.$store.commit('changeBucket', bucket)
          this.$store.dispatch('refreshObjects')
          this.$store.commit('toggleMobileSidebar', false)
        }
      }
    )
  },
}
</script>

<style scoped lang="scss">
@media (max-width: 992px) {
  .card-body {
    padding: 0;
  }
}
</style>
