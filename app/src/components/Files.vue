<template>
  <h5 class="mb-3 mobile-adjust" v-if="$store.state.files.length > 0">Files</h5>

  <div class="table-responsive table-files">
    <table class="table table-centered mb-0">
      <thead class="table-light">
      <tr>
        <th class="border-0">Name</th>
        <th class="border-0">Last Modified</th>
        <th class="border-0 d-none d-lg-table-cell">Size</th>
      </tr>
      </thead>
      <tbody>
      <template v-if="$store.state.files.length > 0">
        <tr :class="{'pointer': file.preview}" @click="(file.preview) ? openFile(file): null"
            v-for="file in $store.state.files" :key="file.Key" @contextmenu.prevent="openMenu($event, file)">
          <td class="col-name">
            <i class="bi bi-file font-16" :class="'bi-filetype-' + file.extension"></i>
            <span class="ms-2 fw-semibold"
            ><span class="text-reset" v-text="file.name"></span
            ></span>
          </td>
          <td>{{ timeAgo(file.LastModified) }} ago</td>
          <td class="d-none d-lg-table-cell">{{ bytesToSize(file.Size) }}</td>
        </tr>
      </template>

      <template v-else>
        <tr>
          <td colspan="100%">
            <div class="empty-list">
              <span class="title">This Folder is empty</span>
              <span class="desc">Drag and Drop files to upload</span>
            </div>
          </td>
        </tr>
      </template>
      </tbody>
    </table>

    <file-preview ref="preview"/>

    <context-menu ref="menu" @openFile="openFile"/>
  </div>
</template>

<script>
import utils from '../utils'
import FilePreview from '@/components/FilePreview'
import ContextMenu from '@/components/contextMenu'
import repo from '@/api'

export default {
  methods: {
    openMenu (event, file) {
      this.$refs.menu.openMenu(event, file)
    },

    timeAgo (time) {
      return utils.timeSince(new Date(time))
    },
    bytesToSize (time) {
      return utils.bytesToSize(time)
    },
    openFile (file) {
      this.$refs.preview.openFile(file)
    }
  },
  components: {
    ContextMenu,
    FilePreview
  }
}
</script>

<style scoped lang="scss">
.empty-list {
  display: flex;
  flex-direction: column;
  margin: 4em 0;
  text-align: center;

  .title {
    font-weight: bold;
    font-size: 24px;
  }
}

.table-files {
  table {width: 100%;}
  td
  {
    max-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  td.col-name {width: 70%;}
}
@media (max-width: 992px) {
  .mobile-adjust {
    padding: 0 1rem;
  }
}
</style>
