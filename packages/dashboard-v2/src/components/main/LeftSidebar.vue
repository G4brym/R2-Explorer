<template>
  <div class="q-pa-md">
    <div class="flex column">
      <q-btn color="green" icon="add" stack class="q-mb-lg" label="New">
        <q-menu>
          <q-list>
            <q-item clickable v-close-popup @click="$refs.createFolder.open()">
              <q-item-section>
                <q-item-label><q-icon name="create_new_folder" size="sm"/> New Folder</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$bus.emit('openFilesUploader')">
              <q-item-section>
                <q-item-label><q-icon name="upload_file" size="sm"/> Upload Files</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$bus.emit('openFoldersUploader')">
              <q-item-section>
                <q-item-label><q-icon name="folder" size="sm"/> Upload Folders</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <q-btn class="q-mb-sm" @click="gotoFiles" color="blue" icon="folder_copy" label="Files" stack />
      <q-btn class="q-mb-sm" @click="gotoEmail" color="blue" icon="email" label="Email" stack />
    </div>
  </div>

  <create-folder ref="createFolder" />
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "stores/main-store";
import CreateFolder from "components/files/CreateFolder.vue";

export default defineComponent({
  name: 'LeftSidebar',
  components: { CreateFolder },
  methods: {
    gotoEmail: function() {
      if(this.selectedApp !== 'email')
        this.changeApp('email')
    },
    gotoFiles: function() {
      if(this.selectedApp !== 'files')
        this.changeApp('files')
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

<style scoped>
.q-btn {
  max-width: 100%;
}
</style>
