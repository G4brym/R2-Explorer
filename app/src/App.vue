<template>
  <div id="wrapper">
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
          <router-view/>
        </div>
        <!-- container -->
      </div>
      <!-- content -->

    </div>
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
