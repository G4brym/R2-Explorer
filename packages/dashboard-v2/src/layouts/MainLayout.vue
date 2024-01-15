<template>
  <q-layout view="hHh LpR lFr">

    <q-header reveal class="bg-green text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="text-bold">
          <q-avatar>
            <img src="/v2.0/logo-white.svg">
          </q-avatar>
          R2-Explorer
        </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <left-sidebar/>
    </q-drawer>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
      <right-sidebar @updateDrawer="updateRightDrawer" />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script>
import { ref } from 'vue'
import { useMainStore } from "stores/main-store";
import LeftSidebar from "components/main/LeftSidebar.vue";
import RightSidebar from "components/main/RightSidebar.vue";

export default {
  name: 'MainLayout',
  components: { RightSidebar, LeftSidebar },
  created() {
    const mainStore = useMainStore()
    mainStore.loadUserDisks().then((buckets) => {
      if (this.$route.path === '/') {
        this.$router.push({ name: `files-home`, params: { bucket: buckets[0].name }})
      }
    });
  },
  setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    return {
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },

      rightDrawerOpen,
      updateRightDrawer (state) {
        rightDrawerOpen.value = state
      }
    }
  },
  mounted() {
    this.updateRightDrawer(false)
  }
}
</script>
