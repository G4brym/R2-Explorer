<template>
  <div id="wrapper">
    <router-view />
  </div>
</template>

<script>
export default {
  async created () {
    await this.$store.dispatch('checkBasicAuthStorage')
    this.$store.dispatch('loadServerConfigs')
    this.$store.dispatch('loadUserDisks')
  }
}
</script>
