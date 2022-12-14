<template>
  <div class="card h-100">
    <div class="card-body">
      <div class="btn-group d-block mb-2">
        <button
          type="button"
          class="btn btn-success w-100 waves-effect waves-light dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          :disabled="$store.state.config?.readonly === true"
        >
          <i class="bi bi-plus-circle-fill"></i> New
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item pointer" @click="$emit('newFolder')"><i class="bi bi-folder-fill me-1"></i> Folder</a>
          <a class="dropdown-item pointer" @click="$emit('openUploader')"
          ><i class="bi bi-file-earmark-text-fill me-1"></i> File</a
          >
        </div>
      </div>
      <div class="mail-list mt-3">
        <template v-for="bucket in $store.state.buckets" :key="bucket.Name">
          <router-link
            :class="{ 'text-black': $store.state.activeBucket === bucket.Name }"
            class="list-group-item border-0"
            :to="{ name: 'bucket-home', params: { bucket: bucket.Name }}"
          >
            <i class="bi bi-bucket-fill me-2"></i>{{ bucket.Name }}
          </router-link>
        </template>
      </div>
    </div>
  </div>
</template>
