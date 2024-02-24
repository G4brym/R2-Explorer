<template>
  <q-page class="">
    <div class="q-pa-md">
      <q-infinite-scroll ref="infScroll" :disable="loadMoreAutomatically" @load="loadNextPage" :offset="250" :debounce="100">
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
              <h6 class="flex items-center justify-center">
                <q-icon name="alternate_email" color="orange" size="lg" />
                This bucket doesn't have Emails
              </h6>
            </div>
          </template>

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
        <template v-if="!hasMorePages">
          <div class="row justify-center q-my-md">
            <span>No more emails to load</span>
          </div>
        </template>
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { api } from "boot/axios";
import { useMainStore } from "stores/main-store";
import { apiHandler, encode, timeSince } from "../../appUtils";

export default defineComponent({
  name: "EmailFolderPage",
  data: function() {
    return {
      indexCursors: null,
      loading: false,
      loadMoreAutomatically: true,
      hasMorePages: true,
      rows: [],
      columns: [
        {
          name: "sender",
          required: true,
          field: "sender",
          align: "left",
          sortable: false
        },
        {
          name: "subject",
          required: true,
          field: "subject",
          align: "left",
          sortable: false
        },
        {
          name: "has_attachments",
          required: true,
          align: "left",
          field: "has_attachments",
          sortable: false
        },
        {
          name: "lastModified",
          required: true,
          align: "left",
          field: "lastModified",
          sortable: false
        }
      ]
    };
  },
  computed: {
    selectedBucket: function() {
      return this.$route.params.bucket;
    },
    selectedFolder: function() {
      return "inbox";
    }
  },
  watch: {
    selectedBucket(newVal) {
      this.fetchFiles();
    }
  },
  methods: {
    rowClick: function(evt, row, index) {
      const file = row.key.replace(/^.*[\\/]/, "");
      // const folder = row.key.replace(file, '')

      this.$router.push({
        name: `email-file`,
        params: { bucket: this.selectedBucket, folder: this.selectedFolder, file: encode(file) }
      });
    },
    createOrUpdateIndex: async function(currentIndex) {
      let truncated = true;

      // fallback when there's no previous index
      let cursor = null;
      let pageNum = 0;
      let indexData = {
        version: 1,
        cursors: []
      };

      if (currentIndex) {
        // There is a previous index
        indexData = currentIndex;
        if (currentIndex.cursors.length > 0) {
          // Pop last page, as its going to be updated
          const lastPage = currentIndex.cursors.pop();
          pageNum = lastPage.page;
          cursor = lastPage.cursor;
        }
      }

      while (truncated) {
        console.log(`Updating index page ${pageNum}`);
        const response = await api.get(`/buckets/${this.selectedBucket}?include=customMetadata&include=httpMetadata`, {
          params: {
            delimiter: "/",
            prefix: encode(`.r2-explorer/emails/${this.selectedFolder}/`),
            cursor: cursor
          }
        });

        indexData.cursors.push({
          page: pageNum,
          cursor: cursor,
          items: response.data.objects.length
        });

        // update cursor for next page
        cursor = response.data.cursor;
        truncated = response.data.truncated;
        pageNum++;
      }

      return indexData;
    },
    getOrCreateIndex: async function() {
      const indexKey = `.r2-explorer/emails/index-${this.selectedFolder}.json`;
      const fileData = await apiHandler.downloadFile(this.selectedBucket, indexKey, {}).then((obj) => obj.data).catch((obj) => null);

      const updatedIndex = await this.createOrUpdateIndex(fileData);

      const blob = new Blob([JSON.stringify(updatedIndex)], {
        type: "application/json"
      });
      await apiHandler.uploadObjects(blob, indexKey, this.selectedBucket);

      return updatedIndex;
    },
    loadNextPage: async function(index, done) {
      const page = this.indexCursors[index]

      if (page) {
        await this.loadIndexPage(page)
      } else {
        // No more pages to load
        this.loadMoreAutomatically = true
        this.hasMorePages = false
      }

      done()
    },
    fetchFiles: async function() {
      this.loading = true;

      const indexData = await this.getOrCreateIndex();

      this.indexCursors = indexData.cursors.reverse()

      await this.$refs.infScroll.setIndex(-1)  // First page is 0
      await this.$refs.infScroll.trigger()

      this.loadMoreAutomatically = false

      this.loading = false;
    },
    loadIndexPage: async function(page) {
      const response = await apiHandler.listObjects(
        this.selectedBucket,
        `.r2-explorer/emails/${this.selectedFolder}/`,
        "/",
        page.cursor
      );

      if (response.data.objects) {
        const files = response.data.objects.filter(function(obj) {
          return !obj.key.endsWith("/");  // Remove selected folder
        }).map(function(obj) {
          const date = new Date(obj.uploaded);

          return {
            ...obj,
            sender: obj.customMetadata.from_name || obj.customMetadata.from_address,
            subject: obj.customMetadata.subject,
            has_attachments: obj.customMetadata.has_attachments === "true",
            read: obj.customMetadata.read,
            lastModified: timeSince(date),
            timestamp: date.getTime()
          };
        });

        for (const f of files.reverse()) {
          this.rows.push(f);
        }
      }
    }
  },
  created() {
    this.fetchFiles();
  },
  setup() {
    return {
      mainStore: useMainStore()
    };
  }
});
</script>
