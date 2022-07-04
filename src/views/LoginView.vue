<template>
  <!-- start page title -->
  <div class="row">
    <div class="col-12">
      <div class="page-title-box">
        <div class="page-title-right">

        </div>
<!--        <h4 class="page-title">File Manager</h4>-->
      </div>
    </div>
  </div>
  <!-- end page title -->

  <div class="row">

    <!-- Right Sidebar -->
    <div class="col-6 mx-auto">
      <div class="card">
        <div class="card-body">

          <h3>Please enter your R2 tokens to continue</h3>

          <div>
            <div class="form-group">
              <label class="form-label mt-4">CF Account id</label>
              <input v-model="account_id" type="text" class="form-control" placeholder="Account id">
            </div>
            <div class="form-group">
              <label class="form-label mt-4">CF R2 Access token</label>
              <input v-model="access_token" type="text" class="form-control" placeholder="Access token">
            </div>
            <div class="form-group">
              <label class="form-label mt-4">CF R2 Secret token</label>
              <input v-model="secret_token" type="text" class="form-control" placeholder="Secret token">
            </div>
          </div>

          <button @click="register" type="button" class="btn btn-primary mt-3">Save</button>

          <div class="clearfix"></div>
        </div>
      </div> <!-- end card -->

    </div> <!-- end Col -->
  </div><!-- End row -->
</template>

<script>

import axios from 'axios'

export default {
  data () {
    return {
      account_id: null,
      access_token: null,
      secret_token: null
    }
  },
  methods: {
    register () {
      if (!this.account_id || !this.access_token || !this.secret_token) return null

      const self = this

      axios.post('/api/register', {
        accountId: this.account_id,
        accessToken: this.access_token,
        secretToken: this.secret_token
      }).then((data) => {
        if (data.status === 200) {
          this.$toast.open({
            message: 'Credentials Saved, redirecting you...',
            type: 'success'
          })
          setTimeout(function () {
            self.$router.push({ name: 'home' })
          }, 2000)
        } else {
          console.log(data)
        }
      }).catch(error => {
        if (error.response.status === 401) {
          this.$toast.open({
            message: 'Invalid Credentials',
            type: 'error'
          })
        } else {
          console.log(error)
        }
      })
    }
  },
  async beforeCreate () {
    const response = await axios.get('/api/is-registed')
    if (response.data.result === true) {
      this.$router.push({ name: 'home' })
    }
  }
}
</script>
