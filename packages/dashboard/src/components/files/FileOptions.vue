<template>
  <q-dialog v-model="deleteModal" @hide="reset">
    <q-card>
      <q-card-section class="row column" v-if="row">
        <q-avatar class="q-mb-md" icon="delete" color="red" text-color="white" />
        <span v-if="row.type === 'folder'" class="q-ml-sm">Are you sure you want to delete the folder <code>{{row.name}}</code>, and
          <code v-if="deleteFolderInnerFilesCount !== null">{{deleteFolderInnerFilesCount}}</code>
          <code v-else><q-spinner color="primary"/></code>
          files inside?</span>
        <span v-else class="q-ml-sm">Are you sure you want to delete the file <code>{{row.name}}</code>?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Delete" color="red" :loading="loading" @click="deleteConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="renameModal" @hide="reset">
    <q-card style="min-width: 300px;">
      <q-card-section class="row column" v-if="row">
        <q-avatar class="q-mb-md" icon="edit" color="orange" text-color="white" />
        <q-input v-model="renameInput" label="Standard" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Rename" color="orange" :loading="loading" @click="renameConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "stores/main-store";
import { apiHandler, decode, encode, ROOT_FOLDER } from "src/appUtils";
import { useQuasar } from "quasar";

export default defineComponent({
  name: 'FileOptions',
  data: function () {
    return {
      row: null,
      deleteFolderContents: [],
      deleteModal: false,
      renameModal: false,
      deleteFolderInnerFilesCount: null,
      newFolderName: '',
      renameInput: '',
      loading: false,
    }
  },
  methods: {
    deleteObject: async function(row) {
      this.deleteModal = true
      this.row = row
      if (row.type === 'folder') {
        this.deleteFolderContents = await apiHandler.fetchFile(this.selectedBucket, row.key, '')
        this.deleteFolderInnerFilesCount = this.deleteFolderContents.length
      }
    },
    renameObject: async function(row) {
      this.renameModal = true
      this.row = row
      // console.log(row)
      this.renameInput = row.name
    },
    renameConfirm: async function() {
      if (this.renameInput.length === 0) {
        return
      }

      this.loading = true
      await apiHandler.renameObject(this.selectedBucket, this.row.key, this.row.key.replace(this.row.name, this.renameInput))

      this.$bus.emit('fetchFiles')
      this.reset()
      this.q.notify({
        group: false,
        icon: 'done', // we add an icon
        spinner: false, // we reset the spinner setting so the icon can be displayed
        message: 'File renamed!',
        timeout: 2500 // we will timeout it in 2.5s
      })
    },
    deleteConfirm: async function() {
      if (this.row.type === 'folder') {
        // When deleting folders, first must copy the objects, because the popup close forces a reset on properties
        const originalFolder = { ...this.row }
        const folderContents = [...this.deleteFolderContents]
        const folderContentsCount = this.deleteFolderInnerFilesCount

        this.deleteModal = false

        const notif = this.q.notify({
          group: false,
          spinner: true,
          message: 'Deleting files...',
          caption: '0%',
          timeout: 0
        })

        for (const [i, innerFile] of folderContents.entries()) {
          if (innerFile.key) {
            await apiHandler.deleteObject(innerFile.key, this.selectedBucket)
          }
          notif({
            caption: `${parseInt(i*100/(folderContentsCount+1))}%`  // +1 because still needs to delete the folder
          })
        }

        await apiHandler.deleteObject(originalFolder.key, this.selectedBucket)

        notif({
          icon: 'done', // we add an icon
          spinner: false, // we reset the spinner setting so the icon can be displayed
          caption: '100%',
          message: 'Folder deleted!',
          timeout: 2500 // we will timeout it in 2.5s
        })
      } else {
        this.deleteModal = false
        await apiHandler.deleteObject(this.row.key, this.selectedBucket)
        this.q.notify({
          group: false,
          icon: 'done', // we add an icon
          spinner: false, // we reset the spinner setting so the icon can be displayed
          message: 'File deleted!',
          timeout: 2500 // we will timeout it in 2.5s
        })
      }

      this.$bus.emit('fetchFiles')
      this.reset()
    },
    reset: function() {
      this.loading = false
      this.deleteModal = false
      this.renameModal = false
      this.renameInput = ''
      this.row = null
      this.deleteFolderInnerFilesCount = null
      this.deleteFolderContents = []
    },
    onSubmit: async function() {
      await apiHandler.createFolder(this.selectedFolder + this.newFolderName + '/', this.selectedBucket)
      this.$bus.emit('fetchFiles')
      this.modal = false
    },
    open: function() {
      this.modal = true
    }
  },
  computed: {
    selectedBucket: function () {
      return this.$route.params.bucket
    },
    selectedFolder: function () {
      if (this.$route.params.folder && this.$route.params.folder !== ROOT_FOLDER) {
        return decode(this.$route.params.folder)
      }
      return ''
    },
  },
  setup() {
    return {
      mainStore: useMainStore(),
      q: useQuasar()
    };
  },
})
</script>

<style scoped>
code {
  background-color: #e9e9e9;
  padding: 0.25em;
}
</style>
