<template>
  <div class="navbar-custom">
    <div class="container-fluid">
      <ul class="list-unstyled topnav-menu float-end mb-0">
        <li v-if="$store.state.config?.readonly" class="dropdown d-none d-lg-inline-block">
          <a class="nav-link dropdown-toggle arrow-none">
            <span class="badge bg-danger font-16">Readonly Mode</span>
          </a>
        </li>
        <li class="dropdown notification-list topbar-dropdown">
          <a
            v-if="$store.state.user"
            class="nav-link dropdown-toggle nav-user me-0 waves-effect waves-light"
            data-bs-toggle="dropdown"
            href="#"
            role="button"
            aria-haspopup="false"
            aria-expanded="false"
          >
            <span class="pro-user-name ms-1"> {{ $store.state.user }} <i class="mdi mdi-chevron-down"></i> </span>
            <i class="bi bi-caret-down-fill"></i>
          </a>
          <div class="dropdown-menu dropdown-menu-end profile-dropdown">
            <!-- item-->
            <a href="/cdn-cgi/access/logout" class="dropdown-item notify-item">
              <i class="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </a>
          </div>
        </li>

        <!--        <li class="dropdown notification-list">-->
        <!--          <a href="javascript:void(0);" class="nav-link right-bar-toggle waves-effect waves-light">-->
        <!--            <i class="bi bi-asterisk"></i>-->
        <!--          </a>-->
        <!--        </li>-->
      </ul>

      <!-- LOGO -->
      <div class="logo-box">
        <a class="logo logo-light text-center">
            <span class="logo-lg-text-light"><i class="bi bi-files"></i> R2-Explorer</span>
        </a>
      </div>

      <div class="clearfix"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@media (max-width: 992px) {
  .logo-box {
    width: 100% !important;
  }
}

.navbar-custom {
  position: unset;
}
</style>
