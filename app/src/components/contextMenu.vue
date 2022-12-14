<template>
  <ul
    id="right-click-menu"
    ref="menu"
    tabindex="-1"
    v-if="viewMenu"
    @blur="closeMenu"
    :style="{ top: top, left: left }"
  >
    <li class="pointer" v-if="canPreview" @click="openFile"><i class="bi bi-box-arrow-in-right me-1"></i>Open</li>
    <!--    <li class="pointer" @click="notImplemented">-->
    <!--      <i class="bi bi-share-fill me-1"></i>Get Sharable Link-->
    <!--    </li>-->
    <li class="pointer" @click="renameFile"><i class="bi bi-pencil-fill me-1"></i>Rename</li>
    <li class="pointer">
      <a class="d-block w-100" ref="download-button" :href="downloadUrl" :download="name" @click="downloadFile">
        <i class="bi bi-cloud-download-fill me-1"></i>Download
      </a>
    </li>
    <li class="pointer" @click="deleteFile"><i class="bi bi-trash-fill me-1"></i>Remove</li>
  </ul>
</template>

<script>
import Swal from 'sweetalert2'
import repo from '@/repo'

export default {
  data: function () {
    return {
      file: undefined,
      canPreview: false,
      viewMenu: false,
      top: '0px',
      left: '0px',
      downloadUrl: '',
      name: ''
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
    downloadFile: function () {
      setTimeout(() => {
        this.closeMenu()
      }, 1000
      )
      // this.$refs['download-button'].click()
    },
    openMenu: function (e, obj) {
      this.viewMenu = true
      this.file = obj
      this.canPreview = obj.preview !== undefined
      this.name = obj.name

      let prefix = ''
      if (process.env.NODE_ENV === 'development') {
        prefix = 'http://localhost:8787'
      }
      this.downloadUrl = `${prefix}/api/buckets/${this.$store.state.activeBucket}/${btoa(unescape(encodeURIComponent(`${this.$store.state.currentFolder}${obj.name}`)))}`

      this.$nextTick(
        function () {
          this.$refs.menu.focus()

          this.setMenu(e.y, e.x)
        }.bind(this)
      )
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
      this.$emit('openFile', this.file)
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
  background: #fafafa;
  border: 1px solid #bdbdbd;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
  display: block;
  list-style: none;
  margin: 0;
  padding: 0;
  position: fixed;
  //width: 250px;
  z-index: 999999;
}

#right-click-menu li {
  border-bottom: 1px solid #e0e0e0;
  margin: 0;
  padding: 5px;
}

#right-click-menu li:last-child {
  border-bottom: none;
}

#right-click-menu li:hover {
  background: #1e88e5;
  color: #fafafa;
}

a {
  color: unset
}

a:hover {
  color: unset
}
</style>
