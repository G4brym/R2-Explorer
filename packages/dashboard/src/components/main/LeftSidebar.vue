<template>
  <div class="q-pa-md" style="height: 100%">
    <div class="flex column" style="height: 100%">
      <q-btn color="green" icon="add" stack class="q-mb-lg" label="New">
        <q-menu>
          <q-list>
            <q-item clickable v-close-popup @click="$refs.createFile.open()">
              <q-item-section>
                <q-item-label>
                  <q-icon name="note_add" size="sm" />
                  New File
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="$refs.createFolder.open()">
              <q-item-section>
                <q-item-label>
                  <q-icon name="create_new_folder" size="sm" />
                  New Folder
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$bus.emit('openFilesUploader')">
              <q-item-section>
                <q-item-label>
                  <q-icon name="upload_file" size="sm" />
                  Upload Files
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="$bus.emit('openFoldersUploader')">
              <q-item-section>
                <q-item-label>
                  <q-icon name="folder" size="sm" />
                  Upload Folders
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <q-btn class="q-mb-sm" @click="gotoFiles" color="blue" icon="folder_copy" label="Files" stack />
      <q-btn class="q-mb-sm" @click="gotoEmail" color="blue" icon="email" label="Email" stack />

<!--      <q-btn class="q-mb-sm q-mt-auto q-mb-0" @click="settingsPopup=true" color="secondary" icon="settings" label="Server"-->
<!--             stack />-->
      <q-btn class="q-mb-sm q-mt-auto q-mb-0" @click="upgradePopup=true" color="secondary" icon="question_mark" label="Info"
             stack />
    </div>
  </div>

  <q-dialog v-model="upgradePopup" persistent no-esc-dismiss no-route-dismiss no-backdrop-dismiss>
    <q-card>
      <q-card-section>
        <div class="text-h6">🎉 Welcome to the new Dashboard v2! 🚀</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        We're thrilled to introduce our revamped interface, designed to enhance your experience and productivity. As you
        explore the new features and improvements, feel free to provide feedback or report any issues you encounter.
        Your input helps us fine-tune the dashboard to meet your needs better.<br>
        <br>
        To revisit this message in the future, simply click on the question mark icon located in the left corner. Your
        feedback is invaluable to us, so don't hesitate to reach out with any thoughts or concerns.<br>
        <br>
        Please report issues here: <a href="https://github.com/G4brym/R2-Explorer/issues" target="_blank">https://github.com/G4brym/R2-Explorer/issues</a><br>
        <br>
        If you would like to continue using the old Dashboard, please follow this <a
        href="https://r2explorer.dev/guides/continue-using-legacy-dashboard/" target="_blank">guide from the
        documentation</a><br>
        <br>
        Thank you for being a part of our journey towards excellence! 🌟<br>
        <br>
        Best regards<br>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="settingsPopup">
    <q-card>
      <q-card-section>
        <div class="text-h6">Your server configurations</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          filled
          disable
          v-if="mainStore.username"
          v-model="mainStore.username"
        />
        <q-input
          filled
          disable
          :model-value="mainStore.version"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <create-folder ref="createFolder" />
  <create-file ref="createFile" />
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "stores/main-store";
import CreateFolder from "components/files/CreateFolder.vue";
import CreateFile from "components/files/CreateFile.vue";

export default defineComponent({
  name: "LeftSidebar",
  data: function() {
    return {
      upgradePopup: false,
      settingsPopup: false
    };
  },
  components: { CreateFolder, CreateFile },
  methods: {
    gotoEmail: function() {
      if (this.selectedApp !== "email")
        this.changeApp("email");
    },
    gotoFiles: function() {
      if (this.selectedApp !== "files")
        this.changeApp("files");
    },
    changeApp: function(app) {
      this.$router.push({ name: `${app}-home`, params: { bucket: this.selectedBucket } });
    }
  },
  computed: {
    selectedBucket: function() {
      return this.$route.params.bucket;
    },
    selectedApp: function() {
      return this.$route.name.split("-")[0];
    }
  },
  mounted: function() {
    const alertSeen = localStorage.getItem("DASH_V2_ALERT");

    if (!alertSeen) {
      this.upgradePopup = true;
      localStorage.setItem("DASH_V2_ALERT", true);
    }
  },
  setup() {
    const mainStore = useMainStore();

    return {
      mainStore
    };
  }
});
</script>

<style scoped>
.q-btn {
  max-width: 100%;
  padding: 4px;
}
</style>
