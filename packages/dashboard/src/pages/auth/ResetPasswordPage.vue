<template>
  <q-page class='flex flex-center'>
    <q-card class='q-pa-md shadow-2' bordered style="min-width: 350px;">
      <q-card-section class='text-center'>
        <div class='text-grey-9 text-h5 text-weight-bold'>Reset Password</div>
        <div class='text-grey-8'>Enter your new password below.</div>
      </q-card-section>

      <q-card-section v-if='showError'>
        <q-banner inline-actions class="text-white bg-red">
          {{ showError }}
        </q-banner>
      </q-card-section>

      <q-card-section v-if="!token">
        <q-banner inline-actions class="text-white bg-orange">
          Invalid or missing reset token. Please request a new password reset link.
        </q-banner>
      </q-card-section>

      <q-card-section v-if="token">
        <q-form
          @submit="onSubmit"
          class="q-gutter-sm"
        >
          <q-input
            filled
            v-model="form.password"
            label="New Password"
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
            label="Confirm New Password"
            lazy-rules
            type='password'
            :rules="[
              val => val && val.length > 0 || 'Please confirm your password',
              val => val === form.password || 'Passwords do not match'
            ]"
          />

          <div>
            <q-btn :loading="loading" label="Reset Password" type="submit" color="primary" class="full-width"/>
          </div>
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <div class="text-grey-8">
          <router-link :to="{ name: 'login' }" class="text-primary">
            Back to Sign in
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
	name: "ResetPasswordPage",
	setup() {
		const authStore = useAuthStore();
		const mainStore = useMainStore();
		return { authStore, mainStore };
	},
	data() {
		return {
			loading: false,
			showError: "",
			token: null,
			form: {
				password: "",
				confirmPassword: "",
			},
		};
	},
	async mounted() {
		// Get token from URL
		this.token = this.$route.query.token || null;

		// Initialize auth to get settings
		await this.authStore.initialize();
	},
	methods: {
		async onSubmit() {
			if (this.form.password !== this.form.confirmPassword) {
				this.showError = "Passwords do not match";
				return;
			}

			this.loading = true;
			this.showError = "";

			try {
				await this.authStore.resetPassword(this.token, this.form.password);
				this.$q.notify({
					type: "positive",
					message: "Password reset successfully!",
				});
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
