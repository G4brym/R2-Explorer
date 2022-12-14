<template>
  <div id="wrapper">
    <!-- Topbar Start -->
    <TopbarView />
    <!-- end Topbar -->

    <!-- ========== Left Sidebar Start ========== -->
    <!--    <SidebarView />-->
    <!-- Left Sidebar End -->

    <!-- ============================================================== -->
    <!-- Start Page Content here -->
    <!-- ============================================================== -->

    <div class="content-page">
      <div class="content">
        <!-- Start Content-->
        <div class="container-fluid">
          <router-view />
        </div>
        <!-- container -->
      </div>
      <!-- content -->

      <!-- Footer Start -->
      <FooterView />
      <!-- end Footer -->
    </div>
  </div>
</template>

<script>
import TopbarView from '@/components/base/TopbarView'
// import SidebarView from '@/components/base/SidebarView'
import FooterView from '@/components/base/FooterView'
export default {
  components: { TopbarView, FooterView }
}
</script>

<style>
.content-page {
  margin-top: 0 !important;
}
</style>
