<template>
  <q-page class='flex flex-center'>
    <q-card class='q-pa-md shadow-2' bordered style="min-width: 350px;">
      <q-card-section class='text-center'>
        <div class='text-grey-9 text-h5 text-weight-bold'>Forgot Password</div>
        <div class='text-grey-8'>Enter your email to receive a password reset link.</div>
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

      <q-card-section v-if="!submitted">
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

          <div>
            <q-btn :loading="loading" label="Send Reset Link" type="submit" color="primary" class="full-width"/>
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
import { defineComponent } from "vue";

export default defineComponent({
	name: "ForgotPasswordPage",
	setup() {
		const authStore = useAuthStore();
		return { authStore };
	},
	data() {
		return {
			loading: false,
			showError: "",
			showSuccess: "",
			submitted: false,
			form: {
				email: "",
			},
		};
	},
	async mounted() {
		// Initialize auth to get settings
		await this.authStore.initialize();

		// If password reset is not available, redirect
		if (!this.authStore.canResetPassword) {
			await this.$router.replace({ name: "login" });
		}
	},
	methods: {
		async onSubmit() {
			this.loading = true;
			this.showError = "";
			this.showSuccess = "";

			try {
				const message = await this.authStore.forgotPassword(this.form.email);
				this.showSuccess = message;
				this.submitted = true;
			} catch (error) {
				this.showError = error.message;
			} finally {
				this.loading = false;
			}
		},
	},
});
</script>
