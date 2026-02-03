<template>
  <q-page class="auth-page flex flex-center">
    <div class="auth-container">
      <!-- Logo/Brand -->
      <div class="text-center q-mb-lg auth-header">
        <div class="auth-logo-wrapper q-mb-md">
          <q-icon name="folder_copy" size="28px" color="white" />
        </div>
        <h1 class="text-h4 text-weight-bold auth-title">Welcome back</h1>
        <p class="text-body1 text-grey-7 q-mt-sm">Enter your credentials to access your account</p>
      </div>

      <!-- Card -->
      <q-card class="auth-card">
        <q-card-section class="q-pa-lg">
          <!-- Error Banner -->
          <div
            v-if="showError"
            class="auth-error-banner q-mb-md"
          >
            <q-icon name="error_outline" size="20px" class="q-mr-sm" />
            <span class="text-body2">{{ showError }}</span>
          </div>

          <!-- Form -->
          <q-form @submit="onSubmit" class="q-gutter-md">
            <div>
              <label class="text-body2 text-weight-medium text-grey-8 q-mb-xs" style="display: block;">Email</label>
              <q-input
                v-model="form.email"
                type="email"
                placeholder="name@example.com"
                outlined
                :rules="[val => val && val.length > 0 || 'Email is required']"
                lazy-rules
                class="auth-input"
              >
                <template v-slot:prepend>
                  <q-icon name="email" color="grey-6" />
                </template>
              </q-input>
            </div>

            <div>
              <label class="text-body2 text-weight-medium text-grey-8 q-mb-xs" style="display: block;">Password</label>
              <q-input
                v-model="form.password"
                type="password"
                placeholder="Enter your password"
                outlined
                :rules="[val => val && val.length > 0 || 'Password is required']"
                lazy-rules
                class="auth-input"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" color="grey-6" />
                </template>
              </q-input>
            </div>

            <div class="row items-center justify-between">
              <q-checkbox
                v-model="form.remember"
                label="Remember me"
                color="green-7"
                class="auth-checkbox"
              />
              <router-link
                v-if="authStore.canResetPassword"
                :to="{ name: 'forgot-password' }"
                class="auth-link text-body2"
              >
                Forgot password?
              </router-link>
            </div>

            <q-btn
              type="submit"
              :loading="loading"
              class="auth-submit-btn full-width"
              unelevated
              no-caps
              size="md"
            >
              <span class="text-weight-medium">Sign in</span>
              <q-icon name="arrow_forward" size="18px" class="q-ml-sm" />
            </q-btn>
          </q-form>
        </q-card-section>

        <!-- Footer -->
        <q-separator v-if="authStore.canRegister" />
        <q-card-section v-if="authStore.canRegister" class="text-center auth-footer">
          <p class="text-body2 text-grey-7">
            Don't have an account?
            <router-link :to="{ name: 'register' }" class="auth-link text-weight-medium">
              Sign up
            </router-link>
          </p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export default defineComponent({
	name: "LoginPage",
	setup() {
		const authStore = useAuthStore();
		const mainStore = useMainStore();
		return { authStore, mainStore };
	},
	data() {
		return {
			loading: false,
			showError: "",
			form: {
				email: "",
				password: "",
				remember: true,
			},
		};
	},
	async mounted() {
		await this.authStore.initialize();

		if (this.authStore.isAuthenticated) {
			await this.mainStore.loadServerConfigs(this.$router, this.$q);
		}
	},
	methods: {
		async onSubmit() {
			this.loading = true;
			this.showError = "";

			try {
				await this.authStore.login(
					this.form.email,
					this.form.password,
					this.form.remember,
				);
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

<style scoped>
.auth-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}

.auth-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  animation: backgroundMove 20s linear infinite;
}

@keyframes backgroundMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(60px, 60px);
  }
}

.auth-container {
  width: 100%;
  max-width: 440px;
  padding: 0 20px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-header {
  animation: fadeIn 0.8s ease-out 0.2s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.auth-logo-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.auth-title {
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 0;
}

.auth-card {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideIn 0.6s ease-out 0.3s backwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.auth-error-banner {
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-radius: 8px;
  display: flex;
  align-items: center;
  color: #dc2626;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.auth-input :deep(.q-field__control) {
  border-radius: 10px;
  height: 48px;
  transition: all 0.3s ease;
}

.auth-input :deep(.q-field__control):hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.auth-input :deep(.q-field__control):focus-within {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.auth-checkbox :deep(.q-checkbox__inner) {
  transition: all 0.3s ease;
}

.auth-link {
  color: #22c55e;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.auth-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #22c55e;
  transition: width 0.3s ease;
}

.auth-link:hover {
  color: #16a34a;
}

.auth-link:hover::after {
  width: 100%;
}

.auth-submit-btn {
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.auth-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.auth-submit-btn:active {
  transform: translateY(0);
}

.auth-footer {
  background: linear-gradient(180deg, rgba(249, 250, 251, 0) 0%, rgba(249, 250, 251, 1) 100%);
  padding: 16px;
}
</style>
