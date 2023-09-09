<template>
  <div class="btn-group">
    <button class="btn btn-sm btn-light waves-effect" @click="$store.dispatch('refreshObjects')">
      <i class="bi bi-arrow-clockwise"></i>
    </button>
  </div>

  <div class="table-files">
    <table class="table table-centered mb-0 d-block w-100">
      <tbody class="d-flex flex-column">
      <template v-if="$store.state.files.length > 0">
        <tr class="pointer email-row" v-for="file in $store.state.files" :key="file.key"
            :class="{'unread': file.customMetadata.read !== 'true', 'read': file.customMetadata.read === 'true'}"
            @click="$router.push({name: 'email-file', params: {bucket: this.$route.params.bucket, folder: 'inbox',
          file: file.hash}})"
        >
          <td class="col-name col-sender">
            <span class="ms-sm-2 sender">{{
                file.customMetadata.from_name || file.customMetadata.from_address
              }}</span>

            <span class="mobile-subject">{{ file.customMetadata.subject }}</span>
          </td>
          <td class="col-subject">
            <span class="ms-2">{{ file.customMetadata.subject }}</span>
          </td>
          <td class="col-time">
            <i class="bi bi-paperclip" v-if="file.customMetadata.has_attachments === 'true'"></i>
            {{ getEmailDate(file.uploaded) }}
          </td>
        </tr>
      </template>

      <template v-else>
        <tr>
          <td colspan="100%">
            <div class="text-center">
              <p class="fs-3">This bucket don't have any emails yet!</p>
              <p class="fs-5">Learn how to setup the Email Explorer in the official documentation</p>
              <a target="_blank" href="https://r2explorer.dev/guides/setup-email-explorer/" class="fs-5">https://r2explorer.dev</a>
            </div>
          </td>
        </tr>
      </template>
      </tbody>
    </table>
  </div>

  <!--        <div class="row mt-3">-->
  <!--          <div class="col-7 mt-1">-->
  <!--            Showing 1 - 20 of 289-->
  <!--          </div> &lt;!&ndash; end col&ndash;&gt;-->
  <!--          <div class="col-5">-->
  <!--            <div class="btn-group float-end">-->
  <!--              <button type="button" class="btn btn-light btn-sm"><i class="bi bi-chevron-left"></i></button>-->
  <!--              <button type="button" class="btn btn-info btn-sm"><i class="bi bi-chevron-right"></i></button>-->
  <!--            </div>-->
  <!--          </div> &lt;!&ndash; end col&ndash;&gt;-->
  <!--        </div>-->
  <!-- end row-->
</template>
<script>
import utils from "@/utils";

export default {
  methods: {
    timeAgo(time) {
      return utils.timeSince(new Date(time));
    },
    getEmailDate(time) {
      const date = new Date(time);

      const mm = date.getMonth() + 1; // getMonth() is zero-based
      const dd = date.getDate();

      return `${dd}/${(mm > 9 ? "" : "0") + mm}`;
    }
  },
  created() {
    this.$watch(
      () => this.$route.params.folder,
      (newFolder) => {
        if (this.$store.state.activeTab === "email") {
          this.$store.dispatch("refreshObjects");
        }
      }
    );
  }
};
</script>

<style lang="scss" scoped>
.read {
  //font-weight: 600;
  background-color: #f3f7f9;
  z-index: 0
}
.unread {
  font-weight: 600;
  color: black;
}

.col-sender {
  width: 200px;
  overflow-x: hidden;
  white-space: nowrap;
  flex-shrink: 0;
  text-overflow: ellipsis;

  .mobile-subject {
    display: none;
  }
}

.col-subject {
  overflow-x: hidden;
  white-space: nowrap;
  //width: 100%;
  flex-grow: 1;
  text-overflow: ellipsis;
}

.col-time {
  //width: 100px;
  //text-align: end;
}

.email-row {
  display: flex;
  width: 100%;

  &:hover {
    box-shadow: 0 2px 2px -2px gray;
    z-index: 10
  }
}

@media (max-width: 992px) {
  .table-files {
    margin: 0 -1.5rem
  }

  .email-row {
    //flex-direction: column;
  }

  .col-sender {
    flex-grow: 1;
    margin: 0;

    .sender {
      font-size: 16px;
    }

    .mobile-subject {
      display: block;
    }
  }

  .col-subject {
    display: none;
  }
}

</style>
