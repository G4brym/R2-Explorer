<template>
  <div class="navbar-custom">
    <div class="container-fluid">
      <div class="topbar-wrapper">
        <div class="logo-box">
          <a class="logo logo-light text-center">
            <span class="logo-lg-text-light"><i class="bi bi-files"></i> R2-Explorer</span>
          </a>
        </div>
        <div class="toggle">
          <button class="btn btn-toggle" @click="$store.commit('toggleMobileSidebar')">
            <i class="bi bi-list"></i>
          </button>
        </div>
        <div class="user" v-if="$store.state.user?.email">
          <span v-text="$store.state.user?.email"></span>
        </div>
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

.user {
  margin-right: 36px;
  margin-left: auto;
  display: flex;
  align-items: center;

  span {
    color: white;
  }
}

@media (max-width: 992px) {
  .logo-box {
    width: 100% !important;
  }

  .topbar-wrapper {
    flex-direction: row-reverse;
  }

  .user {
    display: none;
  }

  .toggle {
    display: block;
  }
}
</style>
