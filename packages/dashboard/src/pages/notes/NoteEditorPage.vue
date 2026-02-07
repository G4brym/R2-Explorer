<template>
  <q-page class="note-editor-page">
    <div class="note-editor-wrapper">
      <!-- Header Bar -->
      <div class="note-editor-toolbar">
        <q-btn flat round dense icon="arrow_back" @click="goBack" class="text-grey-7" />

        <q-space />

        <div class="note-editor-actions">
          <q-chip v-if="isAutoSaving" size="sm" color="grey-3" text-color="grey-7" icon="cloud_sync">
            Saving...
          </q-chip>
          <q-chip v-else-if="originalData" size="sm" color="grey-2" text-color="grey-6" icon="cloud_done">
            Saved
          </q-chip>

          <q-btn v-if="!mainStore.apiReadonly && !loading"
                 flat dense round
                 icon="save"
                 @click="saveNote"
                 :loading="saving"
                 class="q-ml-sm">
            <q-tooltip>Save (Ctrl/Cmd + S)</q-tooltip>
          </q-btn>

          <q-btn v-if="!mainStore.apiReadonly && !loading"
                 flat dense round
                 icon="delete"
                 @click="confirmDelete"
                 :loading="deleting"
                 class="q-ml-sm text-negative">
            <q-tooltip>Delete note</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div v-if="loading" class="note-editor-loading">
        <q-spinner color="primary" size="xl" />
        <div class="q-mt-md text-grey-7">Loading note...</div>
      </div>

      <div v-else class="note-editor-container">
        <!-- Title Input -->
        <input
          v-model="noteTitle"
          :readonly="mainStore.apiReadonly"
          placeholder="Untitled note"
          class="note-title-field"
        />

        <!-- Content Editor -->
        <div class="note-content-wrapper">
          <tiptap-editor
            v-model="noteContent"
            :editable="!mainStore.apiReadonly"
            class="note-body-editor"
          />
        </div>
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
		autoSaveTimer: null,
		isAutoSaving: false,
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
		noteTitle() {
			this.scheduleAutoSave();
		},
		noteContent() {
			this.scheduleAutoSave();
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
		scheduleAutoSave: function () {
			// Don't auto-save if readonly, loading, or already saving
			if (
				this.mainStore.apiReadonly ||
				this.loading ||
				this.saving ||
				this.isAutoSaving
			) {
				return;
			}

			// Don't auto-save if note hasn't been loaded yet (no original data)
			if (!this.originalData) {
				return;
			}

			// Clear existing timer
			if (this.autoSaveTimer) {
				clearTimeout(this.autoSaveTimer);
			}

			// Set new timer for 10 seconds
			this.autoSaveTimer = setTimeout(() => {
				this.autoSaveNote();
			}, 10000);
		},
		autoSaveNote: async function () {
			this.isAutoSaving = true;
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
					type: "info",
					message: "You just autosaved",
					position: "bottom-right",
					timeout: 2000,
				});
			} catch (error) {
				console.error("Error auto-saving note:", error);
				// Don't show error notification for auto-save to avoid interrupting user
			} finally {
				this.isAutoSaving = false;
			}
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

				// Clear any pending auto-save since we just manually saved
				if (this.autoSaveTimer) {
					clearTimeout(this.autoSaveTimer);
				}

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
		// Clear auto-save timer to prevent memory leaks
		if (this.autoSaveTimer) {
			clearTimeout(this.autoSaveTimer);
		}
	},
	setup() {
		return {
			mainStore: useMainStore(),
		};
	},
});
</script>

<style scoped>
.note-editor-page {
  background: #fafafa;
  min-height: 100vh;
}

.note-editor-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 0;
}

.note-editor-toolbar {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.note-editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-editor-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.note-editor-container {
  background: white;
  margin: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.note-title-field {
  width: 100%;
  border: none;
  outline: none;
  padding: 32px 32px 16px 32px;
  font-size: 2.5em;
  font-weight: 700;
  color: #1f2937;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
}

.note-title-field::placeholder {
  color: #d1d5db;
}

.note-title-field:focus {
  outline: none;
}

.note-content-wrapper {
  border-top: 1px solid #f3f4f6;
  min-height: calc(100vh - 250px);
}

.note-body-editor {
  padding: 24px 32px 48px 32px;
}

.note-body-editor :deep(.ProseMirror) {
  outline: none;
  min-height: 400px;
  font-size: 16px;
  line-height: 1.75;
  color: #374151;
}

.note-body-editor :deep(.ProseMirror p) {
  margin-bottom: 16px;
}

.note-body-editor :deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: 700;
  margin-top: 24px;
  margin-bottom: 16px;
  color: #111827;
}

.note-body-editor :deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 20px;
  margin-bottom: 12px;
  color: #111827;
}

.note-body-editor :deep(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin-top: 16px;
  margin-bottom: 8px;
  color: #111827;
}

.note-body-editor :deep(.ProseMirror ul),
.note-body-editor :deep(.ProseMirror ol) {
  padding-left: 24px;
  margin-bottom: 16px;
}

.note-body-editor :deep(.ProseMirror li) {
  margin-bottom: 4px;
}

.note-body-editor :deep(.ProseMirror code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
}

.note-body-editor :deep(.ProseMirror pre) {
  background: #1f2937;
  color: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.note-body-editor :deep(.ProseMirror blockquote) {
  border-left: 4px solid #22c55e;
  padding-left: 16px;
  margin-left: 0;
  margin-bottom: 16px;
  color: #6b7280;
  font-style: italic;
}

.note-body-editor :deep(.ProseMirror a) {
  color: #22c55e;
  text-decoration: underline;
}

.note-body-editor :deep(.ProseMirror strong) {
  font-weight: 600;
}
</style>
