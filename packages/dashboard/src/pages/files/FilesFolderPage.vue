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
          table-class="file-list"
          @row-dblclick="openRowClick"
          @row-click="openRowDlbClick"
        >

          <template v-slot:loading>
              <div class="full-width q-my-lg">
                  <h6 class="flex items-center justify-center">
                      <q-spinner
                              color="primary"
                              size="xl"
                      />
                  </h6>
              </div>
          </template>

          <template v-slot:no-data>
            <div class="full-width q-my-lg" v-if="!loading">
              <h6 class="flex items-center justify-center"><q-icon name="folder" color="orange" size="lg" />This folder is empty</h6>
            </div>
          </template>

          <template v-slot:body-cell-name="prop">
            <td class="flex" style="align-items: center">
              <q-icon :name="prop.row.icon" size="sm" :color="prop.row.color" class="q-mr-xs" />
              {{prop.row.name}}
            </td>
          </template>

          <template v-slot:body-cell="prop">
            <q-td :props="prop">
              {{prop.value}}
            </q-td>
            <q-menu
              touch-position
              context-menu
            >
              <FileContextMenu :prop="prop" @openObject="openObject" @deleteObject="$refs.options.deleteObject" @renameObject="$refs.options.renameObject" />
            </q-menu>
          </template>

          <template v-slot:body-cell-options="prop">
            <td class="text-right">
              <q-btn round flat icon="more_vert" size="sm">
                <q-menu>
                  <FileContextMenu :prop="prop" @openObject="openObject" @deleteObject="$refs.options.deleteObject" @renameObject="$refs.options.renameObject" />
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
import { useMainStore } from "stores/main-store";
import { apiHandler, decode, encode, ROOT_FOLDER } from "../../appUtils";
import FilePreview from "components/preview/FilePreview.vue";
import DragAndDrop from "components/utils/DragAndDrop.vue";
import FileOptions from "components/files/FileOptions.vue";
import { useQuasar } from "quasar";
import FileContextMenu from "pages/files/FileContextMenu.vue";

export default defineComponent({
  name: 'FilesIndexPage',
  components: { FileContextMenu, FileOptions, DragAndDrop, FilePreview },
  data: function () {
    return {
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
          name: this.selectedBucket,
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
          name: this.selectedBucket,
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
    openRowClick: function(evt, row, index) {
      evt.preventDefault()
      this.openObject(row)
    },
    openRowDlbClick: function(evt, row, index) {
      evt.preventDefault()
      this.$bus.emit("openFileDetails", row);
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
    renameObject: function(row) {
      if (row.type === 'folder') {
        this.$router.push({ name: `files-folder`, params: { bucket: this.selectedBucket, folder: encode(row.key) }})
      } else {
        // console.log(row)
        this.$refs.preview.openFile(row)
      }
    },
    fetchFiles: async function () {
      this.loading = true

      this.rows = await apiHandler.fetchFile(this.selectedBucket, this.selectedFolder, '/')
      this.loading = false
    },
    openPreviewFromKey: async function () {
      let key = `${decode(this.$route.params.file)}`
      if (this.selectedFolder && this.selectedFolder !== ROOT_FOLDER) {
        key = `${this.selectedFolder}${decode(this.$route.params.file)}`
      }

      const file = await apiHandler.headFile(this.selectedBucket, key)
      this.$refs.preview.openFile(file)
    }
  },
  created() {
    this.fetchFiles()
  },
  mounted() {
    this.$refs.table.sort('name')

    this.$bus.on('fetchFiles', this.fetchFiles)

    if (this.$route.params.file) {
      this.openPreviewFromKey()
    }
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

<style>
.file-list table , .file-list tbody , .file-list thead {
  width: 100%;
  display: block;
}


.file-list td:first-of-type, .file-list th:first-of-type {
  overflow-x: hidden;
  white-space: nowrap;
  flex-grow: 1;
  text-overflow: ellipsis;
}

.file-list tr {
  display: flex;
  width: 100%;
  justify-content: center;

}
</style>
