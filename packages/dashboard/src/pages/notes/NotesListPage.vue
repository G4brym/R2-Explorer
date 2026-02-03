<template>
  <q-page class="notes-page">
    <div class="notes-page-container">
      <!-- Header -->
      <div class="notes-header">
        <div>
          <h1 class="text-h4 text-weight-bold q-mb-xs">Notes</h1>
          <p class="text-body2 text-grey-7">Create and manage your markdown notes</p>
        </div>
        <div class="notes-header-actions">
          <q-btn flat round dense icon="refresh" :loading="loading" @click="fetchNotes" class="q-mr-sm">
            <q-tooltip>Refresh</q-tooltip>
          </q-btn>
          <q-btn v-if="!mainStore.apiReadonly" unelevated color="primary" icon="add" label="New Note" @click="$refs.createNote.open()" />
        </div>
      </div>

      <!-- Notes List -->
      <q-infinite-scroll ref="infScroll" :disable="loadMoreAutomatically" @load="loadNextPage" :offset="250"
                         :debounce="100">
        <!-- Loading State -->
        <div v-if="loading && rows.length === 0" class="notes-loading">
          <q-spinner color="primary" size="xl" />
          <div class="q-mt-md text-grey-7">Loading notes...</div>
        </div>

        <div v-else class="notes-grid">

          <!-- Note Cards -->
          <div v-for="note in rows" :key="note.key"
               class="note-card"
               @click="rowClick($event, note)">
            <div class="note-card-header">
              <q-icon name="sticky_note_2" color="primary" size="20px" />
              <span class="note-card-date">{{ note.lastModified }}</span>
            </div>
            <h3 class="note-card-title">{{ note.title || 'Untitled' }}</h3>
            <p class="note-card-preview">{{ note.preview || 'No content yet...' }}</p>
            <div class="note-card-footer">
              <q-icon name="description" size="16px" class="text-grey-5" />
              <span class="text-caption text-grey-6">Markdown note</span>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="rows.length === 0 && !loading" class="notes-empty-state">
            <div class="empty-state-icon">
              <q-icon name="note_add" size="80px" color="grey-4" />
            </div>
            <h3 class="text-h5 text-weight-medium q-mt-md q-mb-sm">No notes yet</h3>
            <p class="text-body2 text-grey-7 q-mb-lg">
              Start capturing your thoughts and ideas with markdown notes.<br/>
              Format text, add lists, embed code, and more.
            </p>
            <q-btn v-if="!mainStore.apiReadonly" unelevated color="primary" icon="add" label="Create your first note" @click="$refs.createNote.open()" />
          </div>
        </div>
        <template v-slot:loading>
          <div class="notes-loading-more">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>

      <div v-if="!hasMorePages && rows.length > 0" class="notes-end-message">
        <q-icon name="check_circle" size="20px" class="text-grey-5" />
        <span class="text-grey-6 q-ml-sm">You've reached the end</span>
      </div>
    </div>

    <create-note ref="createNote" @created="onNoteCreated" />
  </q-page>
</template>

<script>
import CreateNote from "components/notes/CreateNote.vue";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";
import { apiHandler, encode, timeSince } from "../../appUtils";

const NOTES_PREFIX = ".r2-explorer/notes/";

export default defineComponent({
	name: "NotesListPage",
	components: { CreateNote },
	data: () => ({
		loading: false,
		loadMoreAutomatically: true,
		hasMorePages: true,
		cursor: null,
		rows: [],
		columns: [
			{
				name: "title",
				required: true,
				field: "title",
				label: "Title",
				align: "left",
				sortable: false,
			},
			{
				name: "preview",
				required: true,
				field: "preview",
				label: "Preview",
				align: "left",
				sortable: false,
			},
			{
				name: "lastModified",
				required: true,
				align: "left",
				field: "lastModified",
				label: "Modified",
				sortable: false,
			},
		],
	}),
	computed: {
		selectedBucket: function () {
			return this.$route.params.bucket;
		},
	},
	watch: {
		selectedBucket(newVal) {
			this.fetchNotes();
		},
	},
	methods: {
		rowClick: function (evt, row, index) {
			const filename = row.key.replace(NOTES_PREFIX, "");
			this.$router.push({
				name: "notes-note",
				params: {
					bucket: this.selectedBucket,
					note: encode(filename),
				},
			});
		},
		onNoteCreated: function (noteKey) {
			const filename = noteKey.replace(NOTES_PREFIX, "");
			this.$router.push({
				name: "notes-note",
				params: {
					bucket: this.selectedBucket,
					note: encode(filename),
				},
			});
		},
		loadNextPage: async function (index, done) {
			if (!this.cursor && index > 0) {
				this.loadMoreAutomatically = true;
				this.hasMorePages = false;
				done();
				return;
			}

			await this.loadPage();
			done();
		},
		fetchNotes: async function () {
			this.loading = true;
			this.rows = [];
			this.cursor = null;
			this.hasMorePages = true;

			await this.loadPage();

			// Check if infScroll ref exists before calling methods
			if (this.$refs.infScroll) {
				await this.$refs.infScroll.setIndex(0);
				await this.$refs.infScroll.poll();
			}

			this.loadMoreAutomatically = false;
			this.loading = false;
		},
		loadPage: async function () {
			const response = await apiHandler.listObjects(
				this.selectedBucket,
				NOTES_PREFIX,
				"/",
				this.cursor,
			);

			this.cursor = response.data.truncated ? response.data.cursor : null;

			if (response.data.objects) {
				const notes = response.data.objects
					.filter((obj) => {
						return !obj.key.endsWith("/") && obj.key !== NOTES_PREFIX;
					})
					.map((obj) => {
						const updatedAt = obj.customMetadata?.updatedAt
							? Number.parseInt(obj.customMetadata.updatedAt)
							: new Date(obj.uploaded).getTime();
						const date = new Date(updatedAt);

						return {
							...obj,
							title: obj.customMetadata?.title || "Untitled",
							preview: obj.customMetadata?.preview || "",
							lastModified: timeSince(date),
							timestamp: updatedAt,
						};
					})
					.sort((a, b) => b.timestamp - a.timestamp);

				for (const note of notes) {
					this.rows.push(note);
				}
			}

			if (!response.data.truncated) {
				this.hasMorePages = false;
				this.loadMoreAutomatically = true;
			}
		},
	},
	created() {
		this.fetchNotes();
		this.$bus.on("fetchNotes", this.fetchNotes);
	},
	unmounted() {
		this.$bus.off("fetchNotes", this.fetchNotes);
	},
	setup() {
		return {
			mainStore: useMainStore(),
		};
	},
});
</script>

<style scoped>
.notes-page {
  background: #fafafa;
  min-height: 100vh;
}

.notes-page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.notes-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notes-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.note-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.note-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #22c55e;
  transform: translateY(-2px);
}

.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.note-card-date {
  font-size: 12px;
  color: #9ca3af;
}

.note-card-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-card-preview {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 40px;
}

.note-card-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.notes-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  text-align: center;
  background: white;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  padding: 48px;
}

.empty-state-icon {
  width: 120px;
  height: 120px;
  background: #f9fafb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.notes-loading-more {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.notes-end-message {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .notes-page-container {
    padding: 16px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }

  .notes-header {
    flex-direction: column;
    gap: 16px;
  }

  .notes-header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
