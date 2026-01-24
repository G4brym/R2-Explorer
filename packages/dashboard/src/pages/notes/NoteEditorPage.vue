<template>
  <q-page class="q-pa-md">
    <div class="note-editor-container">
      <div class="note-editor-header q-mb-md">
        <q-btn flat icon="arrow_back" label="Back" @click="goBack" class="q-mr-sm" />
        <q-space />
        <q-btn v-if="!mainStore.apiReadonly && !loading" color="primary" icon="save" label="Save" @click="saveNote" :loading="saving" class="q-mr-sm" />
        <q-btn v-if="!mainStore.apiReadonly && !loading" color="negative" icon="delete" label="Delete" @click="confirmDelete" :loading="deleting" />
      </div>

      <div v-if="loading" class="flex justify-center q-my-xl">
        <q-spinner color="primary" size="xl" />
      </div>

      <div v-else class="note-editor-content">
        <q-input
          v-model="noteTitle"
          :readonly="mainStore.apiReadonly"
          label="Title"
          outlined
          class="q-mb-md note-title-input"
          :input-style="{ fontSize: '1.5em', fontWeight: 'bold' }"
        />

        <tiptap-editor
          v-model="noteContent"
          :editable="!mainStore.apiReadonly"
          class="note-body-editor"
        />
      </div>
    </div>

    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Note</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Are you sure you want to delete this note? This action cannot be undone.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteNote" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import TiptapEditor from "components/notes/TiptapEditor.vue";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";
import { apiHandler, decode } from "../../appUtils";

const NOTES_PREFIX = ".r2-explorer/notes/";

export default defineComponent({
	name: "NoteEditorPage",
	components: { TiptapEditor },
	data: () => ({
		loading: true,
		saving: false,
		deleting: false,
		deleteDialog: false,
		noteTitle: "",
		noteContent: "",
		originalData: null,
	}),
	computed: {
		selectedBucket: function () {
			return this.$route.params.bucket;
		},
		noteFilename: function () {
			return this.$route.params.note ? decode(this.$route.params.note) : null;
		},
		noteKey: function () {
			return this.noteFilename ? NOTES_PREFIX + this.noteFilename : null;
		},
	},
	watch: {
		noteFilename(newVal) {
			if (newVal) {
				this.loadNote();
			}
		},
	},
	methods: {
		goBack: function () {
			this.$router.push({
				name: "notes-home",
				params: {
					bucket: this.selectedBucket,
				},
			});
		},
		loadNote: async function () {
			if (!this.noteKey) return;

			this.loading = true;
			try {
				const response = await apiHandler.downloadFile(
					this.selectedBucket,
					this.noteKey,
					{},
				);

				if (response.data) {
					this.originalData = response.data;
					this.noteTitle = response.data.title || "";
					this.noteContent = response.data.content || "";
				}
			} catch (error) {
				console.error("Error loading note:", error);
				this.$q.notify({
					type: "negative",
					message: "Failed to load note",
				});
			} finally {
				this.loading = false;
			}
		},
		getPlainTextPreview: (html) => {
			const temp = document.createElement("div");
			temp.innerHTML = html;
			const text = temp.textContent || temp.innerText || "";
			return text.substring(0, 100).trim();
		},
		saveNote: async function () {
			this.saving = true;
			try {
				const now = Date.now();
				const noteData = {
					version: 1,
					title: this.noteTitle,
					content: this.noteContent,
					createdAt: this.originalData?.createdAt || now,
					updatedAt: now,
				};

				const blob = new Blob([JSON.stringify(noteData)], {
					type: "application/json",
				});

				await apiHandler.uploadObjects(blob, this.noteKey, this.selectedBucket);

				const customMetadata = {
					title: this.noteTitle,
					preview: this.getPlainTextPreview(this.noteContent),
					createdAt: String(noteData.createdAt),
					updatedAt: String(noteData.updatedAt),
				};

				await apiHandler.updateMetadata(
					this.selectedBucket,
					this.noteKey,
					customMetadata,
				);

				this.originalData = noteData;

				this.$q.notify({
					type: "positive",
					message: "Note saved successfully",
				});
			} catch (error) {
				console.error("Error saving note:", error);
				this.$q.notify({
					type: "negative",
					message: "Failed to save note",
				});
			} finally {
				this.saving = false;
			}
		},
		confirmDelete: function () {
			this.deleteDialog = true;
		},
		deleteNote: async function () {
			this.deleting = true;
			try {
				await apiHandler.deleteObject(this.noteKey, this.selectedBucket);

				this.$q.notify({
					type: "positive",
					message: "Note deleted successfully",
				});

				this.$bus.emit("fetchNotes");
				this.goBack();
			} catch (error) {
				console.error("Error deleting note:", error);
				this.$q.notify({
					type: "negative",
					message: "Failed to delete note",
				});
			} finally {
				this.deleting = false;
				this.deleteDialog = false;
			}
		},
		handleKeydown: function (e) {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				if (!this.mainStore.apiReadonly && !this.loading && !this.saving) {
					this.saveNote();
				}
			}
		},
	},
	created() {
		document.addEventListener("keydown", this.handleKeydown);
		if (this.noteFilename) {
			this.loadNote();
		}
	},
	unmounted() {
		document.removeEventListener("keydown", this.handleKeydown);
	},
	setup() {
		return {
			mainStore: useMainStore(),
		};
	},
});
</script>

<style scoped>
.note-editor-container {
  max-width: 900px;
  margin: 0 auto;
}

.note-editor-header {
  display: flex;
  align-items: center;
}

.note-title-input :deep(.q-field__control) {
  height: auto;
}

.note-body-editor {
  min-height: 400px;
}
</style>
