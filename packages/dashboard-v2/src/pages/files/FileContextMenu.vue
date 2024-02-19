<template>
  <q-list style="min-width: 100px">
    <q-item clickable v-close-popup @click="openObject">
      <q-item-section>Open</q-item-section>
    </q-item>
    <q-item clickable v-close-popup @click="downloadObject" v-if="prop.row.type === 'file'">
      <q-item-section>Download</q-item-section>
    </q-item>
    <q-item clickable v-close-popup @click="renameObject" v-if="prop.row.type === 'file'">
      <q-item-section>Rename</q-item-section>
    </q-item>
    <q-item clickable v-close-popup @click="shareObject">
      <q-item-section>Get sharable link</q-item-section>
    </q-item>
    <q-item clickable v-close-popup @click="deleteObject">
      <q-item-section>Delete</q-item-section>
    </q-item>
  </q-list>
</template>
<script>
import { decode, encode, ROOT_FOLDER } from "src/appUtils";
import { useMainStore } from "stores/main-store";
import { useQuasar } from "quasar";

export default {
  name: "FileContextMenu",
  props: {
    prop: {},
  },
  computed: {
    selectedBucket: function() {
      return this.$route.params.bucket
    },
    selectedFolder: function() {
      if (this.$route.params.folder && this.$route.params.folder !== ROOT_FOLDER) {
        return decode(this.$route.params.folder)
      }
      return ''
    },
  },
  methods: {
    renameObject: function() {
      this.$emit('renameObject', this.prop.row)
    },
    openObject: function() {
      this.$emit('openObject', this.prop.row)
    },
    deleteObject: function() {
      this.$emit('deleteObject', this.prop.row)
    },
    shareObject: async function() {
      let url
      if (this.prop.row.type === 'folder') {
        url = window.location.origin + this.$router.resolve({
          name: 'files-folder',
          params: {
            bucket: this.selectedBucket,
            folder: encode(this.prop.row.key)
          }
        }).href
      } else {
        url = window.location.origin + this.$router.resolve({
          name: 'files-file',
          params: {
            bucket: this.selectedBucket,
            folder: this.selectedFolder ? encode(this.selectedFolder) : ROOT_FOLDER,
            file: this.prop.row.nameHash
          }
        }).href
      }

      try {
        await navigator.clipboard.writeText(url);
        this.q.notify({
          message: 'Link to file copied to clipboard!',
          timeout: 5000,
          type: 'positive',
        })
      } catch (err) {
        this.q.notify({
          message: 'Failed to copy: ' + err,
          timeout: 5000,
          type: 'negative',
        })
      }
    },
    downloadObject: function() {
      const link = document.createElement('a')
      link.download = this.prop.row.name

      link.href = `${this.mainStore.serverUrl}/api/buckets/${this.selectedBucket}/${encode(this.prop.row.key)}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  },
  setup () {
    return {
      mainStore: useMainStore(),
      q: useQuasar()
    }
  },
};
</script>
