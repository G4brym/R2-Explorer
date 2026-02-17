<template>
  <q-dialog v-model="deleteModal" @hide="reset">
    <q-card>
      <q-card-section class="row column" v-if="row">
        <q-avatar class="q-mb-md" icon="delete" color="red" text-color="white" />
        <span v-if="row.type === 'folder'" class="q-ml-sm">Are you sure you want to delete the folder <code>{{row.name}}</code>, and
          <code v-if="deleteFolderInnerFilesCount !== null">{{deleteFolderInnerFilesCount}}</code>
          <code v-else><q-spinner color="primary"/></code>
          files inside?</span>
        <span v-else class="q-ml-sm">Are you sure you want to delete the file <code>{{row.name}}</code>?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Delete" color="red" :loading="loading" @click="deleteConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="renameModal" @hide="reset">
    <q-card style="min-width: 300px;">
      <q-card-section class="row column" v-if="row">
        <q-avatar class="q-mb-md" icon="edit" color="orange" text-color="white" />
        <q-input v-model="renameInput" label="Standard" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Rename" color="orange" :loading="loading" @click="renameConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="updateMetadataModal" @hide="reset">
    <q-card style="min-width: 300px;">
      <q-card-section class="row column" v-if="row">
        <h6 class="q-mt-none q-mb-sm flex">HTTP Metadata <q-btn class="q-mr-none q-ml-auto" round size="sm" color="primary" icon="add" @click="updateHttpMetadata.push({key: '', value: ''})" /></h6>
        <div class="flex row" v-for="(val, index) in updateHttpMetadata" :key="index">
          <div>
            <q-input v-model="updateHttpMetadata[index].key" label="Key" />
          </div>
          <div>
            <q-input v-model="updateHttpMetadata[index].value" label="Value" />
          </div>
          <div class="flex">
            <q-btn class="q-my-auto" round size="sm" color="orange" icon="remove" @click="updateHttpMetadata.splice(index, 1)" />
          </div>
        </div>

        <h6 class="q-mt-xl q-mb-sm flex">Custom Metadata <q-btn class="q-mr-none q-ml-auto" round size="sm" color="primary" icon="add" @click="updateCustomMetadata.push({key: '', value: ''})" /></h6>
        <div class="flex row" v-for="(val, index) in updateCustomMetadata" :key="index">
          <div>
            <q-input v-model="updateCustomMetadata[index].key" label="Key" />
          </div>
          <div>
            <q-input v-model="updateCustomMetadata[index].value" label="Value" />
          </div>
          <div class="flex">
            <q-btn class="q-my-auto" round size="sm" color="orange" icon="remove" @click="updateCustomMetadata.splice(index, 1)" />
          </div>
        </div>

      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Update Metadata" color="orange" :loading="loading" @click="updateConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useQuasar } from "quasar";
import { ROOT_FOLDER, apiHandler, decode, encode } from "src/appUtils";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export default defineComponent({
	name: "FileOptions",
	data: () => ({
		row: null,
		deleteFolderContents: [],
		deleteModal: false,
		renameModal: false,
		updateMetadataModal: false,
		deleteFolderInnerFilesCount: null,
		newFolderName: "",
		renameInput: "",
		updateCustomMetadata: [],
		updateHttpMetadata: [],
		loading: false,
	}),
	methods: {
		deleteObject: async function (row) {
			this.deleteModal = true;
			this.row = row;
			if (row.type === "folder") {
				this.deleteFolderContents = await apiHandler.fetchFile(
					this.selectedBucket,
					row.key,
					"",
				);
				this.deleteFolderInnerFilesCount = this.deleteFolderContents.length;
			}
		},
		renameObject: async function (row) {
			this.renameModal = true;
			this.row = row;
			// console.log(row)
			this.renameInput = row.name;
		},
		updateMetadataObject: async function (row) {
			this.updateMetadataModal = true;
			this.row = row;
			if (row.httpMetadata) {
				this.updateHttpMetadata = Object.entries(row.httpMetadata).map(
					([key, value]) => {
						return { key: key, value: value };
					},
				);
			}
			if (row.customMetadata) {
				this.updateCustomMetadata = Object.entries(row.customMetadata).map(
					([key, value]) => {
						return { key: key, value: value };
					},
				);
			}
		},
		renameConfirm: async function () {
			if (this.renameInput.length === 0) {
				return;
			}

			this.loading = true;
			await apiHandler.renameObject(
				this.selectedBucket,
				this.row.key,
				this.row.key.split("/").slice(0, -1).concat(this.renameInput).join("/"),
			);

			this.$bus.emit("fetchFiles");
			this.reset();
			this.q.notify({
				group: false,
				icon: "done", // we add an icon
				spinner: false, // we reset the spinner setting so the icon can be displayed
				message: "File renamed!",
				timeout: 2500, // we will timeout it in 2.5s
			});
		},
		updateConfirm: async function () {
			this.loading = true;
			await apiHandler.updateMetadata(
				this.selectedBucket,
				this.row.key,
				this.updateCustomMetadata.reduce(
					(a, v) => ({ ...a, [v.key]: v.value }),
					{},
				),
				this.updateHttpMetadata.reduce(
					(a, v) => ({ ...a, [v.key]: v.value }),
					{},
				),
			);
			this.$bus.emit("fetchFiles");
			this.reset();
			this.q.notify({
				group: false,
				icon: "done", // we add an icon
				spinner: false, // we reset the spinner setting so the icon can be displayed
				message: "File Updated!",
				timeout: 2500, // we will timeout it in 2.5s
			});
		},
		deleteConfirm: async function () {
			if (this.row.type === "folder") {
				// When deleting folders, first must copy the objects, because the popup close forces a reset on properties
				const originalFolder = { ...this.row };
				const folderContents = [...this.deleteFolderContents];
				const folderContentsCount = this.deleteFolderInnerFilesCount;

				this.deleteModal = false;

				const notif = this.q.notify({
					group: false,
					spinner: true,
					message: "Deleting files...",
					caption: "0%",
					timeout: 0,
				});

				for (const [i, innerFile] of folderContents.entries()) {
					if (innerFile.key) {
						await apiHandler.deleteObject(innerFile.key, this.selectedBucket);
					}
					notif({
						caption: `${Number.parseInt((i * 100) / (folderContentsCount + 1))}%`, // +1 because still needs to delete the folder
					});
				}

				await apiHandler.deleteObject(originalFolder.key, this.selectedBucket);

				notif({
					icon: "done", // we add an icon
					spinner: false, // we reset the spinner setting so the icon can be displayed
					caption: "100%",
					message: "Folder deleted!",
					timeout: 2500, // we will timeout it in 2.5s
				});
			} else {
				this.deleteModal = false;
				await apiHandler.deleteObject(this.row.key, this.selectedBucket);
				this.q.notify({
					group: false,
					icon: "done", // we add an icon
					spinner: false, // we reset the spinner setting so the icon can be displayed
					message: "File deleted!",
					timeout: 2500, // we will timeout it in 2.5s
				});
			}

			this.$bus.emit("fetchFiles");
			this.reset();
		},
		reset: function () {
			this.loading = false;
			this.deleteModal = false;
			this.renameModal = false;
			this.updateMetadataModal = false;
			this.renameInput = "";
			this.updateCustomMetadata = [];
			this.updateHttpMetadata = [];
			this.row = null;
			this.deleteFolderInnerFilesCount = null;
			this.deleteFolderContents = [];
		},
		onSubmit: async function () {
			await apiHandler.createFolder(
				`${this.selectedFolder + this.newFolderName}/`,
				this.selectedBucket,
			);
			this.$bus.emit("fetchFiles");
			this.modal = false;
		},
		open: function () {
			this.modal = true;
		},
	},
	computed: {
		selectedBucket: function () {
			return this.$route.params.bucket;
		},
		selectedFolder: function () {
			if (
				this.$route.params.folder &&
				this.$route.params.folder !== ROOT_FOLDER
			) {
				return decode(this.$route.params.folder);
			}
			return "";
		},
	},
	setup() {
		return {
			mainStore: useMainStore(),
			q: useQuasar(),
		};
	},
});
</script>

<style scoped>
code {
  background-color: #e9e9e9;
  padding: 0.25em;
}
</style>
