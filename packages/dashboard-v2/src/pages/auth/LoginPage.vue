<template>
  <q-page class='flex flex-center'>
    <q-card class='q-pa-md shadow-2' bordered>
      <q-card-section class='text-center'>
        <div class='text-grey-9 text-h5 text-weight-bold'>Sign in</div>
        <div class='text-grey-8'>Enter your email address and password to access admin panel.</div>
      </q-card-section>

      <q-card-section v-if='showError'>
        <q-banner inline-actions class="text-white bg-red">
          {{ showError }}
        </q-banner>
      </q-card-section>

      <q-card-section>
        <q-form
          @submit="onSubmit"
          class="q-gutter-sm"
        >
          <q-input
            filled
            v-model="form.username"
            label="Username"
            lazy-rules
            type='text'
          />

          <q-input
            filled
            v-model="form.password"
            label="Password"
            lazy-rules
            type='password'
          />

          <q-toggle v-model="form.remind" label="Remember me" />

          <div>
            <q-btn :loading="loading" label="Sign in" type="submit" color="primary"/>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';
import { useAuthStore } from 'stores/auth-store';
const authStore = useAuthStore()

export default defineComponent({
  name: 'login-page',
  components: {},
  data() {
    return {
      loading: false,
      showError: '',
      form: {
        username: '',
        password: '',
        remind: true
      }
    };
  },
  methods: {
    async onSubmit() {
      this.loading = true
      try {
        await authStore.LogIn(this.$router, this.form)
        this.showError = '';
      } catch (error) {
        this.showError = error.message;
        throw error;
      } finally {
        this.loading = false
      }
    }
  }
});
</script>
