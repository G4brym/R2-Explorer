<template>
  <div class="navbar-custom">
    <div class="container-fluid">
      <div class="topbar-wrapper">
        <div class="toggle">
          <button class="btn btn-toggle" @click="$store.commit('toggleMobileSidebar')">
            <i class="bi bi-list"></i>
          </button>
        </div>
        <div class="logo-box">
          <a class="logo logo-light text-center">
            <img src="@/assets/logo.svg" class="me-1">
            <span class="logo-lg-text-light">R2 Explorer</span>
          </a>
        </div>
        <div class="d-none d-lg-flex align-items-center">
          <div class="alert m-0 text-white" style="background-color: rgb(26 188 156 / 50%);">
            New Dashboard V2 is now in beta <a href="/" class="text-warning">try it out here!</a>
          </div>
        </div>
        <ul class="topbar-menu d-flex align-items-center">


<!--          <li class="dropdown">-->
<!--            <form class="search-bar">-->
<!--              <div class="position-relative">-->
<!--                        <input type="text" class="form-control form-control-light" placeholder="Search files..." />-->
<!--                <span class="mdi mdi-magnify"></span>-->
<!--              </div>-->
<!--            </form>-->
<!--          </li>-->

          <li class="dropdown" v-if="$store.state.user?.username">
            <button class="btn btn-toggle dropdown-toggle waves-effect waves-light btn-user" data-bs-toggle="dropdown">
              <i class="bi bi-person-fill"></i>
              <span class="ms-1 d-none d-lg-inline-block">
                                        {{ $store.state.user.username }} <i class="mdi mdi-chevron-down"></i>
                                    </span>
            </button>
            <div class="dropdown-menu dropdown-menu-end profile-dropdown"
                 style="position: absolute; inset: 0px 0px auto auto; margin: 0px; transform: translate3d(0px, 72px, 0px);"
                 data-popper-placement="bottom-end">

              <!-- item-->
              <a href="#" @click="logout" class="dropdown-item notify-item">
                <i class="bi bi-box-arrow-right"></i>
                <span>Logout</span>
              </a>

            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.toggle {
  display: none;
  height: 100%;

  i {
    font-size: 35px;
    color: white;
  }
}

.topbar-wrapper {
  display: flex;
}

.navbar-custom {
  padding: 0
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 32px;
  }
}

.topbar-menu {
  margin-bottom: 0;
  list-style-type: none;
  padding-left: 0;

  margin-right: 0;
  margin-left: auto;

  .nav-link {
    color: white;
  }

  button:hover {
    color: white;
  }

  //li {
  //  height: 100%;
  //}
}

.btn-user {
  color: white;
}

@media (max-width: 992px) {
  .btn-user {
    font-size: 35px;
  }

  .logo-box {
    width: 100% !important;
  }

  //.topbar-wrapper {
  //  flex-direction: row-reverse;
  //}

  .user {
    display: none;
  }

  .toggle {
    display: block;
  }

  .topbar-menu {
    margin-right: 0;
    margin-left: 0;
  }
}
</style>
<script>
export default {
  methods: {
    logout () {
      if (this.$store.state.loginMethod === "basic") {
        localStorage.removeItem('basicAuth')
        location.reload();
      } else {
        window.location.href = "/cdn-cgi/access/logout"
      }
    }
  }
}
</script>
