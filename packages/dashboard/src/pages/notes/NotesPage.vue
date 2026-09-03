<template>
  <q-page class="notes-page flex" :class="{ 'note-open': !!selectedName }">
    <div class="notes-list column">
      <div class="q-pa-sm">
        <q-btn
          v-if="!mainStore.apiReadonly"
          color="green"
          icon="add"
          label="New Note"
          class="full-width"
          data-testid="new-note-btn"
          @click="openCreateDialog"
        />
      </div>

      <q-list v-if="notes.length > 0" separator class="col scroll">
        <q-item
          v-for="note in notes"
          :key="note.hash"
          clickable
          :active="selectedName === note.name"
          active-class="bg-blue-1"
          data-testid="note-item"
          @click="openNote(note)"
        >
          <q-item-section>
            <q-item-label class="ellipsis">{{ noteTitle(note.name) }}</q-item-label>
            <q-item-label caption>{{ note.lastModified }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-else-if="!loading" class="q-pa-md text-center text-grey">
        <q-icon name="sticky_note_2" color="orange" size="lg" />
        <div>No notes yet</div>
      </div>

      <div v-if="loading" class="q-pa-md text-center">
        <q-spinner color="primary" size="md" />
      </div>
    </div>

    <div class="notes-editor column col">
      <template v-if="selectedName">
        <div class="row items-center q-px-md q-py-sm editor-toolbar">
          <q-btn
            flat
            round
            icon="arrow_back"
            class="lt-sm q-mr-sm"
            data-testid="back-to-notes-btn"
            @click="closeNote"
          />
          <div class="text-h6 ellipsis col" data-testid="note-title">
            {{ noteTitle(selectedName) }}
          </div>

          <q-btn-toggle
            v-model="editorMode"
            toggle-color="primary"
            flat
            dense
            :options="[
              { label: 'Edit', value: 'edit' },
              { label: 'Preview', value: 'preview' },
            ]"
          />

          <q-btn
            v-if="!mainStore.apiReadonly"
            color="primary"
            label="Save"
            class="q-ml-md"
            :disable="!isDirty"
            :loading="saving"
            data-testid="save-note-btn"
            @click="saveNote"
          />

          <q-btn
            v-if="!mainStore.apiReadonly"
            flat
            round
            color="red"
            icon="delete"
            class="q-ml-sm"
            data-testid="delete-note-btn"
            @click="deleteNote"
          />
        </div>

        <q-separator />

        <div v-if="loadingContent" class="q-pa-md text-center">
          <q-spinner color="primary" size="md" />
        </div>

        <textarea
          v-else-if="editorMode === 'edit'"
          v-model="content"
          class="note-textarea col q-pa-md"
          placeholder="Write your note in markdown..."
          data-testid="note-textarea"
          @keydown.ctrl.s.prevent="saveNote"
          @keydown.meta.s.prevent="saveNote"
        ></textarea>

        <div
          v-else
          class="note-preview col q-pa-md scroll"
          data-testid="note-preview"
          v-html="renderedContent"
        ></div>
      </template>

      <div v-else class="col flex flex-center text-grey">
        <div class="text-center">
          <q-icon name="sticky_note_2" color="orange" size="xl" />
          <h6 class="q-my-sm">Select a note or create a new one</h6>
        </div>
      </div>
    </div>
  </q-page>

  <q-dialog v-model="createDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">New Note</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="newNoteName"
          dense
          autofocus
          label="Note name"
          :error="!!createError"
          :error-message="createError"
          data-testid="new-note-name"
          @keyup.enter="createNote"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          flat
          label="Create"
          color="primary"
          :loading="creating"
          :disable="loading"
          data-testid="create-note-btn"
          @click="createNote"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useQuasar } from "quasar";
import { apiHandler, decode, encode } from "src/appUtils";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

export const NOTES_PREFIX = ".r2-explorer/notes/";

export default defineComponent({
	name: "NotesPage",
	data: () => ({
		notes: [],
		loading: false,
		loadingContent: false,
		saving: false,
		creating: false,
		content: "",
		savedContent: "",
		debouncedContent: "",
		debounceTimer: null,
		editorMode: "edit",
		createDialog: false,
		newNoteName: "",
		createError: "",
		loadSeq: 0,
	}),
	computed: {
		selectedBucket() {
			return this.$route.params.bucket;
		},
		selectedName() {
			if (!this.$route.params.file) {
				return null;
			}
			try {
				return decode(this.$route.params.file);
			} catch {
				return null;
			}
		},
		isDirty() {
			return this.content !== this.savedContent;
		},
		isNotesEnabled() {
			return this.mainStore.config?.apps?.notes?.enabled !== false;
		},
		renderedContent() {
			if (this.editorMode !== "preview") {
				return "";
			}
			try {
				const raw = marked.parse(this.debouncedContent, {
					gfm: true,
					breaks: false,
				});
				const html = typeof raw === "string" ? raw : String(raw);
				return DOMPurify.sanitize(html);
			} catch {
				return DOMPurify.sanitize(this.debouncedContent);
			}
		},
	},
	watch: {
		selectedBucket() {
			// Clear list optimistically to avoid flashing the previous bucket's notes.
			this.notes = [];
			// selectedName watcher won't fire when the filename is identical
			// across buckets, so reload explicitly to avoid showing stale content.
			if (this.selectedName) {
				this.content = "";
				this.savedContent = "";
				this.debouncedContent = "";
				this.loadNote();
			}
			this.fetchNotes();
		},
		selectedName() {
			this.loadNote();
		},
		content(newVal) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = setTimeout(() => {
				this.debouncedContent = newVal;
			}, 150);
		},
		editorMode(newVal) {
			if (newVal === "preview") {
				clearTimeout(this.debounceTimer);
				this.debouncedContent = this.content;
			}
		},
		isNotesEnabled(enabled) {
			if (!enabled) {
				this.$router.replace({
					name: "files-home",
					params: { bucket: this.selectedBucket },
				});
			}
		},
	},
	methods: {
		noteTitle(name) {
			return name.replace(/\.md$/, "");
		},
		noteKey(name) {
			return `${NOTES_PREFIX}${name}`;
		},
		async fetchNotes() {
			if (!this.isNotesEnabled) {
				return;
			}
			this.loading = true;
			try {
				const files = await apiHandler.fetchFile(
					this.selectedBucket,
					NOTES_PREFIX,
					"/",
				);
				this.notes = files
					.filter((obj) => obj.type === "file" && obj.name.endsWith(".md"))
					.sort((a, b) => b.timestamp - a.timestamp);
			} catch (e) {
				this.q.notify({
					type: "negative",
					message: `Unable to load notes: ${e.message}`,
				});
			} finally {
				this.loading = false;
			}
		},
		openNote(note) {
			if (this.isDirty && !this.confirmDiscard()) {
				return;
			}
			this.$router.push({
				name: "notes-file",
				params: {
					bucket: this.selectedBucket,
					file: encode(note.name),
				},
			});
		},
		confirmDiscard() {
			return window.confirm("You have unsaved changes. Discard them?");
		},
		closeNote() {
			if (this.isDirty && !this.confirmDiscard()) {
				return;
			}
			this.$router.push({
				name: "notes-home",
				params: { bucket: this.selectedBucket },
			});
		},
		handleBeforeUnload(e) {
			if (this.isDirty) {
				e.preventDefault();
				e.returnValue = "";
			}
		},
		async loadNote() {
			if (!this.selectedName) {
				if (this.$route.params.file) {
					this.q.notify({
						type: "negative",
						message: "Invalid note URL",
					});
					this.$router.replace({
						name: "notes-home",
						params: { bucket: this.selectedBucket },
					});
				}
				this.content = "";
				this.savedContent = "";
				this.debouncedContent = "";
				return;
			}

			const seq = ++this.loadSeq;
			const targetBucket = this.selectedBucket;
			const targetName = this.selectedName;

			this.loadingContent = true;
			this.editorMode = "edit";
			try {
				const response = await apiHandler.downloadFile(
					targetBucket,
					this.noteKey(targetName),
					{ downloadType: "blob" },
				);
				// Ignore slow responses when the user already navigated elsewhere.
				if (
					seq !== this.loadSeq ||
					targetName !== this.selectedName ||
					targetBucket !== this.selectedBucket
				) {
					return;
				}
				let text = "";
				if (response.data instanceof ArrayBuffer) {
					text = new TextDecoder().decode(response.data);
				} else if (typeof response.data === "string") {
					text = response.data;
				} else if (response.data) {
					text = new TextDecoder().decode(response.data);
				}
				this.content = text;
				this.savedContent = text;
				this.debouncedContent = text;
			} catch (e) {
				// Ignore errors for superseded loads.
				if (
					seq !== this.loadSeq ||
					targetName !== this.selectedName ||
					targetBucket !== this.selectedBucket
				) {
					return;
				}
				const status = e.response?.status ?? e.status;
				const isNotFound = status === 404;
				// Readonly middleware returns 401 and never blocks GETs, so a
				// 401/403 here is an auth or permission failure, not readonly.
				const isDenied = status === 401 || status === 403;
				let message = `Unable to open note: ${e.message}`;
				if (isNotFound) {
					message = `Note not found: ${this.noteTitle(targetName)}`;
				} else if (isDenied) {
					message = "Access denied";
				}
				this.q.notify({
					type: "negative",
					message,
				});
				// Clear editor on any failure to avoid showing the previous
				// note's content under the new note's title.
				this.content = "";
				this.savedContent = "";
				this.debouncedContent = "";
				if (isNotFound || isDenied) {
					this.$router.replace({
						name: "notes-home",
						params: { bucket: targetBucket },
					});
				}
			} finally {
				if (seq === this.loadSeq) {
					this.loadingContent = false;
				}
			}
		},
		async saveNote() {
			if (!this.selectedName || this.saving) {
				return;
			}
			if (this.mainStore.apiReadonly) {
				this.q.notify({
					type: "negative",
					message: "Cannot save: app is in read-only mode",
				});
				return;
			}

			this.saving = true;
			try {
				await this.writeNote(this.selectedName, this.content);
				this.savedContent = this.content;
				this.q.notify({ type: "positive", message: "Note saved" });
				await this.fetchNotes();
			} catch (e) {
				this.q.notify({
					type: "negative",
					message: `Unable to save note: ${e.message}`,
				});
			} finally {
				this.saving = false;
			}
		},
		writeNote(name, content) {
			const file = new File([content], name, { type: "text/markdown" });
			return apiHandler.uploadObjects(
				file,
				this.noteKey(name),
				this.selectedBucket,
			);
		},
		openCreateDialog() {
			if (this.isDirty && !this.confirmDiscard()) {
				return;
			}
			this.newNoteName = "";
			this.createError = "";
			this.createDialog = true;
		},
		validateNoteName(name) {
			if (!name) {
				return "Name is required";
			}
			if (name.includes("/")) {
				return "Name cannot contain /";
			}
			if (name.includes("\\")) {
				return "Name cannot contain \\";
			}
			if (name === "." || name === "..") {
				return "Invalid name";
			}
			if (name.startsWith(".")) {
				return "Name cannot start with .";
			}
			if (name.length > 255) {
				return "Name is too long (max 255 characters)";
			}
			return null;
		},
		async createNote() {
			if (this.mainStore.apiReadonly) {
				this.createError = "Cannot create note: app is in read-only mode";
				return;
			}
			if (this.isDirty && !this.confirmDiscard()) {
				return;
			}
			const name = this.newNoteName.trim();
			const validationError = this.validateNoteName(name);
			if (validationError) {
				this.createError = validationError;
				return;
			}

			const filename = name.endsWith(".md") ? name : `${name}.md`;
			if (this.notes.some((obj) => obj.name === filename)) {
				this.createError = "A note with this name already exists";
				return;
			}

			this.creating = true;
			try {
				// Client-side list may be stale or empty (fetch failed, another
				// tab created the same name). Re-check on the server to avoid
				// silently overwriting an existing note with empty content.
				try {
					const existing = await apiHandler.headFile(
						this.selectedBucket,
						this.noteKey(filename),
					);
					if (existing) {
						this.createError = "A note with this name already exists";
						return;
					}
				} catch (e) {
					const status = e.response?.status ?? e.status;
					// 404 means the note doesn't exist — proceed. Any other
					// error means we can't verify, so abort to avoid data loss.
					if (status !== 404) {
						this.createError = `Unable to verify note name: ${e.message}`;
						return;
					}
				}
				await this.writeNote(filename, "");
				this.createDialog = false;
				await this.fetchNotes();
				this.$router.push({
					name: "notes-file",
					params: {
						bucket: this.selectedBucket,
						file: encode(filename),
					},
				});
			} catch (e) {
				this.createError = `Unable to create note: ${e.message}`;
			} finally {
				this.creating = false;
			}
		},
		deleteNote() {
			if (this.mainStore.apiReadonly) {
				this.q.notify({
					type: "negative",
					message: "Cannot delete: app is in read-only mode",
				});
				return;
			}
			// Capture target before the confirm dialog: a route/bucket change
			// while the modal is open must not delete the wrong note.
			const name = this.selectedName;
			const bucket = this.selectedBucket;
			if (!name) {
				return;
			}
			this.q
				.dialog({
					title: "Delete note",
					message: `Are you sure you want to delete "${this.noteTitle(name)}"?`,
					cancel: true,
				})
				.onOk(async () => {
					try {
						await apiHandler.deleteObject(this.noteKey(name), bucket);
						// Only clear the editor if still viewing the deleted note.
						if (this.selectedBucket === bucket && this.selectedName === name) {
							this.content = "";
							this.savedContent = "";
							this.debouncedContent = "";
							this.$router.push({
								name: "notes-home",
								params: { bucket },
							});
						}
						await this.fetchNotes();
						this.q.notify({ type: "positive", message: "Note deleted" });
					} catch (e) {
						this.q.notify({
							type: "negative",
							message: `Unable to delete note: ${e.message}`,
						});
					}
				});
		},
	},
	beforeRouteLeave() {
		if (this.isDirty && !this.confirmDiscard()) {
			return false;
		}
	},
	beforeRouteUpdate() {
		if (this.isDirty && !this.confirmDiscard()) {
			return false;
		}
	},
	created() {
		if (!this.isNotesEnabled) {
			this.$router.replace({
				name: "files-home",
				params: { bucket: this.selectedBucket },
			});
			return;
		}
		this.fetchNotes();
		if (this.selectedName) {
			this.loadNote();
		}
	},
	mounted() {
		window.addEventListener("beforeunload", this.handleBeforeUnload);
	},
	beforeUnmount() {
		window.removeEventListener("beforeunload", this.handleBeforeUnload);
		clearTimeout(this.debounceTimer);
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
.notes-page {
  min-height: 400px;
}

.notes-list {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid #e0e0e0;
}

.notes-editor {
  min-width: 0;
}

.editor-toolbar {
  min-height: 56px;
}

.note-textarea {
  border: none;
  outline: none;
  resize: none;
  width: 100%;
  font-family: monospace;
  font-size: 14px;
}

.note-preview :deep(img) {
  max-width: 100%;
}

/* Mobile: master-detail — full-width list, editor takes over when a note is open */
@media (max-width: 599px) {
  .notes-list {
    width: 100%;
    min-width: 0;
    border-right: none;
  }

  .notes-page.note-open .notes-list {
    display: none;
  }

  .notes-page:not(.note-open) .notes-editor {
    display: none;
  }
}
</style>
