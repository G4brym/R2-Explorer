<template>
  <q-page class="">
    <div class="">
      <q-infinite-scroll ref="infScroll" :disable="loadMoreAutomatically" @load="loadNextPage" :offset="250"
                         :debounce="100">
        <q-table
          ref="table"
          :rows="rows"
          :columns="columns"
          row-key="name"
          :loading="loading"
          :hide-pagination="true"
          :rows-per-page-options="[0]"
          :flat="true"
          table-class="email-list"
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

          <template v-slot:body-cell="prop">
            <q-td :props="prop" :class="rowClass(prop)">
              {{ prop.value }}
            </q-td>
          </template>

          <template v-slot:header>
            <tr class="q-mb-md">
              <th class="text-left">
                <q-btn color="green" icon="refresh" :loading="loading" @click="fetchFiles">
                  <template v-slot:loading>
                    <q-spinner
                      color="white"
                    />
                  </template>
                </q-btn>
              </th>
            </tr>
          </template>

          <template v-slot:body-cell-sender="prop">
            <q-td :props="prop" class="email-sender" :class="rowClass(prop)">
              <div class="flex column">
                <div class="flex">
                  <div class="mobile-title">
                    {{ prop.value }}
                  </div>
                  <div class="mobile-last-modified mobile-subject">
                    {{prop.row.lastModified}}
                    <q-icon v-if="prop.row.has_attachments" name="attachment" size="sm" color="black" />
                  </div>
                </div>
                <div class="email-subject mobile-subject">
                  {{prop.row.subject}}
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-subject="prop">
            <q-td :props="prop" class="email-subject" :class="rowClass(prop)">
              {{ prop.value }}
            </q-td>
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
            <q-td :props="prop" :class="rowClass(prop)">
              <q-icon v-if="prop.row.has_attachments" name="attachment" size="sm" color="black" />
              <q-icon v-else size="sm" color="white" />
            </q-td>
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
      timeInterval: null,
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
          name: "lastModified",
          required: true,
          align: "left",
          field: "lastModified",
          sortable: false
        },
        {
          name: "has_attachments",
          required: true,
          align: "left",
          field: "has_attachments",
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
    rowClass: function(prop) {
      return prop.row.customMetadata.read === "true" ? "email-read" : "email-unread";
    },
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
      try {
        await apiHandler.uploadObjects(blob, indexKey, this.selectedBucket);
      } catch (e) {}

      return updatedIndex;
    },
    loadNextPage: async function(index, done) {
      const page = this.indexCursors[index];

      if (page) {
        await this.loadIndexPage(page);
      } else {
        // No more pages to load
        this.loadMoreAutomatically = true;
        this.hasMorePages = false;
      }

      done();
    },
    fetchFiles: async function() {
      this.loading = true;
      this.rows = []

      const indexData = await this.getOrCreateIndex();

      this.indexCursors = indexData.cursors.reverse();

      await this.loadNextPage(0, () => {
      });
      await this.$refs.infScroll.setIndex(0);  // First page is 0
      await this.$refs.infScroll.poll();

      this.loadMoreAutomatically = false;

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
          const date = new Date(parseInt(obj.customMetadata.timestamp));

          return {
            ...obj,
            sender: obj.customMetadata.from_name || obj.customMetadata.from_address,
            subject: obj.customMetadata.subject,
            has_attachments: obj.customMetadata.has_attachments === "true",
            read: obj.customMetadata.read,
            lastModified: timeSince(date),
            timestamp: parseInt(obj.customMetadata.timestamp)
          };
        });

        for (const f of files.reverse()) {
          this.rows.push(f);
        }
      }
    }
  },
  unmounted () {
    clearInterval(this.timeInterval)
    this.timeInterval = null
  },
  mounted () {
    const self = this

    this.timeInterval = setInterval(() => {
      self.fetchFiles()
    }, 300000) // 5 minutes
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

<style>
.email-read {
  background-color: #f3f7f9;
  color: grey;
}

.email-unread {
  font-weight: 500;
}

.email-sender {
  width: 200px;
  overflow-x: hidden;
  white-space: nowrap;
  flex-shrink: 0;
  text-overflow: ellipsis;

  .mobile-subject {
    display: none;
  }

  @media (max-width: 992px) {
    width: 100%;
    height: auto !important;

    .mobile-subject {
      display: block;
    }

    .mobile-title {
      font-size: 18px;
    }

    .mobile-last-modified {
      margin-right: 0;
      margin-left: auto;
      align-self: end;
    }

    .email-subject {
      font-size: 14px;
      max-width: 100%;
    }
  }
}

.email-subject {
  overflow-x: hidden;
  white-space: nowrap;
  flex-grow: 1;
  text-overflow: ellipsis;
}

.email-list table, .email-list tbody, .email-list thead {
  width: 100%;
  display: block;
}

.email-list thead {
  th {
    border: 0;

     &:hover {
       border: 0;
     }
  }
}

.email-list td {
  vertical-align: middle !important;

  @media (max-width: 992px) {
    &:not(.email-sender) {
      display: none;
    }
  }
}

.email-list tbody tr {
  display: flex;
  width: 100%;
  justify-content: center;

//width: 100%; //display: block;

  &:hover {
    box-shadow: 0 2px 2px -2px gray;
    z-index: 10
  }
}
</style>
