<template>
  <div class="d-md-flex justify-content-between align-items-center">
    <form class="search-bar">
      <div class="position-relative">
        <input type="text" class="form-control form-control-light" placeholder="Search files...">
        <span class="mdi mdi-magnify"></span>
      </div>
    </form>
    <div class="mt-2 mt-md-0">
      <file-tree :bucket-name="bucketName" :current-folder="currentFolder" @navigate="navigate" />
    </div>
  </div>

  <div class="mt-3">
    <folders :folders="folders" @navigate="navigate" />
  </div> <!-- end .mt-3-->

  <div class="mt-3">
    <files :files="files" />
  </div> <!-- end .mt-3-->

</template>
<script>
import Folders from '@/components/Folders'
import Files from '@/components/Files'
import FileTree from '@/components/FileTree'
export default {
  data: function () {
    return {
      bucketName: 'homebox',
      currentFolder: '',
      files: [],
      folders: []
    }
  },
  methods: {
    navigate (folder) {
      console.log(folder)
      this.currentFolder = folder
      this.refresh()
    },
    refresh () {
      const self = this
      this.$store.state.s3.listObjects({
        Bucket: this.bucketName,
        Prefix: this.currentFolder,
        Delimiter: '/'
      }, function (err, data) {
        if (err) {
          console.log('Error', err)
        } else {
          console.log(data)
          self.files = data.Contents.map(function (obj) {
            return {
              ...obj,
              name: obj.Key.replace(self.currentFolder, '')
            }
          })
          self.folders = data.CommonPrefixes
        }
      })
    }
  },
  components: { FileTree, Files, Folders },
  mounted () {
    this.refresh()
  }
}
</script>
