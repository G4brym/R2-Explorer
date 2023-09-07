<template>
  <div id="wrapper">
    <router-view />
  </div>
</template>

<script>
export default {
  created () {
    this.$store.dispatch('loadServerConfigs')
    this.$store.dispatch('loadUserDisks')
  }
}
</script>
