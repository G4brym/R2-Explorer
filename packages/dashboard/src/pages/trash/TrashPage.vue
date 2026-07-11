<template>
  <q-page class="">
    <div class="q-pa-md" ref="pageContainer" @scroll="handleScroll" style="height: 100vh; overflow-y: auto;">
      <div class="flex items-center q-mb-sm">
        <q-breadcrumbs class="col">
          <q-breadcrumbs-el :label="selectedBucket" />
          <q-breadcrumbs-el label="Trash" />
        </q-breadcrumbs>

        <q-btn
          flat
          dense
          icon="delete_forever"
          color="red"
          label="Empty trash"
          @click="confirmEmptyTrash"
        />
      </div>

      <q-table
        ref="table"
        :rows="rows"
        :columns="columns"
        row-key="trashKey"
        :loading="loading"
        :hide-pagination="true"
        :rows-per-page-options="[0]"
        column-sort-order="da"
        :flat="true"
        table-class="file-list"
      >

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

        <template v-slot:no-data>
          <div class="full-width q-my-lg" v-if="!loading">
            <h6 class="flex items-center justify-center"><q-icon name="delete_outline" color="grey" size="lg" />Trash is empty</h6>
          </div>
        </template>

        <template v-slot:body-cell-originalKey="prop">
          <td class="flex" style="align-items: center">
            <q-icon name="article" size="sm" color="grey" class="q-mr-xs" />
            {{prop.row.originalKey}}
          </td>
        </template>

          <template v-slot:body-cell-options="prop">
            <td class="text-right">
              <q-btn round flat icon="restore_from_trash" size="sm" color="primary" aria-label="Restore" @click="restoreObject(prop.row)">
                <q-tooltip>Restore</q-tooltip>
              </q-btn>
              <q-btn round flat icon="delete_forever" size="sm" color="red" aria-label="Delete forever" @click="deleteForever(prop.row)">
                <q-tooltip>Delete forever</q-tooltip>
              </q-btn>
            </td>
          </template>
      </q-table>

      <div v-if="loadingMore" class="q-pa-md text-center">
        <q-spinner color="primary" size="md" />
        <div class="q-mt-sm text-grey">Loading more files...</div>
      </div>

      <div v-if="!hasMore && rows.length > 0 && !loading" class="q-pa-md text-center text-grey">
        No more files to load
      </div>

    </div>
  </q-page>
</template>

<script>
import { useQuasar } from "quasar";
import { defineComponent } from "vue";
import { apiHandler, bytesToSize, timeSince } from "../../appUtils";

export default defineComponent({
	name: "TrashPage",
	data: () => ({
		loading: false,
		loadingMore: false,
		rows: [],
		cursor: null,
		hasMore: true,
		columns: [
			{
				name: "originalKey",
				required: true,
				label: "Original path",
				align: "left",
				field: "originalKey",
				sortable: true,
			},
			{
				name: "deletedAt",
				required: true,
				label: "Deleted",
				align: "left",
				field: "deletedAt",
				sortable: true,
				sort: (a, b, rowA, rowB) => {
					return rowA.deletedAtTimestamp - rowB.deletedAtTimestamp;
				},
			},
			{
				name: "deletedBy",
				required: true,
				label: "Deleted by",
				align: "left",
				field: "deletedBy",
				sortable: true,
			},
			{
				name: "size",
				required: true,
				label: "Size",
				align: "left",
				field: "size",
				sortable: true,
				sort: (a, b, rowA, rowB) => {
					return rowA.sizeRaw - rowB.sizeRaw;
				},
			},
			{
				name: "options",
				label: "",
				sortable: false,
			},
		],
	}),
	computed: {
		selectedBucket: function () {
			return this.$route.params.bucket;
		},
	},
	methods: {
		mapTrashObject(obj) {
			const date = new Date(obj.deletedAt);
			return {
				...obj,
				deletedAt: timeSince(date),
				deletedAtTimestamp: obj.deletedAt,
				size: bytesToSize(obj.size),
			};
		},
		resetAndFetchTrash: async function () {
			this.rows = [];
			this.cursor = null;
			this.hasMore = true;
			await this.fetchTrash();
		},
		fetchTrash: async function () {
			if (this.loading || this.loadingMore || !this.hasMore) {
				return;
			}

			this.loading = true;

			const response = await apiHandler.listTrash(
				this.selectedBucket,
				this.cursor,
			);

			this.rows = response.data.objects.map((obj) => this.mapTrashObject(obj));
			this.cursor = response.data.cursor;
			this.hasMore = response.data.truncated;
			this.loading = false;
		},
		loadMoreTrash: async function () {
			if (this.loadingMore || !this.hasMore || this.loading) {
				return;
			}

			this.loadingMore = true;

			const response = await apiHandler.listTrash(
				this.selectedBucket,
				this.cursor,
			);

			this.rows = [
				...this.rows,
				...response.data.objects.map((obj) => this.mapTrashObject(obj)),
			];
			this.cursor = response.data.cursor;
			this.hasMore = response.data.truncated;
			this.loadingMore = false;
		},
		handleScroll: function (event) {
			const container = this.$refs.pageContainer;
			if (!container || this.loadingMore || !this.hasMore) {
				return;
			}

			const scrollTop = container.scrollTop;
			const scrollHeight = container.scrollHeight;
			const clientHeight = container.clientHeight;

			if (scrollTop + clientHeight >= scrollHeight - 200) {
				this.loadMoreTrash();
			}
		},
		restoreObject: async function (row) {
			await apiHandler.restoreTrash(this.selectedBucket, row.trashKey);
			this.q.notify({
				group: false,
				icon: "restore_from_trash",
				message: "File restored!",
				timeout: 2500,
			});
			this.resetAndFetchTrash();
		},
		deleteForever: async function (row) {
			this.q
				.dialog({
					title: "Delete forever?",
					message: `This will permanently delete <code>${row.originalKey}</code>. You cannot undo this action.`,
					html: true,
					cancel: true,
					persistent: true,
				})
				.onOk(async () => {
					await apiHandler.purgeTrash(this.selectedBucket, row.trashKey);
					this.q.notify({
						group: false,
						icon: "delete_forever",
						message: "File permanently deleted!",
						timeout: 2500,
					});
					this.resetAndFetchTrash();
				});
		},
		confirmEmptyTrash: async function () {
			this.q
				.dialog({
					title: "Empty trash?",
					message:
						"All items in the trash will be permanently deleted. This cannot be undone.",
					cancel: true,
					persistent: true,
				})
				.onOk(async () => {
					await apiHandler.purgeTrash(this.selectedBucket);
					this.q.notify({
						group: false,
						icon: "delete_forever",
						message: "Trash emptied!",
						timeout: 2500,
					});
					this.resetAndFetchTrash();
				});
		},
	},
	created() {
		this.resetAndFetchTrash();
	},
	setup() {
		return {
			q: useQuasar(),
		};
	},
});
</script>

<style>
.file-list table , .file-list tbody , .file-list thead {
  width: 100%;
  display: block;
}


.file-list td:first-of-type, .file-list th:first-of-type {
  overflow-x: hidden;
  white-space: nowrap;
  flex-grow: 1;
  text-overflow: ellipsis;
}

.file-list tr {
  display: flex;
  width: 100%;
  justify-content: center;

}
</style>
