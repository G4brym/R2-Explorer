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
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "stores/main-store";

export default defineComponent({
  name: 'LeftSidebar',
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
