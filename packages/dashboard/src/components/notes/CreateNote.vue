<template>
  <q-dialog v-model="modal" @hide="cancel">
    <q-card style="min-width: 350px">
      <q-form @submit="onSubmit">
        <q-card-section>
          <div class="text-h6">New Note</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            dense
            v-model="noteTitle"
            label="Title (optional)"
            autofocus
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Create" type="submit" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { apiHandler } from "src/appUtils";
import { useMainStore } from "stores/main-store";
import { defineComponent } from "vue";

const NOTES_PREFIX = ".r2-explorer/notes/";

function generateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export default defineComponent({
	name: "CreateNote",
	emits: ["created"],
	data: () => ({
		modal: false,
		noteTitle: "",
		loading: false,
	}),
	methods: {
		cancel: function () {
			this.modal = false;
			this.noteTitle = "";
			this.loading = false;
		},
		onSubmit: async function () {
			this.loading = true;

			try {
				const now = Date.now();
				const uuid = generateUUID().substring(0, 8);
				const filename = `${now}-${uuid}.json`;
				const noteKey = NOTES_PREFIX + filename;

				const noteData = {
					version: 1,
					title: this.noteTitle || "Untitled",
					content: "",
					createdAt: now,
					updatedAt: now,
				};

				const blob = new Blob([JSON.stringify(noteData)], {
					type: "application/json",
				});

				await apiHandler.uploadObjects(blob, noteKey, this.selectedBucket);

				const customMetadata = {
					title: noteData.title,
					preview: "",
					createdAt: String(now),
					updatedAt: String(now),
				};

				await apiHandler.updateMetadata(
					this.selectedBucket,
					noteKey,
					customMetadata,
				);

				this.$emit("created", noteKey);
				this.modal = false;
				this.noteTitle = "";
			} catch (error) {
				console.error("Error creating note:", error);
				this.$q.notify({
					type: "negative",
					message: "Failed to create note",
				});
			} finally {
				this.loading = false;
			}
		},
		open: function () {
			this.modal = true;
		},
	},
	computed: {
		selectedBucket: function () {
			return this.$route.params.bucket;
		},
	},
	setup() {
		const mainStore = useMainStore();

		return {
			mainStore,
		};
	},
});
</script>
