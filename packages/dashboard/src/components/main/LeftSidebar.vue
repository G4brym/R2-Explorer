<template>
  <div class="q-pa-md" style="height: 100%">
    <div class="flex column" style="height: 100%">
      <q-btn v-if="mainStore.apiReadonly" color="red" stack class="q-mb-lg" label="Read only" />
      <q-btn v-else color="green" icon="add" stack class="q-mb-lg" label="New">
        <q-menu>
          <q-list>
            <q-item clickable v-close-popup @click="$refs.createFile.open()">
              <q-item-section>
                <q-item-label>
                  <q-icon name="note_add" size="sm" />
                  New File
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$refs.createFolder.open()">
              <q-item-section>
                <q-item-label>
                  <q-icon name="create_new_folder" size="sm" />
                  New Folder
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$bus.emit('openFilesUploader')">
              <q-item-section>
                <q-item-label>
                  <q-icon name="upload_file" size="sm" />
                  Upload Files
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$bus.emit('openFoldersUploader')">
              <q-item-section>
                <q-item-label>
                  <q-icon name="folder" size="sm" />
                  Upload Folders
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <q-btn
        v-if="appSettings.appDriveEnabled"
        class="q-mb-sm"
        @click="gotoFiles"
        color="blue"
        icon="folder_copy"
        label="Files"
        stack
      />
      <q-btn
        v-if="appSettings.appEmailEnabled && mainStore.config && mainStore.config.emailRouting !== false"
        class="q-mb-sm"
        @click="gotoEmail"
        color="blue"
        icon="email"
        label="Email"
        stack
      />
      <q-btn
        v-if="appSettings.appNotesEnabled"
        class="q-mb-sm"
        @click="gotoNotes"
        color="blue"
        icon="sticky_note_2"
        label="Notes"
        stack
      />

      <!-- Settings button - only visible to admins -->
      <q-btn
        v-if="authStore.isAdmin"
        class="q-mb-sm q-mt-auto q-mb-0"
        @click="$refs.settingsModal.open()"
        color="secondary"
        icon="settings"
        label="Settings"
        stack
      />
    </div>
  </div>

  <settings-modal ref="settingsModal" />
  <create-folder ref="createFolder" />
  <create-file ref="createFile" />
</template>

<script>
import { api } from "boot/axios";
import CreateFile from "components/files/CreateFile.vue";
import CreateFolder from "components/files/CreateFolder.vue";
import SettingsModal from "components/settings/SettingsModal.vue";
import { useAuthStore } from "stores/auth-store";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export default defineComponent({
	name: "LeftSidebar",
	data: () => ({
		appSettings: {
			appDriveEnabled: true,
			appEmailEnabled: true,
			appNotesEnabled: true,
		},
	}),
	components: { CreateFolder, CreateFile, SettingsModal },
	methods: {
		gotoEmail: function () {
			if (this.selectedApp !== "email") this.changeApp("email");
		},
		gotoFiles: function () {
			if (this.selectedApp !== "files") this.changeApp("files");
		},
		gotoNotes: function () {
			if (this.selectedApp !== "notes") this.changeApp("notes");
		},
		changeApp: function (app) {
			this.$router.push({
				name: `${app}-home`,
				params: { bucket: this.selectedBucket },
			});
		},
		async loadAppSettings() {
			// Load app settings from the auth store initialization
			if (this.authStore.authMode === "session") {
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
			}
		},
	},
	computed: {
		selectedBucket: function () {
			return this.$route.params.bucket;
		},
		selectedApp: function () {
			return this.$route.name.split("-")[0];
		},
	},
	async mounted() {
		await this.loadAppSettings();

		// Listen for settings updates from the modal
		this.$bus.on("settingsUpdated", (settings) => {
			this.appSettings = {
				appDriveEnabled: settings.appDriveEnabled,
				appEmailEnabled: settings.appEmailEnabled,
				appNotesEnabled: settings.appNotesEnabled,
			};
		});
	},
	beforeUnmount() {
		this.$bus.off("settingsUpdated");
	},
	setup() {
		const mainStore = useMainStore();
		const authStore = useAuthStore();

		return {
			mainStore,
			authStore,
		};
	},
});
</script>

<style scoped>
.q-btn {
  max-width: 100%;
  padding: 4px;
}
</style>
