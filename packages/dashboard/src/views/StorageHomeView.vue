<template>
  <base-layout>
    <bucket-explorer-wrapper>

      <drag-and-drop ref="uploader">
        <div class="card-body">
          <gallery v-if="$store.state.files && $store.state.folders"/>
          <div class="clearfix"></div>
        </div>
      </drag-and-drop>
      <loading/>
      <UploadingPopup/>

    </bucket-explorer-wrapper>
  </base-layout>
</template>

<script>
import Swal from 'sweetalert2'
import Gallery from '@/components/storage/Gallery.vue'
import DragAndDrop from '@/components/storage/DragAndDrop.vue'
import repo from '@/api'
import Loading from '@/components/loading'
import UploadingPopup from '@/components/storage/uploadingPopup.vue'
import EventBus from '@/EventBus'
import BucketExplorerWrapper from "@/components/BucketExplorerWrapper.vue";
import BaseLayout from "@/components/base/BaseLayout.vue";

export default {
  components: { BaseLayout, BucketExplorerWrapper, UploadingPopup, Loading, DragAndDrop, Gallery},
  methods: {
    newFolder() {
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
  mounted() {
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
  beforeUnmount() {
    EventBus.$off('newFolder')
    EventBus.$off('openFilesUploader')
    EventBus.$off('openFoldersUploader')
  },
  created() {
    this.$store.commit('changeTab', 'storage')
  }
}
</script>
