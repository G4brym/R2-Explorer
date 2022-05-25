<template>
  <h5 class="mb-3" v-if="files">Files</h5>

  <div class="table-responsive">
    <table class="table table-centered table-nowrap mb-0">
      <thead class="table-light">
      <tr>
        <th class="border-0">Name</th>
        <th class="border-0">Last Modified</th>
        <th class="border-0">Size</th>
        <th class="border-0" style="width: 80px;">Action</th>
      </tr>
      </thead>
      <tbody>

      <tr v-for="file in files" :key="file.Key">
        <td>
          <i data-feather="folder" class="icon-dual"></i>
          <span class="ms-2 fw-semibold"><a href="javascript: void(0);" class="text-reset" v-text="file.name"></a></span>
        </td>
        <td v-text="file.LastModified.toString()">
        </td>
        <td>{{ file.Size }} Kb</td>
        <td>
          <div class="btn-group dropdown">
            <a href="javascript: void(0);" class="table-action-btn dropdown-toggle arrow-none btn btn-light btn-xs" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-three-dots-vertical"></i></a>
            <div class="dropdown-menu dropdown-menu-end">
              <a class="dropdown-item" href="#"><i class="mdi mdi-share-variant me-2 text-muted vertical-middle"></i>Share</a>
              <a class="dropdown-item" href="#"><i class="mdi mdi-link me-2 text-muted vertical-middle"></i>Get Sharable Link</a>
              <a class="dropdown-item" href="#"><i class="mdi mdi-pencil me-2 text-muted vertical-middle"></i>Rename</a>
              <a class="dropdown-item" href="#"><i class="mdi mdi-download me-2 text-muted vertical-middle"></i>Download</a>
              <a class="dropdown-item" href="#"><i class="mdi mdi-delete me-2 text-muted vertical-middle"></i>Remove</a>
            </div>
          </div>
        </td>
      </tr>

      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: ['files']
}
</script>
