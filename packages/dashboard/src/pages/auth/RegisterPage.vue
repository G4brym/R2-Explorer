<template>
  <q-page class='flex flex-center'>
    <q-card class='q-pa-md shadow-2' bordered style="min-width: 350px;">
      <q-card-section class='text-center'>
        <div class='text-grey-9 text-h5 text-weight-bold'>Create Account</div>
        <div class='text-grey-8'>Enter your details to create a new account.</div>
      </q-card-section>

      <q-card-section v-if='showError'>
        <q-banner inline-actions class="text-white bg-red">
          {{ showError }}
        </q-banner>
      </q-card-section>

      <q-card-section v-if='showSuccess'>
        <q-banner inline-actions class="text-white bg-green">
          {{ showSuccess }}
        </q-banner>
      </q-card-section>

      <q-card-section>
        <q-form
          @submit="onSubmit"
          class="q-gutter-sm"
        >
          <q-input
            filled
            v-model="form.email"
            label="Email"
            lazy-rules
            type='email'
            :rules="[
              val => val && val.length > 0 || 'Email is required',
              val => /.+@.+\..+/.test(val) || 'Please enter a valid email'
            ]"
          />

          <q-input
            filled
            v-model="form.password"
            label="Password"
            lazy-rules
            type='password'
            :rules="[
              val => val && val.length > 0 || 'Password is required',
              val => val.length >= 8 || 'Password must be at least 8 characters'
            ]"
          />

          <q-input
            filled
            v-model="form.confirmPassword"
            label="Confirm Password"
            lazy-rules
            type='password'
            :rules="[
              val => val && val.length > 0 || 'Please confirm your password',
              val => val === form.password || 'Passwords do not match'
            ]"
          />

          <div>
            <q-btn :loading="loading" label="Create Account" type="submit" color="primary" class="full-width"/>
          </div>
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <div class="text-grey-8">
          Already have an account?
          <router-link :to="{ name: 'login' }" class="text-primary">
            Sign in
          </router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export default defineComponent({
	name: "RegisterPage",
	setup() {
		const authStore = useAuthStore();
		const mainStore = useMainStore();
		return { authStore, mainStore };
	},
	data() {
		return {
			loading: false,
			showError: "",
			showSuccess: "",
			form: {
				email: "",
				password: "",
				confirmPassword: "",
			},
		};
	},
	async mounted() {
		// Initialize auth to get settings
		await this.authStore.initialize();

		// If registration is closed or already authenticated, redirect
		if (!this.authStore.canRegister) {
			await this.$router.replace({ name: "login" });
			return;
		}

		if (this.authStore.isAuthenticated) {
			await this.mainStore.loadServerConfigs(this.$router, this.$q);
		}
	},
	methods: {
		async onSubmit() {
			if (this.form.password !== this.form.confirmPassword) {
				this.showError = "Passwords do not match";
				return;
			}

			this.loading = true;
			this.showError = "";
			this.showSuccess = "";

			try {
				await this.authStore.register(this.form.email, this.form.password);
				this.showSuccess = "Account created successfully!";
				await this.mainStore.loadServerConfigs(this.$router, this.$q);
			} catch (error) {
				this.showError = error.message;
			} finally {
				this.loading = false;
			}
		},
	},
});
</script>
