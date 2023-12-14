<template>
  <div class="q-pa-md">
    <div class="q-gutter-md">

      <q-select :model-value="selectedBucket" @update:model-value="changeBucket" :options="mainStore.buckets.map((obj) => obj.name)" label="Bucket" />

      <q-field label="Application" stack-label borderless>
        <template v-slot:control>
          <q-btn-toggle
            style="width: 100%"
            :model-value="selectedApp" @update:model-value="changeApp"
            :spread="true"
            toggle-color="primary"
            :options="[
        {label: 'Files', value: 'files'},
        {label: 'Email', value: 'email'}
      ]"
          />
        </template>
      </q-field>

      <q-btn-dropdown color="green" label="New" icon="add" style="width: 100%">
        <q-list>
          <q-item clickable v-close-popup @click="$refs.createFolder.open()">
            <q-item-section>
              <q-item-label><q-icon name="create_new_folder" size="sm"/> New Folder</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator></q-separator>

          <q-item clickable v-close-popup @click="onItemClick">
            <q-item-section>
              <q-item-label><q-icon name="upload_file" size="sm"/> Upload Files</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="onItemClick">
            <q-item-section>
              <q-item-label><q-icon name="folder" size="sm"/> Upload Folders</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
  </div>

  <create-folder ref="createFolder" />
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "stores/main-store";
import FilePreview from "components/preview/FilePreview.vue";
import CreateFolder from "components/files/CreateFolder.vue";

export default defineComponent({
  name: 'LeftSidebar',
  components: { CreateFolder },
  methods: {
    changeBucket: function(bucket) {
      this.$router.push({ name: `${this.selectedApp}-home`, params: { bucket: bucket }})
    },
    changeApp: function(app) {
      this.$router.push({ name: `${app}-home`, params: { bucket: this.selectedBucket }})
    }
  },
  computed: {
    selectedBucket: function () {
      return this.$route.params.bucket
    },
    selectedApp: function () {
      return this.$route.name.split('-')[0]
    }
  },
  setup() {
    const mainStore = useMainStore();

    return {
      mainStore,
    };
  },
})
</script>
