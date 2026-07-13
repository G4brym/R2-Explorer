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
		editorMode: "edit",
		createDialog: false,
		newNoteName: "",
		createError: "",
	}),
	computed: {
		selectedBucket() {
			return this.$route.params.bucket;
		},
		selectedName() {
			if (!this.$route.params.file) {
				return null;
			}
			return decode(this.$route.params.file);
		},
		isDirty() {
			return this.content !== this.savedContent;
		},
		renderedContent() {
			return DOMPurify.sanitize(marked.parse(this.content));
		},
	},
	watch: {
		selectedBucket() {
			this.fetchNotes();
		},
		selectedName() {
			this.loadNote();
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
			this.loading = true;
			try {
				const files = await apiHandler.fetchFile(
					this.selectedBucket,
					NOTES_PREFIX,
					"/",
				);
				this.notes = files
					.filter((obj) => obj.type === "file")
					.sort((a, b) => b.timestamp - a.timestamp);
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
		async loadNote() {
			if (!this.selectedName) {
				this.content = "";
				this.savedContent = "";
				return;
			}

			this.loadingContent = true;
			this.editorMode = "edit";
			try {
				const response = await apiHandler.downloadFile(
					this.selectedBucket,
					this.noteKey(this.selectedName),
					{ downloadType: "blob" },
				);
				const text = new TextDecoder().decode(response.data);
				this.content = text;
				this.savedContent = text;
			} catch (e) {
				this.q.notify({
					type: "negative",
					message: `Unable to open note: ${e.message}`,
				});
			} finally {
				this.loadingContent = false;
			}
		},
		async saveNote() {
			if (!this.selectedName || this.saving) {
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
			this.newNoteName = "";
			this.createError = "";
			this.createDialog = true;
		},
		async createNote() {
			const name = this.newNoteName.trim();
			if (!name) {
				this.createError = "Name is required";
				return;
			}
			if (name.includes("/")) {
				this.createError = "Name cannot contain /";
				return;
			}

			const filename = name.endsWith(".md") ? name : `${name}.md`;
			if (this.notes.some((obj) => obj.name === filename)) {
				this.createError = "A note with this name already exists";
				return;
			}

			this.creating = true;
			try {
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
			this.q
				.dialog({
					title: "Delete note",
					message: `Are you sure you want to delete "${this.noteTitle(this.selectedName)}"?`,
					cancel: true,
				})
				.onOk(async () => {
					try {
						await apiHandler.deleteObject(
							this.noteKey(this.selectedName),
							this.selectedBucket,
						);
						this.content = "";
						this.savedContent = "";
						await this.fetchNotes();
						this.$router.push({
							name: "notes-home",
							params: { bucket: this.selectedBucket },
						});
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
	created() {
		this.fetchNotes();
		if (this.selectedName) {
			this.loadNote();
		}
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
