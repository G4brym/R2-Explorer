<template>
  <div v-if="Object.keys($store.state.uploadingFiles).length > 0" class="uploading-popup">
    <div class="card">
      <div class="card-header d-flex flex-row">
        Uploading {{ Object.keys($store.state.uploadingFiles).length }} files
        <button class="btn btn-primary btn-xs btn-close" @click="close"></button>
      </div>
      <div class="card-body">
        <table>
          <tbody>
          <tr class="table-active" v-for="(data, filename) in $store.state.uploadingFiles" :key="filename">
            <td class="progress-filename">{{ filename }}</td>
            <td style="width: 100px">
              <div v-if="data.progress === 100" class="upload-complete">
                <i class="bi bi-check-circle-fill"></i>
              </div>
              <div class="progress ms-2" v-else>
                <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" role="progressbar"
                     :aria-valuenow="data.progress || 0" aria-valuemin="0" aria-valuemax="100"
                     :style="{ 'width': `${data.progress || 0}%` }"></div>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    close: function () {
      this.$store.dispatch('clearUploadingFiles')
    }
  }
}
</script>

<style scoped lang="scss">
.uploading-popup {
  position: fixed;
  bottom: 0;
  right: 1em;
  // width: 25vw;
  z-index: 10;

  .card {
    overflow: auto;
    display: block;
    max-height: 30vh;
    margin-bottom: 0;
  }

  .card-body {
    border-left: 1px solid #F3F4F6;
  }

  .card-header {
    background-color: #38414A;
    color: #fff;
  }

  .progress {
    //height: 20px;
  }

  .progress-filename {
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 100%;
    display: block;
    overflow: hidden;
  }

  .btn-close {
    margin-right: 0;
    margin-left: auto;
  }

  .upload-complete {
    text-align: end;
    color: green;
  }
}
</style>
