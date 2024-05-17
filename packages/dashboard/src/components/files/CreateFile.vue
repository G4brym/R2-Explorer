<template>
  <q-dialog v-model="modal" @hide="cancel">
    <q-card style="min-width: 350px">
      <q-form
        @submit="onSubmit"
      >
        <q-card-section>
          <div class="text-h6">New File Name</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input dense v-model="newFileName" autofocus
                   lazy-rules
                   :rules="[ val => val && val.length > 0 || 'Please type something']" />
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
import { defineComponent } from "vue";
import { useMainStore } from "stores/main-store";
import { apiHandler, decode, encode, ROOT_FOLDER } from "src/appUtils";

export default defineComponent({
  name: "CreateFile",
  data: function() {
    return {
      modal: false,
      newFileName: "",
      loading: false
    };
  },
  methods: {
    cancel: function() {
      this.modal = false;
      this.newFileName = "";
      this.loading = false
    },
    onSubmit: async function() {
      this.loading = true

      const newFile = new Blob([''], {type: 'text/plain'});
      await apiHandler.uploadObjects(newFile, this.selectedFolder + this.newFileName, this.selectedBucket);

      this.$bus.emit("fetchFiles");

      // TODO: open the new file in preview and edit mode
      // await this.$router.push({
      //   name: "files-file",
      //   params: {
      //     bucket: this.$route.params.bucket,
      //     folder: this.$route.params.folder || ROOT_FOLDER,
      //     file: encode(this.newFileName)
      //   }
      // });

      this.loading = false
      this.modal = false;
      this.newFileName = "";
    },
    open: function() {
      this.modal = true;
    }
  },
  computed: {
    selectedBucket: function() {
      return this.$route.params.bucket;
    },
    selectedFolder: function() {
      if (this.$route.params.folder && this.$route.params.folder !== ROOT_FOLDER) {
        return decode(this.$route.params.folder);
      }
      return "";
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
