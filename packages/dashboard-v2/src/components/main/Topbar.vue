<template>
  <q-btn dense flat round icon="menu" @click="$emit('toggleLeftDrawer')" />

  <q-toolbar-title class="text-bold">
    <q-avatar>
      <img src="/v2.0/logo-white.svg">
    </q-avatar>
    R2-Explorer
  </q-toolbar-title>
  <q-space />
  <div>
    <bucket-picker/>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import BucketPicker from "components/main/BucketPicker.vue";

export default defineComponent({
  name: "TopBar",
  components: { BucketPicker }
});
</script>
