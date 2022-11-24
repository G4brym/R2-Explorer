<template>
  <div v-if="show" class="modal-mask" @click="handleBackdropClick">
    <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <slot name="header">
            <h5 class="modal-title">
              <slot name="header-title">Title</slot>
            </h5>
            <button type="button" class="btn-close" @click="$emit('close')">
              <span aria-hidden="true"></span>
            </button>
          </slot>
        </div>
        <div class="modal-body">
          <slot name="body">default body</slot>
        </div>
        <div class="modal-footer">
          <slot name="footer-buttons"></slot>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    show: Boolean
  },
  methods: {
    handleBackdropClick (event) {
      if (event.target.classList.contains('modal-mask')) {
        this.$emit('close')
      }
    }
  }
}
</script>

<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
