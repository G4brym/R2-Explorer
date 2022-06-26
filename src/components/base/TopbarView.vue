<template>
  <div class="navbar-custom">
    <div class="container-fluid">
      <ul class="list-unstyled topnav-menu float-end mb-0">

        <li class="dropdown notification-list topbar-dropdown">
          <a class="nav-link dropdown-toggle nav-user me-0 waves-effect waves-light" data-bs-toggle="dropdown" href="#"
             role="button" aria-haspopup="false" aria-expanded="false">
            <span class="pro-user-name ms-1">
                        Username <i class="mdi mdi-chevron-down"></i>
                    </span>
          </a>
          <div class="dropdown-menu dropdown-menu-end profile-dropdown ">
            <!-- item-->
            <a href="javascript:void(0);" class="dropdown-item notify-item">
              <i class="bi bi-asterisk"></i>
              <span>Logout</span>
            </a>

          </div>
        </li>

        <li class="dropdown notification-list">
          <a href="javascript:void(0);" class="nav-link right-bar-toggle waves-effect waves-light">
            <i class="bi bi-asterisk"></i>
          </a>
        </li>

      </ul>

      <!-- LOGO -->
      <div class="logo-box">
        <a class="logo logo-light text-center">
                <span class="logo-sm">
                   <span class="logo-lg-text-light">R2E</span>
                </span>
          <span class="logo-lg">
                   <span class="logo-lg-text-light">R2 Explorer</span>
                </span>
        </a>
      </div>

      <div class="clearfix"></div>
    </div>
  </div>
</template>
