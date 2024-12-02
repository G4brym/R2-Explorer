<template>
  <q-btn dense flat round icon="menu" @click="$emit('toggle')" />

  <q-toolbar-title style="overflow: unset" class="text-bold">
    <q-avatar>
      <img src="/logo-white.svg">
    </q-avatar>
    R2-Explorer
  </q-toolbar-title>
  <q-space />
  <div>
    <bucket-picker/>
  </div>
</template>

<script>
import BucketPicker from "components/main/BucketPicker.vue";
import { defineComponent } from "vue";

export default defineComponent({
	name: "TopBar",
	emits: ["toggle"],
	components: { BucketPicker },
});
</script>
