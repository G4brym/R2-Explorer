<template>
  <q-btn dense flat round icon="menu" @click="$emit('toggle')" />

  <q-toolbar-title style="overflow: unset" class="text-bold">
    <q-avatar>
      <img src="/logo-white.svg">
    </q-avatar>
    R2-Explorer
  </q-toolbar-title>
  <q-space />

  <div v-if="mainStore.buckets.length > 1" class="q-mr-md">
    <bucket-picker/>
  </div>

  <!-- User Profile Dropdown -->
  <div v-if="authStore.isAuthenticated && authStore.user">
    <q-btn flat dense no-caps class="user-profile-btn">
      <div class="row items-center no-wrap">
        <q-avatar size="32px" color="white" text-color="green-7" class="q-mr-sm">
          <span class="text-weight-medium">{{ getUserInitials }}</span>
        </q-avatar>
        <div class="column items-start q-mr-xs gt-sm">
          <div class="text-weight-medium" style="line-height: 1.2;">{{ authStore.user.email }}</div>
          <div class="text-caption" style="opacity: 0.8; line-height: 1.2;">
            {{ authStore.isAdmin ? 'Admin' : 'User' }}
          </div>
        </div>
        <q-icon name="keyboard_arrow_down" size="20px" />
      </div>

      <q-menu transition-show="jump-down" transition-hide="jump-up" anchor="bottom right" self="top right">
        <q-list style="min-width: 200px">
          <!-- User Info Header -->
          <q-item class="bg-grey-2">
            <q-item-section avatar>
              <q-avatar color="green-7" text-color="white" size="40px">
                <span class="text-weight-medium">{{ getUserInitials }}</span>
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ authStore.user.email }}</q-item-label>
              <q-item-label caption>{{ authStore.isAdmin ? 'Administrator' : 'User Account' }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <!-- Settings Option -->
          <q-item clickable v-close-popup @click="openSettings">
            <q-item-section avatar>
              <q-icon name="settings" color="grey-7" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Settings</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Admin Settings (if admin) -->
          <q-item v-if="authStore.isAdmin" clickable v-close-popup @click="goToAdminSettings">
            <q-item-section avatar>
              <q-icon name="admin_panel_settings" color="grey-7" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Admin Settings</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <!-- Logout Option -->
          <q-item clickable v-close-popup @click="handleLogout">
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-negative">Logout</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>

  <settings-modal ref="settingsModal" />
</template>

<script>
import BucketPicker from "components/main/BucketPicker.vue";
import SettingsModal from "components/settings/SettingsModal.vue";
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
	name: "TopBar",
	emits: ["toggle"],
	components: { BucketPicker, SettingsModal },
	setup() {
		const mainStore = useMainStore();
		const authStore = useAuthStore();
		const router = useRouter();
		return { mainStore, authStore, router };
	},
	computed: {
		getUserInitials() {
			if (!this.authStore.user?.email) return "U";
			const email = this.authStore.user.email;
			const parts = email.split("@")[0].split(".");
			if (parts.length >= 2) {
				return (parts[0][0] + parts[1][0]).toUpperCase();
			}
			return email.substring(0, 2).toUpperCase();
		},
	},
	methods: {
		openSettings() {
			this.$refs.settingsModal.open();
		},
		goToAdminSettings() {
			this.router.push({ name: "admin-settings" });
		},
		async handleLogout() {
			try {
				await this.authStore.logout(this.router);
			} catch (error) {
				console.error("Logout error:", error);
			}
		},
	},
});
</script>

<style scoped>
.user-profile-btn {
  border-radius: 8px;
  padding: 4px 8px;
  transition: background-color 0.2s ease;
}

.user-profile-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
