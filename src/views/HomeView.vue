<template>
  <!-- start page title -->
  <div class="row">
    <div class="col-12">
      <div class="page-title-box">
        <div class="page-title-right">

        </div>
        <h4 class="page-title">File Manager</h4>
      </div>
    </div>
  </div>
  <!-- end page title -->

  <div class="row">

    <!-- Right Sidebar -->
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <!-- Left sidebar -->
          <div class="inbox-leftbar">
            <div class="btn-group d-block mb-2">
              <button type="button" class="btn btn-success w-100 waves-effect waves-light dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="bi bi-plus-circle-fill"></i> New</button>
              <div class="dropdown-menu">
                <a class="dropdown-item pointer" @click="newFolder"><i class="bi bi-folder-fill me-1"></i> Folder</a>
                <a class="dropdown-item pointer" @click="$refs.uploader.openUploader()"><i class="bi bi-file-earmark-text-fill me-1"></i> File</a>
              </div>
            </div>
            <div class="mail-list mt-3">
              <template v-for="bucket in $store.state.buckets" :key="bucket.Name">
                <a :class="{'text-black': $store.state.activeBucket === bucket.Name}" @click="changeBucket(bucket)" class="list-group-item border-0" href="#"><i class="bi bi-bucket-fill me-2"></i>{{ bucket.Name }}</a>
              </template>
            </div>

            <div class="mt-5">
<!--              <h4><span class="badge rounded-pill p-1 px-2 badge-soft-secondary">FREE</span></h4>-->
              <h6 class="text-uppercase mt-3">Storage</h6>
              <div class="progress my-2 progress-sm">
                <div class="progress-bar progress-lg bg-success" role="progressbar" style="width: 46%" aria-valuenow="46" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <p class="text-muted font-12 mb-0">7.02 GB (46%) of 15 GB used</p>
            </div>

          </div>
          <!-- End Left sidebar -->

          <div class="inbox-rightbar">
            <drag-and-drop ref="uploader">
              <gallery v-if="$store.state.files && $store.state.folders"/>
            </drag-and-drop>
          </div>
          <!-- end inbox-rightbar-->

          <div class="clearfix"></div>
        </div>
      </div> <!-- end card -->

    </div> <!-- end Col -->
  </div><!-- End row -->
</template>

<script>
import Swal from 'sweetalert2'
import Gallery from '@/components/Gallery'
import DragAndDrop from '@/components/DragAndDrop'
export default {
  components: { DragAndDrop, Gallery },
  methods: {
    changeBucket (bucket) {
      this.$store.commit('changeBucket', bucket.Name)
    },
    newFolder () {
      const self = this

      Swal.fire({
        title: 'New folder',
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to write something!'
          }
        }
      }).then((data) => {
        if (data.isConfirmed === true) {
          const folderPath = self.$store.state.currentFolder + data.value + '/'

          console.log(folderPath)
          self.$store.state.s3.upload({ Bucket: self.$store.state.activeBucket, Key: folderPath, ContentLength: 0, Body: 'Folder placeholder' }).promise().then(
            function (data) {
              self.$toast.open({
                message: 'Folder created!',
                type: 'success'
              })
              self.$store.commit('refreshObjects')
              console.log('Successfully uploaded ', data)
            },
            function (err) {
              self.$toast.open({
                message: 'Something went wrong!',
                type: 'error'
              })
              console.log('There was an error creating your folder: ', err.message)
            }
          )
        }
      })
    }
  }
}
</script>
