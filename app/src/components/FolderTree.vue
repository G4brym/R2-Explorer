<template>
  <ol class="breadcrumb m-0 folder-tree">
    <li class="breadcrumb-item">
      <router-link v-if="$route.params.bucket" v-text="$store.state.activeBucket" :to="{ name: 'bucket-home', params: { bucket: $route.params.bucket }}"></router-link>
    </li>
    <template v-for="(folder, index) in tree" :key="index">
      <li class="breadcrumb-item" :class="{ active: index === tree.length - 1 }">
        <router-link v-text="folder.name"
                     :to="{ name: 'bucket-folder', params: { bucket: $route.params.bucket, folder: folder.hash }}"></router-link>
      </li>
    </template>
  </ol>
</template>

<script>
export default {
  computed: {
    tree () {
      if (!this.$store.state.currentFolder) {
        return []
      }
      const folders = this.$store.state.currentFolder.split('/').filter((obj) => {
        return obj !== ''
      })

      let folderTree = ''
      return folders.map((obj) => {
        folderTree += obj + '/'
        return {
          name: obj,
          path: folderTree,
          hash: btoa(unescape(encodeURIComponent(folderTree)))
        }
      })
    }
  }
}
</script>

<style scoped>
.breadcrumb-item + .breadcrumb-item::before {
  font-family: 'bootstrap-icons' !important;
  content: '\F231';
  color: black;
}
</style>
