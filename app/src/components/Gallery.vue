<template>
  <div class="d-md-flex justify-content-between align-items-center mobile-adjust">
    <form class="search-bar">
      <div class="position-relative">
        <!--        <input type="text" class="form-control form-control-light" placeholder="Search files..." />-->
        <span class="mdi mdi-magnify"></span>
      </div>
    </form>
    <div class="mt-2 mt-md-0">
      <folder-tree />
    </div>
  </div>

  <div class="mt-3 mobile-adjust">
    <folders />
  </div>
  <!-- end .mt-3-->

  <div class="mt-3">
    <files />
  </div>
  <!-- end .mt-3-->
</template>
<script>
import Folders from '@/components/Folders'
import Files from '@/components/Files'
import FolderTree from '@/components/FolderTree'
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
