<template>
  <q-page class="">
    <div class="q-pa-md">
      <q-table
        ref="table"
        :rows="rows"
        :columns="columns"
        row-key="name"
        :loading="loading"
        :hide-pagination="true"
        :rows-per-page-options="[0]"
        :flat="true"
        @row-click="rowClick">

        <template v-slot:body-cell-has_attachments="prop">
          <td>
            <q-icon v-if="prop.row.has_attachments" name="attachment" size="sm" color="black" />
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
</template>

<script>
import { defineComponent } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";
import { encode, timeSince } from "../../appUtils";

export default defineComponent({
  name: 'EmailFolderPage',
  data: function () {
    return {
      loading: false,
      rows: [],
      columns: [
        {
          name: 'sender',
          required: true,
          field: 'sender',
          align: 'left',
          sortable: false
        },
        {
          name: 'subject',
          required: true,
          field: 'subject',
          align: 'left',
          sortable: false
        },
        {
          name: 'has_attachments',
          required: true,
          align: 'left',
          field: 'has_attachments',
          sortable: false,
        },
        {
          name: 'lastModified',
          required: true,
          align: 'left',
          field: 'lastModified',
          sortable: false,
        },
      ]
    }
  },
  computed: {
    selectedBucket: function () {
      return this.$route.params.bucket
    },
  },
  watch: {
    selectedBucket(newVal) {
      this.fetchFiles()
    },
  },
  methods: {
    rowClick: function(evt, row, index) {
      console.log(row)
    },
    fetchFiles: async function () {
      const self = this
      this.loading = true
      let truncated = true
      let cursor = null
      let contentFiles = []

      while (truncated) {
        const response = await api.get(`/buckets/${this.selectedBucket}?include=customMetadata&include=httpMetadata`, {
          params: {
            delimiter: '/',
            prefix: encode('.r2-explorer/emails/inbox/'),
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
              sender: obj.customMetadata.from_name || obj.customMetadata.from_address,
              subject: obj.customMetadata.subject,
              has_attachments: obj.customMetadata.has_attachments === 'true',
              read: obj.customMetadata.read,
              lastModified: timeSince(date),
              timestamp: date.getTime(),
            }
          })

          for (const f of files) {
            contentFiles.push(f)
          }
        }
      }

      this.rows = contentFiles
      this.loading = false
    }
  },
  created() {
    this.fetchFiles()
  },
  setup () {
    return {
      mainStore: useMainStore()
    }
  },
})
</script>
