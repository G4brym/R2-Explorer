<template>
  <div class="account-pages mt-5 mb-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6 col-xl-4">
          <div class="card">

            <div class="card-body p-4">

              <div class="text-center w-75 m-auto">
                <div class="auth-logo">
                  <a class="logo text-center">
                    <span class="logo-lg-text-dark">R2 Explorer</span>
                  </a>
                </div>
                <p class="text-muted mb-4 mt-3">Enter your email address and password to continue.</p>
              </div>

              <form @submit.prevent="login">

                <div class="alert alert-danger" v-if="error">
                  {{error}}
                </div>

                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input class="form-control" type="text" id="username" required="" v-model="username"
                         placeholder="Enter your email">
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <div class="input-group input-group-merge">
                    <input type="password" id="password" class="form-control" placeholder="Enter your password"
                           v-model="password">
                    <!--                    <div class="input-group-text" data-password="false">-->
                    <!--                      <span class="password-eye"></span>-->
                    <!--                    </div>-->
                  </div>
                </div>

                <!--                <div class="mb-3">-->
                <!--                  <div class="form-check">-->
                <!--                    <input type="checkbox" class="form-check-input" id="checkbox-signin" checked>-->
                <!--                    <label class="form-check-label" for="checkbox-signin">Remember me</label>-->
                <!--                  </div>-->
                <!--                </div>-->

                <div class="text-center d-grid">
                  <button class="btn btn-primary" type="submit"> Log In</button>
                </div>

              </form>

            </div> <!-- end card-body -->
          </div>
          <!-- end card -->

        </div> <!-- end col -->
      </div>
      <!-- end row -->
    </div>
  </div>
</template>

<script>

import axios from 'axios'

export default {
  data: function () {
    return {
      error: undefined,
      username: '',
      password: ''
    }
  },
  methods: {
    async login () {
      const result = await this.$store.dispatch('tryLogin', {
        username: this.username, password: this.password
      })

      if (result)
        this.error = result
    }
  }
}
</script>
