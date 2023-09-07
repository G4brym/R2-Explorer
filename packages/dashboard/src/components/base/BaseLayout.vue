<template>
  <!-- Topbar Start -->
  <TopbarView/>
  <!-- end Topbar -->

  <!-- ========== Left Sidebar Start ========== -->
  <SidebarView/>
  <!-- Left Sidebar End -->

  <!-- ============================================================== -->
  <!-- Start Page Content here -->
  <!-- ============================================================== -->

  <div class="content-page">
    <div class="content">
      <!-- Start Content-->
      <div class="container-fluid mobile-wrap">
        <slot></slot>
      </div>
      <!-- container -->
    </div>
    <!-- content -->

  </div>
</template>

<script>
import TopbarView from '@/components/base/TopbarView'
import SidebarView from '@/components/base/SidebarView'

export default {
  components: { TopbarView, SidebarView }
}
</script>

<style scoped lang="scss">
</style>
