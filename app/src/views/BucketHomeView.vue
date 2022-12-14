<template>
  <div class="row" style="min-height: 50em">
    <!-- Right Sidebar -->
    <div class="col-sm-12 col-md-3 mt-3">
      <sidebar-view @openUploader="$refs.uploader.openUploader()" @newFolder="newFolder" />
    </div>

    <div class="col-sm-12 col-md-9 mt-3">
      <div class="card h-100">
        <div class="card-body">
            <drag-and-drop ref="uploader">
              <gallery v-if="$store.state.files && $store.state.folders" />
            </drag-and-drop>

          <div class="clearfix"></div>
        </div>
      </div>
      <!-- end card -->
    </div>
    <!-- end Col -->
  </div>
  <!-- End row -->
</template>

<script>
import Swal from 'sweetalert2'
import Gallery from '@/components/Gallery'
import DragAndDrop from '@/components/DragAndDrop'
import repo from '@/repo'
import SidebarView from '@/components/base/SidebarView'

export default {
  components: { SidebarView, DragAndDrop, Gallery },
  methods: {
    changeBucket (bucket) {
      this.$store.commit('changeBucket', bucket.Name)
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
          const toast = self.$toast.open({
            message: 'Creating Folder...',
            type: 'warning'
          })

          repo.createFolder(data.value).then((data) => {
            self.$store.dispatch('refreshObjects')

            toast.dismiss()
            self.$toast.open({
              message: 'Folder created!',
              type: 'success'
            })
          })
        }
      })
    },
    newDisk () {
      const self = this

      Swal.fire({
        title: 'New Disk name',
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something!'
          }
          if (!value.match(/^[a-z0-9-]{1,61}$/)) {
            return 'This name is not valid!'
          }
        }
      }).then((data) => {
        if (data.isConfirmed === true) {
          const toast = self.$toast.open({
            message: 'Creating Disk...',
            type: 'warning'
          })

          repo.createDisk(data.value).then((resp) => {
            self.$store.dispatch('loadUserDisks')
            setTimeout(function () {
              self.$store.commit('changeBucket', data.value)
            }, 500)

            toast.dismiss()
            self.$toast.open({
              message: 'Disk created!',
              type: 'success'
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
    } else if (!this.$route.params.bucket && this.$store.state.buckets.length > 0) {
      this.$router.push({ name: 'bucket-home', params: { bucket: this.$store.state.buckets[0].Name } })
    }

    this.$watch(
      () => this.$route.params.bucket,
      (bucket, previousbucket) => {
        if (bucket !== previousbucket) { this.$store.commit('changeBucket', bucket) }
      }
    )
  }
}
</script>
