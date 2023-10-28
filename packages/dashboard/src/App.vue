<template>
  <div id="wrapper">
    <template v-if="$route.href?.startsWith('/auth')">
      <router-view />
    </template>

    <base-layout v-else>
      <router-view />
    </base-layout>
  </div>
</template>

<script>
import BaseLayout from "@/components/base/BaseLayout.vue";

export default {
  components: { BaseLayout },
  async created() {
    await this.$store.dispatch("checkBasicAuthStorage");
    this.$store.dispatch("fetchServerConfigs");
    this.$store.dispatch("loadUserDisks");
  }
};
</script>
