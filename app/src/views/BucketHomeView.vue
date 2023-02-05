<template>
  <div class="row">
    <div class="col-12">
      <div class="card h-100">

        <drag-and-drop ref="uploader">
          <div class="card-body">
            <gallery v-if="$store.state.files && $store.state.folders"/>
            <div class="clearfix"></div>
          </div>
        </drag-and-drop>

      </div>
    </div>
  </div>

  <loading />
  <UploadingPopup />
</template>

<script>
import Swal from 'sweetalert2'
import Gallery from '@/components/Gallery'
import DragAndDrop from '@/components/DragAndDrop'
import repo from '@/api'
import Loading from '@/components/loading'
import UploadingPopup from '@/components/uploadingPopup.vue'
import EventBus from '@/EventBus'

export default {
  components: { UploadingPopup, Loading, DragAndDrop, Gallery },
  methods: {
    changeBucket (bucket) {
      this.$store.commit('changeBucket', bucket.Name)
      this.$store.dispatch('refreshObjects')
    },
    newFolder () {
      const self = this

      Swal.fire({
        title: 'New folder',
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something!'
          }
        }
      }).then((data) => {
        if (data.isConfirmed === true) {
          repo.createFolder(data.value).then((data) => {
            self.$store.dispatch('refreshObjects')

            this.$store.dispatch('makeToast', {
              message: 'Folder created', timeout: 5000
            })
          })
        }
      })
    }
  },
  created () {
    this.$watch(
      () => this.$store.state.buckets,
      (buckets) => {
        if (!this.$route.params.bucket) {
          this.$router.push({ name: 'bucket-home', params: { bucket: buckets[0].Name } })
        }
      }
    )

    if (this.$route.params.bucket) {
      this.$store.commit('changeBucket', this.$route.params.bucket)
      if (this.$route.params.folder) {
        this.$store.dispatch('navigate', decodeURIComponent(escape(atob(this.$route.params.folder))))
      } else {
        this.$store.dispatch('refreshObjects')
      }
    } else if (!this.$route.params.bucket && this.$store.state.buckets.length > 0) {
      this.$router.push({ name: 'bucket-home', params: { bucket: this.$store.state.buckets[0].Name } })
    }

    this.$watch(
      () => this.$route.params.bucket,
      (bucket, previousbucket) => {
        if (bucket !== previousbucket) {
          this.$store.commit('changeBucket', bucket)
          this.$store.dispatch('refreshObjects')
          this.$store.commit('toggleMobileSidebar', false)
        }
      }
    )
  },
  mounted () {
    const self = this

    EventBus.$on('newFolder', () => {
      self.newFolder()
    })
    EventBus.$on('openFilesUploader', () => {
      self.$refs.uploader.openFilesUploader()
    })
    EventBus.$on('openFoldersUploader', () => {
      self.$refs.uploader.openFoldersUploader()
    })
  },
  beforeUnmount () {
    EventBus.$off('newFolder')
    EventBus.$off('openFilesUploader')
    EventBus.$off('openFoldersUploader')
  }
}
</script>

<style scoped lang="scss">
@media (max-width: 992px) {
  .card-body {
    padding: 0;
  }
}
</style>
