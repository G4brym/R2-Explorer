<template>
  <ul id="right-click-menu" ref="menu" tabindex="-1" v-if="viewMenu" @blur="closeMenu"
      :style="{top: top, left: left}">
    <li class="pointer" v-if="canPreview" @click="openFile"><i class="bi bi-box-arrow-in-right me-1"></i>Open</li>
    <li class="pointer" @click="notImplemented" v-if="canShare"><i class="bi bi-share-fill me-1"></i>Get Sharable Link
    </li>
    <li class="pointer" @click="renameFile"><i class="bi bi-pencil-fill me-1"></i>Rename</li>
    <li class="pointer" @click="downloadFile" v-if="canDownload"><i class="bi bi-cloud-download-fill me-1"></i>Download
    </li>
    <li class="pointer" @click="deleteFile"><i class="bi bi-trash-fill me-1"></i>Remove</li>
  </ul>

</template>

<script>
import Swal from 'sweetalert2'
import { saveAs } from 'file-saver'
import repo from '@/repo'

export default {
  data: function () {
    return {
      file: undefined,
      canDownload: false,
      canPreview: false,
      canShare: false,
      viewMenu: false,
      top: '0px',
      left: '0px'
    }
  },

  methods: {
    setMenu: function (top, left) {
      const largestHeight = window.innerHeight - this.$refs.menu.offsetHeight - 25
      const largestWidth = window.innerWidth - this.$refs.menu.offsetWidth - 25

      if (top > largestHeight) top = largestHeight

      if (left > largestWidth) left = largestWidth

      this.top = top + 'px'
      this.left = left + 'px'
    },

    closeMenu: function () {
      this.viewMenu = false
    },

    openMenu: function (e, obj, canPreview = false, canDownload = true, canShare = true) {
      this.viewMenu = true
      this.file = obj
      this.canPreview = canPreview
      this.canDownload = canDownload
      this.canShare = canShare

      this.$nextTick(function () {
        this.$refs.menu.focus()

        this.setMenu(e.y, e.x)
      }.bind(this))
      // e.preventDefault()
    },
    deleteFile () {
      const self = this

      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          repo.deleteObject(self.file.path, self.file.name).then(() => {
            self.$toast.open({
              message: 'File deleted',
              type: 'success'
            })
            self.$store.dispatch('refreshObjects')
          })
        }

        self.closeMenu()
      })
    },
    renameFile () {
      const self = this

      Swal.fire({
        title: 'Rename file',
        input: 'text',
        inputValue: self.file.name,
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something!'
          }
        }
      }).then((data) => {
        if (data.isConfirmed === true) {
          repo.renameObject(self.file.name, data.value).then(() => {
            self.$toast.open({
              message: 'File renamed',
              type: 'success'
            })
            self.$store.dispatch('refreshObjects')
          })
        }

        self.closeMenu()
      })
    },
    openFile () {
      const self = this
      this.$store.state.s3.getObject({
        Bucket: this.$store.state.activeBucket,
        Key: self.file.Key
      }, function (err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else {
          const blob = new Blob([data.Body], { type: data.ContentType })
          self.$emit('openFile', {
            ...self.file,
            data: URL.createObjectURL(blob)
          })
          self.closeMenu()
        }
      })
    },
    downloadFile () {
      const self = this
      repo.getDownloadPresignUrl(self.file.name).then((response) => {
        saveAs(response.data.url, self.file.name)
      })
    },
    notImplemented () {
      this.$toast.open({
        message: 'Not implemented yet',
        type: 'error'
      })
      this.closeMenu()
    }
  }
}
</script>

<style lang="scss" scoped>
#right-click-menu {
  background: #FAFAFA;
  border: 1px solid #BDBDBD;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .2), 0 1px 5px 0 rgba(0, 0, 0, .12);
  display: block;
  list-style: none;
  margin: 0;
  padding: 0;
  position: fixed;
  //width: 250px;
  z-index: 999999;
}

#right-click-menu li {
  border-bottom: 1px solid #E0E0E0;
  margin: 0;
  padding: 5px;
}

#right-click-menu li:last-child {
  border-bottom: none;
}

#right-click-menu li:hover {
  background: #1E88E5;
  color: #FAFAFA;
}
</style>
