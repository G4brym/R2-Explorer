<template>
  <q-dialog v-model="showModal" persistent no-route-dismiss>
    <q-card style="width: 700px; max-width: 90vw; min-height: 450px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Settings</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none" style="min-height: 380px;">
        <div class="row" style="height: 100%;">
          <!-- Side menu -->
          <div class="col-3 bg-grey-2 q-pa-md" style="border-right: 1px solid #ddd;">
            <q-list>
              <q-item
                clickable
                v-ripple
                :active="activeTab === 'info'"
                active-class="bg-primary text-white"
                @click="activeTab = 'info'"
              >
                <q-item-section avatar>
                  <q-icon name="info" />
                </q-item-section>
                <q-item-section>Info</q-item-section>
              </q-item>

              <q-item
                clickable
                v-ripple
                :active="activeTab === 'apps'"
                active-class="bg-primary text-white"
                @click="activeTab = 'apps'"
              >
                <q-item-section avatar>
                  <q-icon name="apps" />
                </q-item-section>
                <q-item-section>Apps</q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Content area -->
          <div class="col-9 q-pa-md">
            <!-- Info Tab -->
            <div v-if="activeTab === 'info'">
              <div class="text-h6 q-mb-md">System Information</div>

              <div class="q-mb-md">
                <div class="text-weight-bold">Version</div>
                <div class="text-grey-8">{{ mainStore.version }}</div>
                <div v-if="updateAvailable" class="text-orange q-mt-xs">
                  Update available: {{ latestVersion }}
                  <a href="https://r2explorer.com/getting-started/updating-your-project/" target="_blank" class="text-primary">
                    Learn how to update
                  </a>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="q-mb-md">
                <div class="text-weight-bold">Authentication</div>
                <div class="text-grey-8">
                  <template v-if="mainStore.auth">
                    Mode: {{ authStore.authMode }}<br>
                    Email: {{ mainStore.auth.username }}
                  </template>
                  <template v-else>
                    <span v-if="authStore.authMode === 'disabled'">Authentication disabled</span>
                    <span v-else>Not authenticated</span>
                  </template>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="q-mb-md">
                <div class="text-weight-bold">Configuration</div>
                <div class="text-grey-8">
                  <div>Read-only: {{ mainStore.apiReadonly ? 'Yes' : 'No' }}</div>
                  <div>Show hidden files: {{ mainStore.showHiddenFiles ? 'Yes' : 'No' }}</div>
                </div>
              </div>

              <q-separator class="q-my-md" />

              <div class="text-center q-mt-lg">
                <a href="https://r2explorer.com" target="_blank" class="text-primary">
                  R2-Explorer Documentation
                </a>
                <span class="q-mx-sm">|</span>
                <a href="https://github.com/G4brym/R2-Explorer" target="_blank" class="text-primary">
                  GitHub
                </a>
              </div>
            </div>

            <!-- Apps Tab -->
            <div v-if="activeTab === 'apps'">
              <div class="text-h6 q-mb-md">Applications</div>
              <div class="text-grey-7 q-mb-lg">
                Enable or disable individual applications. Changes take effect immediately.
              </div>

              <div class="q-gutter-md">
                <q-item tag="label" v-ripple>
                  <q-item-section avatar>
                    <q-icon name="folder_copy" color="blue" size="md" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Drive</q-item-label>
                    <q-item-label caption>File storage and management</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle
                      v-model="appSettings.appDriveEnabled"
                      @update:model-value="saveAppSettings"
                      :disable="saving"
                    />
                  </q-item-section>
                </q-item>

                <q-item tag="label" v-ripple>
                  <q-item-section avatar>
                    <q-icon name="email" color="blue" size="md" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Email</q-item-label>
                    <q-item-label caption>Email inbox and management</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle
                      v-model="appSettings.appEmailEnabled"
                      @update:model-value="saveAppSettings"
                      :disable="saving"
                    />
                  </q-item-section>
                </q-item>

                <q-item tag="label" v-ripple>
                  <q-item-section avatar>
                    <q-icon name="sticky_note_2" color="blue" size="md" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Notes</q-item-label>
                    <q-item-label caption>Markdown notes editor</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-toggle
                      v-model="appSettings.appNotesEnabled"
                      @update:model-value="saveAppSettings"
                      :disable="saving"
                    />
                  </q-item-section>
                </q-item>
              </div>

              <div v-if="saveError" class="q-mt-md">
                <q-banner class="bg-negative text-white">
                  {{ saveError }}
                </q-banner>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { api } from "boot/axios";
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export default defineComponent({
	name: "SettingsModal",
	data: () => ({
		showModal: false,
		activeTab: "info",
		updateAvailable: false,
		latestVersion: "",
		appSettings: {
			appDriveEnabled: true,
			appEmailEnabled: true,
			appNotesEnabled: true,
		},
		saving: false,
		saveError: null,
	}),
	setup() {
		const mainStore = useMainStore();
		const authStore = useAuthStore();
		return { mainStore, authStore };
	},
	methods: {
		async open() {
			this.showModal = true;
			this.activeTab = "info";
			await this.loadSettings();
			await this.checkForUpdates();
		},
		close() {
			this.showModal = false;
		},
		async loadSettings() {
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
				console.error("Failed to load settings:", error);
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
					message: "Settings saved",
					timeout: 2000,
				});
				// Emit event to notify sidebar of changes
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
		async checkForUpdates() {
			try {
				const resp = await fetch(
					"https://api.github.com/repos/G4brym/R2-Explorer/releases/latest",
				);
				if (resp.ok) {
					const parsed = await resp.json();
					const latestVersion = parsed.tag_name.replace("v", "");
					if (this.isUpdateAvailable(this.mainStore.version, latestVersion)) {
						this.latestVersion = latestVersion;
						this.updateAvailable = true;
					}
				}
			} catch (error) {
				console.log("Unable to check for updates:", error);
			}
		},
		isUpdateAvailable(currentVersion, latestVersion) {
			const current = currentVersion.split(".").map(Number);
			const latest = latestVersion.split(".").map(Number);

			if (latest[0] > current[0]) return true;
			if (latest[0] < current[0]) return false;
			if (latest[1] > current[1]) return true;
			if (latest[1] < current[1]) return false;
			if (latest[2] > current[2]) return true;

			return false;
		},
	},
});
</script>
