<template>
  <q-page class="">
    <div class="">
      <q-infinite-scroll ref="infScroll" :disable="loadMoreAutomatically" @load="loadNextPage" :offset="250"
                         :debounce="100">
        <q-table
          ref="table"
          :rows="rows"
          :columns="columns"
          row-key="key"
          :loading="loading"
          :hide-pagination="true"
          :rows-per-page-options="[0]"
          :flat="true"
          table-class="notes-list"
          @row-click="rowClick">

          <template v-slot:loading>
            <div class="full-width q-my-lg">
              <h6 class="flex items-center justify-center">
                <q-spinner
                  color="primary"
                  size="xl"
                />
              </h6>
            </div>
          </template>

          <template v-slot:header>
            <tr class="q-mb-md">
              <th class="text-left">
                <q-btn color="green" icon="refresh" :loading="loading" @click="fetchNotes" class="q-mr-sm">
                  <template v-slot:loading>
                    <q-spinner
                      color="white"
                    />
                  </template>
                </q-btn>
                <q-btn v-if="!mainStore.apiReadonly" color="primary" icon="add" label="New Note" @click="$refs.createNote.open()" />
              </th>
            </tr>
          </template>

          <template v-slot:body-cell-title="prop">
            <q-td :props="prop" class="note-title">
              <div class="flex column">
                <div class="flex">
                  <div class="note-title-text">
                    {{ prop.value || 'Untitled' }}
                  </div>
                  <div class="note-last-modified mobile-preview">
                    {{ prop.row.lastModified }}
                  </div>
                </div>
                <div class="note-preview mobile-preview">
                  {{ prop.row.preview }}
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-preview="prop">
            <q-td :props="prop" class="note-preview-cell">
              {{ prop.value }}
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width q-my-lg" v-if="!loading">
              <h6 class="flex items-center justify-center">
                <q-icon name="sticky_note_2" color="orange" size="lg" />
                No notes yet
              </h6>
              <div class="flex items-center justify-center q-mt-md" v-if="!mainStore.apiReadonly">
                <q-btn color="primary" icon="add" label="Create your first note" @click="$refs.createNote.open()" />
              </div>
            </div>
          </template>
        </q-table>
        <template v-if="!hasMorePages && rows.length > 0">
          <div class="row justify-center q-my-md">
            <span>No more notes to load</span>
          </div>
        </template>
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
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
			await this.$refs.infScroll.setIndex(0);
			await this.$refs.infScroll.poll();

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

<style>
.notes-list table, .notes-list tbody, .notes-list thead {
  width: 100%;
  display: block;
}

.notes-list thead {
  th {
    border: 0;

    &:hover {
      border: 0;
    }
  }
}

.notes-list td {
  vertical-align: middle !important;

  @media (max-width: 992px) {
    &:not(.note-title) {
      display: none;
    }
  }
}

.notes-list tbody tr {
  display: flex;
  width: 100%;
  justify-content: center;

  &:hover {
    box-shadow: 0 2px 2px -2px gray;
    z-index: 10;
    cursor: pointer;
  }
}

.note-title {
  width: 250px;
  overflow-x: hidden;
  white-space: nowrap;
  flex-shrink: 0;
  text-overflow: ellipsis;

  .mobile-preview {
    display: none;
  }

  @media (max-width: 992px) {
    width: 100%;
    height: auto !important;

    .mobile-preview {
      display: block;
    }

    .note-title-text {
      font-size: 18px;
      font-weight: 500;
    }

    .note-last-modified {
      margin-right: 0;
      margin-left: auto;
      align-self: end;
    }

    .note-preview {
      font-size: 14px;
      max-width: 100%;
      color: #666;
    }
  }
}

.note-title-text {
  font-weight: 500;
}

.note-preview-cell {
  overflow-x: hidden;
  white-space: nowrap;
  flex-grow: 1;
  text-overflow: ellipsis;
  color: #666;
}
</style>
