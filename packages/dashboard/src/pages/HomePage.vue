<template>
  <q-page class="flex flex-center">
    <q-inner-loading
      :showing="true"
      label="Loading..."
    />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { useMainStore } from "stores/main-store";

export default defineComponent({
  name: 'HomePage',
  setup () {
    return {
      mainStore: useMainStore()
    }
  },
})
</script>
