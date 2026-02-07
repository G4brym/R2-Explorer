<template>
  <q-page padding>
    <div class="q-pa-md" style="max-width: 1200px;">
      <div class="text-h4 q-mb-md">Admin Settings</div>

      <!-- Hardcoded Configuration Warning -->
      <q-card class="q-mb-md" style="border-left: 4px solid #f59e0b;">
        <q-card-section class="bg-orange-1">
          <div class="row items-center">
            <q-icon name="code" color="orange" size="24px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-medium">Hardcoded Configuration</div>
          </div>
          <div class="text-body2 text-grey-8 q-mt-sm">
            Some settings are configured directly in your worker code and cannot be changed from the UI.
            To modify these settings, edit your <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">R2Explorer()</code> function configuration.
          </div>
        </q-card-section>
        <q-card-section>
          <div class="q-gutter-sm">
            <div class="row items-center q-py-xs">
              <div class="col-4 text-weight-medium text-grey-7">Read-only Mode:</div>
              <div class="col">
                <q-chip :color="mainStore.apiReadonly ? 'orange' : 'green'" text-color="white" size="sm">
                  {{ mainStore.apiReadonly ? 'Enabled' : 'Disabled' }}
                </q-chip>
                <span class="text-caption text-grey-6 q-ml-sm">
                  Edit <code>packages/dev/index.ts</code> → <code>readonly</code> property
                </span>
              </div>
            </div>
            <div class="row items-center q-py-xs">
              <div class="col-4 text-weight-medium text-grey-7">Auth Mode:</div>
              <div class="col">
                <q-chip color="blue" text-color="white" size="sm">
                  {{ authStore.authMode || 'session' }}
                </q-chip>
                <span class="text-caption text-grey-6 q-ml-sm">
                  Configured via <code>basicAuth</code> or <code>cfAccessTeamName</code> options
                </span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Applications Settings -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Applications</div>
          <div class="text-caption text-grey-7">Enable or disable individual applications. Changes take effect immediately.</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-sm">
            <!-- Drive -->
            <q-item class="rounded-borders">
              <q-item-section avatar>
                <q-avatar rounded size="48px" style="background-color: #eff6ff;">
                  <q-icon name="folder_copy" size="24px" color="blue-6" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Drive</q-item-label>
                <q-item-label caption>File storage and management</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="appSettings.appDriveEnabled"
                  @update:model-value="saveAppSettings"
                  :disable="saving"
                  color="green"
                />
              </q-item-section>
            </q-item>

            <!-- Email -->
            <q-item class="rounded-borders">
              <q-item-section avatar>
                <q-avatar rounded size="48px" style="background-color: #eff6ff;">
                  <q-icon name="email" size="24px" color="blue-6" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Email</q-item-label>
                <q-item-label caption>Email inbox and management</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="appSettings.appEmailEnabled"
                  @update:model-value="saveAppSettings"
                  :disable="saving"
                  color="green"
                />
              </q-item-section>
            </q-item>

            <!-- Notes -->
            <q-item class="rounded-borders">
              <q-item-section avatar>
                <q-avatar rounded size="48px" style="background-color: #eff6ff;">
                  <q-icon name="sticky_note_2" size="24px" color="blue-6" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Notes</q-item-label>
                <q-item-label caption>Markdown notes editor</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="appSettings.appNotesEnabled"
                  @update:model-value="saveAppSettings"
                  :disable="saving"
                  color="green"
                />
              </q-item-section>
            </q-item>
          </div>
        </q-card-section>
      </q-card>

      <!-- Display Settings -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Display Settings</div>
        </q-card-section>

        <q-card-section>
          <q-toggle
            v-model="settings.showHiddenFiles"
            label="Show hidden files (files starting with .)"
            @update:model-value="saveSettings"
          />
        </q-card-section>
      </q-card>

      <!-- Registration Settings -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Registration Settings</div>
        </q-card-section>

        <q-card-section>
          <q-option-group
            v-model="registrationMode"
            :options="registrationOptions"
            @update:model-value="onRegistrationModeChange"
          />
          <div class="text-caption text-grey q-mt-sm">
            <strong>Smart mode:</strong> Only the first user can register (becomes admin). After that, registration is closed.<br>
            <strong>Open:</strong> Anyone can register a new account.<br>
            <strong>Closed:</strong> No new registrations allowed. Admins must create accounts manually.
          </div>
        </q-card-section>
      </q-card>

      <!-- Password Recovery -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Password Recovery</div>
        </q-card-section>

        <q-card-section>
          <q-toggle
            v-model="settings.recoveryEmailEnabled"
            label="Enable password recovery via email"
            @update:model-value="saveSettings"
          />

          <q-input
            v-if="settings.recoveryEmailEnabled"
            filled
            v-model="settings.recoveryEmailFrom"
            label="Recovery email sender address"
            hint="The email address that password reset emails will be sent from"
            class="q-mt-md"
            @blur="saveSettings"
          />

          <div class="text-caption text-orange q-mt-sm" v-if="settings.recoveryEmailEnabled">
            Note: Email sending requires additional configuration (e.g., email routing or integration with an email service).
          </div>
        </q-card-section>
      </q-card>

      <q-card v-if="saveError">
        <q-card-section>
          <q-banner class="bg-negative text-white">
            {{ saveError }}
          </q-banner>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { api } from "boot/axios";
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export default defineComponent({
	name: "AdminSettingsPage",
	setup() {
		const authStore = useAuthStore();
		const mainStore = useMainStore();
		return { authStore, mainStore };
	},
	data() {
		return {
			settings: {
				showHiddenFiles: false,
				registerEnabled: null,
				recoveryEmailFrom: "",
				recoveryEmailEnabled: false,
			},
			appSettings: {
				appDriveEnabled: true,
				appEmailEnabled: true,
				appNotesEnabled: true,
			},
			registrationMode: "smart",
			registrationOptions: [
				{ label: "Smart mode (first user only)", value: "smart" },
				{ label: "Open registration", value: "open" },
				{ label: "Closed (admin creates accounts)", value: "closed" },
			],
			saveError: null,
			saving: false,
		};
	},
	async mounted() {
		// Load current settings
		await this.mainStore.loadAdminSettings();
		this.settings = { ...this.mainStore.adminSettings };

		// Load app settings
		await this.loadAppSettings();

		// Set registration mode based on settings
		if (this.settings.registerEnabled === null) {
			this.registrationMode = "smart";
		} else if (this.settings.registerEnabled === true) {
			this.registrationMode = "open";
		} else {
			this.registrationMode = "closed";
		}
	},
	methods: {
		async loadAppSettings() {
			try {
				const response = await api.get("/v1/settings");
				if (response.data.success) {
					this.appSettings = {
						appDriveEnabled: response.data.settings.appDriveEnabled,
						appEmailEnabled: response.data.settings.appEmailEnabled,
						appNotesEnabled: response.data.settings.appNotesEnabled,
					};
				}
			} catch (error) {
				console.error("Failed to load app settings:", error);
			}
		},
		async saveAppSettings() {
			if (this.saving) return;

			this.saving = true;
			this.saveError = null;

			try {
				await api.put("/v1/settings", this.appSettings);
				this.$q.notify({
					type: "positive",
					message: "App settings saved",
					timeout: 2000,
				});
				this.$bus.emit("settingsUpdated", this.appSettings);
			} catch (error) {
				this.saveError = error.response?.data?.error || error.message;
				this.$q.notify({
					type: "negative",
					message: this.saveError,
					timeout: 5000,
				});
			} finally {
				this.saving = false;
			}
		},
		onRegistrationModeChange(value) {
			if (value === "smart") {
				this.settings.registerEnabled = null;
			} else if (value === "open") {
				this.settings.registerEnabled = true;
			} else {
				this.settings.registerEnabled = false;
			}
			this.saveSettings();
		},
		async saveSettings() {
			if (this.saving) return;

			this.saving = true;
			this.saveError = null;

			try {
				await this.mainStore.updateAdminSettings(this.settings);
				this.$q.notify({
					type: "positive",
					message: "Settings saved",
					timeout: 2000,
				});
			} catch (error) {
				this.saveError = error.message;
				this.$q.notify({
					type: "negative",
					message: error.message,
					timeout: 5000,
				});
			} finally {
				this.saving = false;
			}
		},
	},
});
</script>
