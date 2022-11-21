<template>
  <h5 class="mb-3" v-if="$store.state.files.length > 0">Files</h5>

  <div>
    <table class="table table-centered table-nowrap mb-0">
      <thead class="table-light">
        <tr>
          <th class="border-0">Name</th>
          <th class="border-0">Last Modified</th>
          <th class="border-0">Size</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="$store.state.files.length > 0">
          <tr v-for="file in $store.state.files" :key="file.Key" @contextmenu.prevent="openMenu($event, file)">
            <td>
              <i data-feather="folder" class="icon-dual"></i>
              <span class="ms-2 fw-semibold"
                ><a href="javascript: void(0);" class="text-reset" v-text="file.name"></a
              ></span>
            </td>
            <td>{{ timeAgo(file.LastModified) }} ago</td>
            <td>{{ bytesToSize(file.Size) }}</td>
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

    <file-preview ref="preview" />

    <context-menu ref="menu" @openFile="openFile" />
  </div>
</template>

<script>
import utils from '../utils'
import FilePreview from '@/components/FilePreview'
import ContextMenu from '@/components/contextMenu'

export default {
  methods: {
    openMenu(event, file) {
      const canPreview = this.$refs.preview.getType(file.extension) !== undefined
      this.$refs.menu.openMenu(event, file, canPreview)
    },

    timeAgo(time) {
      return utils.timeSince(new Date(time))
    },
    bytesToSize(time) {
      return utils.bytesToSize(time)
    },
    openFile(fileData) {
      this.$refs.preview.openPreview(fileData)
    },
  },
  components: {
    ContextMenu,
    FilePreview,
  },
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
</style>
