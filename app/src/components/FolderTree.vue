<template>
  <ol class="breadcrumb m-0 folder-tree">
    <li class="breadcrumb-item">
      <a v-text="this.$store.state.activeBucket" @click="$store.dispatch('navigate', '')"></a>
    </li>
    <template v-for="(folder, index) in tree" :key="index">
      <li class="breadcrumb-item" :class="{ active: index === tree.length - 1 }">
        <a v-text="folder.name" @click="$store.dispatch('navigate', folder.path)"></a>
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
          path: folderTree
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
