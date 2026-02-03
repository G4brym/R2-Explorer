<template>
  <div class="column full-height q-pa-sm">
    <!-- New Button -->
    <q-btn
      v-if="mainStore.apiReadonly"
      color="red"
      icon="lock"
      label="Read only"
      class="q-mb-md"
      unelevated
      no-caps
    />
    <q-btn
      v-else
      color="green"
      icon="add"
      label="New"
      class="q-mb-md btn-primary"
      unelevated
      no-caps
    >
      <q-menu>
        <q-list style="min-width: 180px">
          <q-item clickable v-close-popup @click="$refs.createFile.open()">
            <q-item-section avatar>
              <q-icon name="note_add" />
            </q-item-section>
            <q-item-section>New File</q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="$refs.createFolder.open()">
            <q-item-section avatar>
              <q-icon name="create_new_folder" />
            </q-item-section>
            <q-item-section>New Folder</q-item-section>
          </q-item>

          <q-separator />

          <q-item clickable v-close-popup @click="$bus.emit('openFilesUploader')">
            <q-item-section avatar>
              <q-icon name="upload_file" />
            </q-item-section>
            <q-item-section>Upload Files</q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="$bus.emit('openFoldersUploader')">
            <q-item-section avatar>
              <q-icon name="drive_folder_upload" />
            </q-item-section>
            <q-item-section>Upload Folder</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <!-- Navigation List -->
    <q-list class="col">
      <q-item
        v-if="appSettings.appDriveEnabled"
        clickable
        v-ripple
        :active="selectedApp === 'files'"
        active-class="bg-grey-3"
        @click="gotoFiles"
      >
        <q-item-section avatar>
          <q-icon name="folder_copy" :color="selectedApp === 'files' ? 'green' : 'grey-7'" />
        </q-item-section>
        <q-item-section>Files</q-item-section>
      </q-item>

      <q-item
        v-if="appSettings.appEmailEnabled && mainStore.config && mainStore.config.emailRouting !== false"
        clickable
        v-ripple
        :active="selectedApp === 'email'"
        active-class="bg-grey-3"
        @click="gotoEmail"
      >
        <q-item-section avatar>
          <q-icon name="email" :color="selectedApp === 'email' ? 'green' : 'grey-7'" />
        </q-item-section>
        <q-item-section>Email</q-item-section>
      </q-item>

      <q-item
        v-if="appSettings.appNotesEnabled"
        clickable
        v-ripple
        :active="selectedApp === 'notes'"
        active-class="bg-grey-3"
        @click="gotoNotes"
      >
        <q-item-section avatar>
          <q-icon name="sticky_note_2" :color="selectedApp === 'notes' ? 'green' : 'grey-7'" />
        </q-item-section>
        <q-item-section>Notes</q-item-section>
      </q-item>
    </q-list>

    <!-- Settings Button at bottom -->
    <div v-if="authStore.isAdmin">
      <q-separator class="q-my-sm" />
      <q-item
        clickable
        v-ripple
        @click="$refs.settingsModal.open()"
      >
        <q-item-section avatar>
          <q-icon name="settings" color="grey-7" />
        </q-item-section>
        <q-item-section>Settings</q-item-section>
      </q-item>
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
		gotoEmail() {
			if (this.selectedApp !== "email") this.changeApp("email");
		},
		gotoFiles() {
			if (this.selectedApp !== "files") this.changeApp("files");
		},
		gotoNotes() {
			if (this.selectedApp !== "notes") this.changeApp("notes");
		},
		changeApp(app) {
			this.$router.push({
				name: `${app}-home`,
				params: { bucket: this.selectedBucket },
			});
		},
		async loadAppSettings() {
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
		selectedBucket() {
			return this.$route.params.bucket;
		},
		selectedApp() {
			return this.$route.name.split("-")[0];
		},
	},
	async mounted() {
		await this.loadAppSettings();

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
		return { mainStore, authStore };
	},
});
</script>
