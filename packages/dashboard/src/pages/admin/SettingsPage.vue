<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">Admin Settings</div>

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
