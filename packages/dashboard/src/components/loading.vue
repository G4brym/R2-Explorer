<template>
  <div v-if="$store.state.toastMessage" class="toast-loading">
    <div v-if="$store.state.toastSpin" class="spinner-border">
    </div>
    <i v-else class="bi bi-check-circle-fill me-1"></i>
    {{ $store.state.toastMessage }}
  </div>
</template>

<style scoped lang="scss">
.toast-loading {
  position: fixed;
  bottom: 2em;
  left: 2em;
  color: white;
  z-index: 10;
  background-color: #42BC9C;
  padding: 18px;
  border-radius: 5px;
  font-size: 16px;

  .spinner-border {
    width: 1rem;
    height: 1rem;
    border-width: 0.2em;
    margin-right: 0.3em;
  }
}
</style>
