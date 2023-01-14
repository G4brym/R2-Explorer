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
        <div class="dropdown-menu font-16">
          <a class="dropdown-item pointer" @click="$emit('newFolder')">
            <i class="bi bi-folder-plus me-1"></i> New Folder
          </a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item pointer" @click="$emit('openFilesUploader')">
            <i class="bi bi-file-earmark-arrow-up me-1"></i> Upload Files
          </a>
          <a class="dropdown-item pointer" @click="$emit('openFoldersUploader')">
            <i class="bi bi-folder2-open me-1"></i> Upload Folders
          </a>
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
