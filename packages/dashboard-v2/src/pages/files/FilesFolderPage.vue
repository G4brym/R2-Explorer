<template>
  <q-page class="">
    <div class="q-pa-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el style="cursor: pointer" v-for="obj in breadcrumbs" :key="obj.name" :label="obj.name" @click="breadcrumbsClick(obj)" />
      </q-breadcrumbs>

      <drag-and-drop ref="uploader">

        <q-table
          ref="table"
          :rows="rows"
          :columns="columns"
          row-key="name"
          :loading="loading"
          :hide-pagination="true"
          :rows-per-page-options="[0]"
          column-sort-order="da"
          :flat="true"
          @row-click="openRowMenu"
          @row-contextmenu="openRowMenu"
        >

          <template v-slot:body-cell-name="prop">
            <td class="flex" style="align-items: center">
              <q-icon :name="prop.row.icon" size="sm" :color="prop.row.color" class="q-mr-xs" />
              {{prop.row.name}}
            </td>
          </template>

          <template v-slot:body-cell-options="prop">
            <td class="text-right">
              <q-btn round flat icon="more_vert" size="sm">
                <q-menu :ref="(el) => setItemRef(el, prop.rowIndex)">
                  <q-list style="min-width: 100px">
                    <q-item clickable v-close-popup @click="openObject(prop.row)">
                      <q-item-section>Open</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="downloadObject(prop.row)" v-if="prop.row.type === 'file'">
                      <q-item-section>Download</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="shareObject(prop.row)">
                      <q-item-section>Get sharable link</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="$refs.options.deleteObject(prop.row)">
                      <q-item-section>Delete</q-item-section>
                    </q-item>
                    <q-separator />
                  </q-list>
                </q-menu>
              </q-btn>
            </td>
          </template>
        </q-table>

      </drag-and-drop>

    </div>
  </q-page>

  <file-preview ref="preview"/>
  <file-options ref="options" />
</template>

<script>
import { defineComponent } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";
import { apiHandler, bytesToSize, decode, encode, ROOT_FOLDER, timeSince } from "../../appUtils";
import FilePreview from "components/preview/FilePreview.vue";
import DragAndDrop from "components/utils/DragAndDrop.vue";
import FileOptions from "components/files/FileOptions.vue";
import { useQuasar } from "quasar";

export default defineComponent({
  name: 'FilesIndexPage',
  components: { FileOptions, DragAndDrop, FilePreview },
  data: function () {
    return {
      rowMenu: [],
      loading: false,
      rows: [],
      columns: [
        {
          name: 'name',
          required: true,
          label: 'Name',
          align: 'left',
          field: 'name',
          sortable: true,
          sort: (a, b, rowA, rowB) => {
            if (rowA.type === 'folder') {
              if (rowB.type === 'folder') {
                // both are folders
                return a.localeCompare(b)
              } else {
                // only first is folder
                return 1
              }
            } else if (rowB.type === 'folder') {
              // only second is folder
              return -1
            } else {
              // none is folder
              return a.localeCompare(b)
            }
          }
        },
        {
          name: 'lastModified',
          required: true,
          label: 'Last Modified',
          align: 'left',
          field: 'lastModified',
          sortable: true,
          sort: (a, b, rowA, rowB) => {
            return rowA.timestamp - rowB.timestamp
          }
        },
        {
          name: 'size',
          required: true,
          label: 'Size',
          align: 'left',
          field: 'size',
          sortable: true,
          sort: (a, b, rowA, rowB) => {
            return rowA.sizeRaw - rowB.sizeRaw
          }
        },
        {
          name: 'options',
          label: '',
          sortable: false,
        },
      ]
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
    breadcrumbs: function () {
      if (this.selectedFolder) {
        return [{
          name: "Home",
          path: '/'
        }, ...this.selectedFolder.split('/')
          .filter((obj) => obj !== '')
          .map((item, index, arr) => {
            return {
              name: item,
              path: arr.slice(0, index + 1).join('/').replace('Home/', '') + '/'
            }
          })
        ]
      } else {
        return [{
          name: "Home",
          path: '/'
        }]
      }
    }
  },
  watch: {
    selectedBucket(newVal) {
      this.fetchFiles()
    },
    selectedFolder(newVal) {
      this.fetchFiles()
    },
  },
  methods: {
    setItemRef(el, index) {
      if (el) {
        this.rowMenu[index] = el
      }
    },
    openRowMenu: function(evt, row, index) {
      evt.preventDefault()
      this.rowMenu[index].show()
    },
    breadcrumbsClick: function(obj) {
      this.$router.push({ name: `files-folder`, params: { bucket: this.selectedBucket, folder: encode(obj.path) }})
    },
    rowClick: function(evt, row) {
      if (row.type === 'folder') {
        this.$router.push({ name: `files-folder`, params: { bucket: this.selectedBucket, folder: encode(row.key) }})
      } else {
        // console.log(row)
        this.$refs.preview.openFile(row)
      }
    },
    openObject: function(row) {
      if (row.type === 'folder') {
        this.$router.push({ name: `files-folder`, params: { bucket: this.selectedBucket, folder: encode(row.key) }})
      } else {
        // console.log(row)
        this.$refs.preview.openFile(row)
      }
    },
    shareObject: async function(row) {
      let url
      if (row.type === 'folder') {
        url = window.location.origin + this.$router.resolve({
          name: 'files-folder',
          params: {
            bucket: this.selectedBucket,
            folder: encode(row.key)
          }
        }).href
      } else {
        url = window.location.origin + this.$router.resolve({
          name: 'files-file',
          params: {
            bucket: this.selectedBucket,
            folder: encode(this.selectedFolder || ROOT_FOLDER),
            file: row.nameHash
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
    downloadObject: function(row) {
      const link = document.createElement('a')
      link.download = row.name

      link.href = `${this.mainStore.serverUrl}/api/buckets/${this.selectedBucket}/${encode(row.key)}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    fetchFiles: async function () {
      this.loading = true

      this.rows = await apiHandler.fetchFile(this.selectedBucket, this.selectedFolder, '/')
      this.loading = false
    }
  },
  created() {
    this.fetchFiles()
  },
  mounted() {
    this.$refs.table.sort('name')

    this.$bus.on('fetchFiles', this.fetchFiles)
  },
  beforeUnmount() {
    this.$bus.off('fetchFiles')
  },
  setup () {
    return {
      mainStore: useMainStore(),
      q: useQuasar()
    }
  },
})
</script>
