<template>
  <div class="mobile-adjust">
    <folders />
  </div>
  <!-- end .mt-3-->

  <div class="mt-3">
    <files />
  </div>
  <!-- end .mt-3-->
</template>
<script>
import Folders from '@/components/storage/Folders.vue'
import Files from '@/components/storage/Files.vue'
import FolderTree from '@/components/FolderTree.vue'
export default {
  components: { FolderTree, Files, Folders }
}
</script>

<style scoped lang="scss">
@media (max-width: 992px) {
  .mobile-adjust {
    padding: 0 1rem;

    &:first-of-type {
      padding-top: 1rem;
    }
  }
}
</style>
