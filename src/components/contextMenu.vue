<template>
  <ul id="right-click-menu" ref="menu" tabindex="-1" v-if="viewMenu" @blur="closeMenu"
      :style="{top: top, left: left}">
    <li class="pointer" @click="open(file)"><i class="bi bi-box-arrow-in-right me-1"></i>Open</li>
    <li class="pointer" @click="notImplemented"><i class="bi bi-share-fill me-1"></i>Get Sharable Link</li>
    <li class="pointer" @click="renameFile(file)"><i class="bi bi-pencil-fill me-1"></i>Rename</li>
    <li class="pointer" @click="download(file)"><i class="bi bi-cloud-download-fill me-1"></i>Download</li>
    <li class="pointer" @click="deleteFile(file)"><i class="bi bi-trash-fill me-1"></i>Remove</li>
  </ul>
</template>

<script>
import Swal from 'sweetalert2'
import { saveAs } from 'file-saver'

export default {
  data: function () {
    return {
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
      // this.viewMenu = false
    },

    openMenu: function (e) {
      this.viewMenu = true

      this.$nextTick(function () {
        this.$refs.menu.focus()

        this.setMenu(e.y, e.x)
      }.bind(this))
      // e.preventDefault()
    },
    deleteFile (file) {
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
          this.$store.state.s3.deleteObject({
            Bucket: this.$store.state.activeBucket,
            Key: file.Key
          }).promise()
          self.$store.commit('refreshObjects')
        }
      })
    },
    renameFile (file) {
      const self = this

      Swal.fire({
        title: 'Rename file',
        input: 'text',
        inputValue: file.name,
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something!'
          }
        }
      }).then((data) => {
        if (data.isConfirmed === true) {
          self.$store.state.s3.copyObject({
            Bucket: self.$store.state.activeBucket,
            CopySource: `${self.$store.state.activeBucket}/${file.Key}`,
            Key: `${file.path}${data.value}`
          })
            .promise()
            .then(() => {
              self.$store.state.s3.deleteObject({
                Bucket: self.$store.state.activeBucket,
                Key: file.Key
              }).promise()
              self.$toast.open({
                message: 'File deleted',
                type: 'success'
              })
              self.$store.commit('refreshObjects')
            }
            )
            .catch((e) => console.error(e))
        }
      })
    },
    open (file) {
      const self = this
      this.$store.state.s3.getObject({
        Bucket: this.$store.state.activeBucket,
        Key: file.Key
      }, function (err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else {
          const blob = new Blob([data.Body], { type: data.ContentType })
          self.openedFile = {
            title: file.name,
            data: URL.createObjectURL(blob),
            contentType: data.ContentType
          }
        }
      })
    },
    download (file) {
      // TODO: implement download for fiels bigger than 2gb

      // const self = this
      this.$store.state.s3.getObject({
        Bucket: this.$store.state.activeBucket,
        Key: file.Key
      }, function (err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else {
          console.log(data)
          const blob = new Blob([data.Body], { type: data.ContentType })

          saveAs(blob, file.name)
        }
      })
    },
    notImplemented () {
      this.$toast.open({
        message: 'Not implemented yet',
        type: 'error'
      })
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
