<template>
  <div class="left-side-menu" :class="{'active': $store.state.mobileSidebar}">
    <div id="sidebar-menu" class="h-100">
      <ul id="side-menu" class="h-100">
        <li>
          <template v-if="$store.state.config?.readonly">
            <button
              type="button"
              class="btn btn-danger w-100 waves-effect waves-light dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              :disabled="true"
            >
              <i class="bi bi-x-circle-fill me-1"></i> Readonly Mode
            </button>
          </template>
          <div v-else class="btn-group d-block mb-2">
            <button
              type="button"
              class="btn btn-success w-100 waves-effect waves-light dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              :disabled="$store.state.config?.readonly === true"
            >
              <i class="bi bi-plus-circle-fill me-1"></i> New
            </button>
            <div class="dropdown-menu font-16 w-100">
              <a class="dropdown-item pointer" @click="EventBus().$emit('newFolder')">
                <i class="bi bi-folder-plus me-1"></i> New Folder
              </a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item pointer" @click="EventBus().$emit('openFilesUploader')">
                <i class="bi bi-file-earmark-arrow-up me-1"></i> Upload Files
              </a>
              <a class="dropdown-item pointer" @click="EventBus().$emit('openFoldersUploader')">
                <i class="bi bi-folder2-open me-1"></i> Upload Folders
              </a>
            </div>
          </div>
        </li>

        <li class="menu-title mt-2">Buckets</li>

        <template v-for="bucket in $store.state.buckets" :key="bucket.Name">
          <li>
            <router-link
              :class="{ 'text-black': $store.state.activeBucket === bucket.Name }"
              class="list-group-item border-0"
              :to="{ name: 'bucket-home', params: { bucket: bucket.Name }}"
            >
              <i class="bi bi-bucket-fill me-2"></i>
              <span>{{ bucket.Name }}</span>
            </router-link>
          </li>
        </template>

        <li class="menu-title info">Info</li>

        <li>
          <a target="_blank" href="https://github.com/G4brym/R2-Explorer/issues/new">
            <i class="bi bi-info-square-fill me-2"></i>
            <span>Provide Feedback</span>
          </a>
        </li>

        <li v-if="updateAvailable">
          <a target="_blank" :href="updateUrl">
            <i class="bi bi-cloud-download-fill me-2"></i>
            <span>Update Available</span>
          </a>
        </li>
      </ul>

    </div>
    <!-- End Sidebar -->

    <div class="clearfix"></div>

  </div>
</template>

<script>
import axios from 'axios'
import EventBus from '@/EventBus.js'

export default {
  methods: {
    EventBus () {
      return EventBus
    }
  },
  data: function () {
    return {
      updateAvailable: false,
      updateUrl: 'https://github.com/G4brym/R2-Explorer',
      currentVersion: 'v0.0.1'
    }
  },
  created () {
    const self = this

    function normalizeVersion (version) {
      return version.replace('v', '')
    }

    function compareVersions (currectVersion, latestVersion) {
      return latestVersion.localeCompare(currectVersion, undefined, { numeric: true, sensitivity: 'base' }) === 1
    }

    axios.get('https://r2-explorer-api.massadas.com/api/releases/latest/').then((response) => {
      this.updateAvailable = compareVersions(
        normalizeVersion(self.currentVersion),
        normalizeVersion(response.data?.latest_version?.version)
      )

      if (this.updateAvailable && response.data?.latest_version?.url) {
        this.updateUrl = response.data?.latest_version?.url
      }
    })
  }
}
</script>

<style scoped lang="scss">
#side-menu {
  display: flex;
  flex-direction: column;

  .menu-title.info {
    margin-top: auto;
    margin-bottom: 0;
  }
}

.left-side-menu.active {
  display: block;
}
</style>
