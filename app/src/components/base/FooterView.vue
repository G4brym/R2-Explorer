<template>
  <footer class="footer">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <div class="d-flex flex-row">
            <div class="me-auto text-md-end footer-links d-none d-sm-block">
              <a v-if="updateAvailable" class="fw-bold" target="_blank" :href="updateUrl">Update Available</a>
            </div>
            <div class="footer-links d-none d-sm-block">
              <a target="_blank" href="https://github.com/G4brym/R2-Explorer">About R2-Explorer</a>
              <a target="_blank" href="https://github.com/G4brym/R2-Explorer/issues/new">Provide Feedback</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import axios from 'axios'

export default {
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
