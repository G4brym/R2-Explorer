<template>
    <q-select :model-value="selectedBucket" @update:model-value="changeBucket" color="blue" stack-label :dense="true" filled bg-color="white"
              :options="mainStore.buckets.map((obj) => obj.name)" label="Bucket" style="min-width: 100px" />
<!--  <q-select filled :options="mainStore.buckets.map((obj) => obj.name)" label="Bucket" stack-label :dense="true" />-->

<!--  <q-field label="Select Bucket" stack-label label-color="white">-->
<!--    <template v-slot:control>-->
<!--      <q-btn-dropdown color="blue" :label="selectedBucket">-->
<!--        <q-list>-->
<!--          <q-item v-close-popup clickable @click="changeBucket(bucket.name)" v-for="bucket in mainStore.buckets" :key="bucket.name">-->
<!--            <q-item-section>-->
<!--              <q-item-label>{{bucket.name}}</q-item-label>-->
<!--            </q-item-section>-->
<!--          </q-item>-->
<!--        </q-list>-->
<!--      </q-btn-dropdown>-->
<!--    </template>-->
<!--  </q-field>-->
</template>

<script>
import { defineComponent } from "vue";
import { useMainStore } from "stores/main-store";

export default defineComponent({
  name: "BucketPicker",
  methods: {
    changeBucket: function(bucket) {
      this.$router.push({ name: `${this.selectedApp}-home`, params: { bucket: bucket } });
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
  setup() {
    const mainStore = useMainStore();

    return {
      mainStore
    };
  }
});
</script>
