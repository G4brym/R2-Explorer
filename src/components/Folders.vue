<template>
  <h5 class="mb-2" v-if="folders">Folders</h5>

  <div class="row mx-n1 g-0">

    <div class="col-xl-3 col-lg-6" v-for="folder in folders" :key="folder.Prefix">
      <div class="card m-1 shadow-none border folder" @click="$emit('navigate', folder.Prefix)">
        <div class="p-2">
          <div class="row align-items-center">
            <div class="col-auto pe-0">
              <div class="avatar-sm">
                <span class="avatar-title text-secondary rounded">
                    <i class="bi bi-folder-fill font-24 text-warning"></i>
                </span>
              </div>
            </div>
            <div class="col">
              <a class="fw-bold" v-text="folder.Prefix"></a>
            </div>
          </div> <!-- end row -->
        </div> <!-- end .p-2-->
      </div> <!-- end col -->
    </div> <!-- end col-->

  </div> <!-- end row-->
</template>

<script>
export default {
  props: ['folders'],
  emits: ['navigate']
}
</script>
