<template>
  <q-page class="">
    <div class="q-pa-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el style="cursor: pointer" v-for="obj in breadcrumbs" :key="obj.name" :label="obj.name" @click="breadcrumbsClick(obj)" />
      </q-breadcrumbs>
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
        @row-click="rowClick">

        <template v-slot:body-cell-name="prop">
          <td class="flex" style="align-items: center">
            <q-icon :name="prop.row.icon" size="sm" :color="prop.row.color" class="q-mr-xs" />
            {{prop.row.name}}
          </td>
        </template>

        <template v-slot:body-cell-options="">
          <td class="text-right">
            <q-btn round flat icon="more_vert" size="sm">
              <q-menu>
                <q-list style="min-width: 100px">
                  <q-item clickable v-close-popup>
                    <q-item-section>New tab</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section>New incognito tab</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup>
                    <q-item-section>Recent tabs</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section>History</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup>
                    <q-item-section>Downloads</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup>
                    <q-item-section>Settings</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup>
                    <q-item-section>Help &amp; Feedback</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </td>
        </template>
      </q-table>
    </div>
  </q-page>

  <file-preview ref="preview"/>
</template>

<script>
import { defineComponent } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";
import { bytesToSize, decode, encode, timeSince } from "../../appUtils";
import FilePreview from "components/preview/FilePreview.vue";

export default defineComponent({
  name: 'FilesIndexPage',
  components: { FilePreview },
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
      // TODO check if is root folder
      if (this.$route.params.folder) {
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
    breadcrumbsClick: function(obj) {
      this.$router.push({ name: `files-folder`, params: { bucket: this.selectedBucket, folder: encode(obj.path) }})
    },
    rowClick: function(evt, row, index) {
      if (row.type === 'folder') {
        this.$router.push({ name: `files-folder`, params: { bucket: this.selectedBucket, folder: encode(row.key) }})
      } else {
        console.log(row)
        this.$refs.preview.openFile(row)
      }
    },
    fetchFiles: async function () {
      const self = this
      this.loading = true
      let truncated = true
      let cursor = null
      let contentFiles = []
      let contentFolders = []

      while (truncated) {
        const response = await api.get(`/buckets/${this.selectedBucket}?include=customMetadata&include=httpMetadata`, {
          params: {
            delimiter: '/',
            prefix: this.selectedFolder && this.selectedFolder !== '/' ? encode(this.selectedFolder) : '',
            cursor: cursor
          }
        })

        truncated = response.data.truncated
        cursor = response.data.cursor

        if (response.data.objects) {
          const files = response.data.objects.filter(function(obj) {
            return !obj.key.endsWith('/')  // Remove selected folder
          }).map(function(obj) {
            const date = new Date(obj.uploaded)

            return {
              ...obj,
              hash: encode(obj.key),
              name: obj.key.replace(self.selectedFolder, ''),
              lastModified: timeSince(date),
              timestamp: date.getTime(),
              size: bytesToSize(obj.size),
              sizeRaw: obj.size,
              type: 'file',
              icon: 'article',
              color: 'grey',
            }
          }).filter(obj => {
            // Remove hidden files
            return !(this.mainStore.showHiddenFiles !== true && obj.name.startsWith('.'))
          })

          for (const f of files) {
            contentFiles.push(f)
          }
        }

        if (response.data.delimitedPrefixes) {
          const folders = response.data.delimitedPrefixes.map(function (obj) {
            return {
              name: obj.replace(self.selectedFolder, ''),
              hash: encode(obj.key),
              key: obj,
              lastModified: '--',
              timestamp: 0,
              size: '--',
              sizeRaw: 0,
              type: 'folder',
              icon: 'folder',
              color: 'orange',
            }
          }).filter(obj => {
            // Remove hidden files
            return !(this.mainStore.showHiddenFiles !== true && obj.name.startsWith('.'))
          })

          for (const f of folders) {
            contentFolders.push(f)
          }
        }
      }

      this.rows = [
        ...contentFolders,
        ...contentFiles
      ]
      this.loading = false
    }
  },
  created() {
    this.fetchFiles()
  },
  mounted() {
    this.$refs.table.sort('name')
  },
  setup () {
    return {
      mainStore: useMainStore()
    }
  },
})
</script>
