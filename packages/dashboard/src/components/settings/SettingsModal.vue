<template>
  <q-dialog v-model="showModal">
    <q-card style="width: 100%; max-width: 650px;">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Settings</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator class="q-mt-md" />

      <!-- Content -->
      <div class="q-pa-md" style="min-height: 400px;">
        <!-- Info Section -->
        <div>
          <div class="text-subtitle1 text-weight-medium q-mb-md">System Information</div>

          <!-- Version -->
          <div class="row items-start q-py-md" style="border-bottom: 1px solid #f3f4f6;">
            <div class="col">
              <div class="text-body2 text-weight-medium">Version</div>
              <div class="text-body2 text-grey-7">{{ mainStore.version }}</div>
            </div>
            <div v-if="updateAvailable" class="col-auto text-right">
              <q-badge color="amber" text-color="black" label="Update available" />
              <div class="text-caption text-grey-7 q-mt-xs">{{ latestVersion }}</div>
              <a
                href="https://r2explorer.com/getting-started/updating-your-project/"
                target="_blank"
                class="link-primary text-caption"
              >
                Learn how to update
              </a>
            </div>
          </div>

          <!-- Authentication -->
          <div class="q-py-md" style="border-bottom: 1px solid #f3f4f6;">
            <div class="text-body2 text-weight-medium q-mb-xs">Authentication</div>
            <div class="text-body2 text-grey-7">
              <template v-if="mainStore.auth">
                <div>Mode: <span class="text-grey-9" style="font-family: monospace;">{{ authStore.authMode }}</span></div>
                <div>Email: <span class="text-grey-9" style="font-family: monospace;">{{ mainStore.auth.username }}</span></div>
              </template>
              <template v-else>
                <span v-if="authStore.authMode === 'disabled'" style="color: #d97706;">Authentication disabled</span>
                <span v-else>Not authenticated</span>
              </template>
            </div>
          </div>

          <!-- Configuration -->
          <div class="q-py-md" style="border-bottom: 1px solid #f3f4f6;">
            <div class="text-body2 text-weight-medium q-mb-xs">Configuration</div>
            <div class="text-body2 text-grey-7">
              <div :style="{ color: mainStore.apiReadonly ? '#d97706' : '#16a34a' }">
                {{ mainStore.apiReadonly ? 'Read-only mode' : 'Read-write mode' }}
              </div>
              <div>Hidden files: {{ mainStore.showHiddenFiles ? 'Visible' : 'Hidden' }}</div>
            </div>
          </div>

          <!-- Links -->
          <div class="q-pt-lg row justify-center q-gutter-md text-body2">
            <a
              href="https://r2explorer.com"
              target="_blank"
              class="text-grey-7"
              style="text-decoration: none;"
            >
              Documentation
            </a>
            <span class="text-grey-4">|</span>
            <a
              href="https://github.com/G4brym/R2-Explorer"
              target="_blank"
              class="text-grey-7"
              style="text-decoration: none;"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export default defineComponent({
	name: "SettingsModal",
	data: () => ({
		showModal: false,
		updateAvailable: false,
		latestVersion: "",
	}),
	setup() {
		const mainStore = useMainStore();
		const authStore = useAuthStore();
		return { mainStore, authStore };
	},
	methods: {
		async open() {
			this.showModal = true;
			await this.checkForUpdates();
		},
		close() {
			this.showModal = false;
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
