<template>
  <q-dialog v-model="deleteModal" @hide="deleteReset">
    <q-card>
      <q-card-section class="row column" v-if="deleteRow">
        <q-avatar class="q-mb-md" icon="delete" color="red" text-color="white" />
        <span v-if="deleteRow.type === 'folder'" class="q-ml-sm">Are you sure you want to delete the folder <code>{{deleteRow.name}}</code>, and
          <code v-if="deleteFolderInnerFilesCount !== null">{{deleteFolderInnerFilesCount}}</code>
          <code v-else><q-spinner color="primary"/></code>
          files inside?</span>
        <span v-else class="q-ml-sm">Are you sure you want to delete the file <code>{{deleteRow.name}}</code>?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Delete" color="red" @click="deleteConfirm" />
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
      deleteRow: null,
      deleteFolderContents: [],
      deleteModal: false,
      deleteFolderInnerFilesCount: null,
      newFolderName: ''
    }
  },
  methods: {
    deleteObject: async function(row) {
      this.deleteModal = true
      this.deleteRow = row
      if (row.type === 'folder') {
        this.deleteFolderContents = await apiHandler.fetchFile(this.selectedBucket, row.key, '')
        this.deleteFolderInnerFilesCount = this.deleteFolderContents.length
      }
    },
    deleteConfirm: async function() {
      this.deleteModal = false

      if (this.deleteRow.type === 'folder') {
        const notif = this.q.notify({
          group: false,
          spinner: true,
          message: 'Deleting files...',
          caption: '0%',
          timeout: 0
        })

        console.log(this.deleteFolderContents)
        for (const [i, innerFile] of this.deleteFolderContents.entries()) {
          if (innerFile.key) {
            await apiHandler.deleteObject(innerFile.key, this.selectedBucket)
          }
          notif({
            caption: `${parseInt(i*100/(this.deleteFolderInnerFilesCount+1))}%`  // +1 because still needs to delete the folder
          })
        }
        await apiHandler.deleteObject(this.deleteRow.key, this.selectedBucket)

        notif({
          icon: 'done', // we add an icon
          spinner: false, // we reset the spinner setting so the icon can be displayed
          caption: '100%',
          message: 'Folder deleted!',
          timeout: 2500 // we will timeout it in 2.5s
        })
      } else {
        await apiHandler.deleteObject(this.deleteRow.key, this.selectedBucket)
        this.q.notify({
          group: false,
          icon: 'done', // we add an icon
          spinner: false, // we reset the spinner setting so the icon can be displayed
          message: 'File deleted!',
          timeout: 2500 // we will timeout it in 2.5s
        })
      }

      this.$bus.emit('fetchFiles')
      this.deleteReset()
    },
    deleteReset: function() {
      this.deleteModal = false
      this.deleteRow = null
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
