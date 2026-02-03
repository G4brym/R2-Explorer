<template>
  <q-scroll-area class="fit">
    <div class="q-pa-md" v-if="selectedFile">
      <!-- Header -->
      <div class="flex items-center justify-between q-mb-md">
        <div class="text-h6">File Details</div>
      </div>
          <!-- File Icon and Name -->
          <div class="text-center q-mb-md">
            <q-icon :name="selectedFile.icon" size="64px" :color="selectedFile.color" />
            <div class="text-subtitle1 q-mt-sm text-weight-medium">{{ selectedFile.name }}</div>
            <div v-if="selectedFile.type !== 'folder'" class="text-caption text-grey">{{ selectedFile.size }}</div>
          </div>

          <q-separator class="q-mb-md" />

          <!-- File Information -->
          <div class="q-mb-md">
            <div class="text-overline text-grey-7">Information</div>

            <q-list dense>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Type</q-item-label>
                  <q-item-label>{{ selectedFile.type === 'folder' ? 'Folder' : 'File' }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="selectedFile.type !== 'folder'">
                <q-item-section>
                  <q-item-label caption>Size</q-item-label>
                  <q-item-label>{{ selectedFile.size }} ({{ formatBytes(selectedFile.sizeRaw) }})</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Last Modified</q-item-label>
                  <q-item-label>{{ selectedFile.lastModified }}</q-item-label>
                  <q-item-label caption class="q-mt-xs">{{ formatRelativeTime(selectedFile.timestamp) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="selectedFile.httpMetadata?.contentType">
                <q-item-section>
                  <q-item-label caption>Content Type</q-item-label>
                  <q-item-label>{{ selectedFile.httpMetadata.contentType }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label caption>Path</q-item-label>
                  <q-item-label class="text-caption" style="word-break: break-all;">{{ selectedFile.key }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="selectedFile.httpMetadata?.etag">
                <q-item-section>
                  <q-item-label caption>ETag</q-item-label>
                  <q-item-label class="text-caption">{{ selectedFile.httpMetadata.etag }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Custom Metadata -->
          <div v-if="selectedFile.customMetadata && Object.keys(selectedFile.customMetadata).length > 0" class="q-mb-md">
            <q-separator class="q-mb-md" />
            <div class="text-overline text-grey-7">Custom Metadata</div>
            <q-list dense>
              <q-item v-for="(value, key) in selectedFile.customMetadata" :key="key">
                <q-item-section>
                  <q-item-label caption>{{ key }}</q-item-label>
                  <q-item-label class="text-caption" style="word-break: break-all;">{{ value }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- HTTP Metadata (if available) -->
          <div v-if="selectedFile.httpMetadata && hasHttpMetadata" class="q-mb-md">
            <q-separator class="q-mb-md" />
            <div class="text-overline text-grey-7">HTTP Metadata</div>
            <q-list dense>
              <q-item v-if="selectedFile.httpMetadata.cacheControl">
                <q-item-section>
                  <q-item-label caption>Cache Control</q-item-label>
                  <q-item-label class="text-caption">{{ selectedFile.httpMetadata.cacheControl }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="selectedFile.httpMetadata.contentDisposition">
                <q-item-section>
                  <q-item-label caption>Content Disposition</q-item-label>
                  <q-item-label class="text-caption">{{ selectedFile.httpMetadata.contentDisposition }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="selectedFile.httpMetadata.contentEncoding">
                <q-item-section>
                  <q-item-label caption>Content Encoding</q-item-label>
                  <q-item-label class="text-caption">{{ selectedFile.httpMetadata.contentEncoding }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="selectedFile.httpMetadata.contentLanguage">
                <q-item-section>
                  <q-item-label caption>Content Language</q-item-label>
                  <q-item-label class="text-caption">{{ selectedFile.httpMetadata.contentLanguage }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Actions -->
          <div class="q-mt-md">
            <q-separator class="q-mb-md" />
            <q-btn
              v-if="selectedFile.type !== 'folder'"
              color="primary"
              icon="download"
              label="Download"
              class="full-width q-mb-sm"
              @click="downloadFile"
              :disable="downloading"
              :loading="downloading"
            />
            <q-btn
              flat
              color="primary"
              icon="open_in_new"
              label="Open"
              class="full-width"
              @click="openFile"
            />
          </div>
    </div>

    <div v-else class="q-pa-md">
      <div class="text-center text-grey q-pa-xl">
        <q-icon name="folder_open" size="64px" color="grey-5" />
        <div class="q-mt-md text-h6 text-grey-7">No File Selected</div>
        <div class="text-body2 text-grey-6 q-mt-sm">Click on a file to view its details</div>
      </div>
    </div>
  </q-scroll-area>
</template>

<script>
import { defineComponent } from 'vue';
import { apiHandler } from '../../appUtils';

export default defineComponent({
  name: 'FileDetailsSidebar',
  data() {
    return {
      selectedFile: null,
      downloading: false,
    };
  },
  computed: {
    hasHttpMetadata() {
      if (!this.selectedFile?.httpMetadata) return false;
      const meta = this.selectedFile.httpMetadata;
      return meta.cacheControl || meta.contentDisposition ||
             meta.contentEncoding || meta.contentLanguage;
    }
  },
  methods: {
    open(file) {
      this.selectedFile = file;
    },
    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      if (!bytes) return 'N/A';

      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    formatRelativeTime(timestamp) {
      if (!timestamp) return '';

      const now = Date.now();
      const diff = now - timestamp;

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30);
      const years = Math.floor(months / 12);

      if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
      if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    },
    async downloadFile() {
      if (!this.selectedFile || this.selectedFile.type === 'folder') return;

      this.downloading = true;
      try {
        await apiHandler.downloadObjectFile(
          this.$route.params.bucket,
          this.selectedFile.key,
          this.selectedFile.name
        );
        this.$q.notify({
          type: 'positive',
          message: 'Download started',
        });
      } catch (error) {
        console.error('Error downloading file:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to download file',
        });
      } finally {
        this.downloading = false;
      }
    },
    openFile() {
      if (!this.selectedFile) return;
      // Emit event that the FilesFolderPage is listening to
      this.$emit('openObject', this.selectedFile);
    }
  },
  mounted() {
    this.$bus.on('openFileDetails', this.open);
  },
  beforeUnmount() {
    this.$bus.off('openFileDetails', this.open);
  }
});
</script>

<style scoped>
.q-item__label--caption {
  margin-top: 4px;
}
</style>
