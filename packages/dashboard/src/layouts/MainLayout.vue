<template>
  <q-layout view="hHh LpR lFr">

    <q-header reveal class="bg-green text-white">
      <q-toolbar>

        <top-bar @toggle="toggleLeftDrawer"/>

      </q-toolbar>
    </q-header>

    <q-drawer :width="240" show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <left-sidebar/>
    </q-drawer>

    <q-drawer :width="350" show-if-above v-model="rightDrawerOpen" side="right" bordered>
      <file-details-sidebar />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script>
import LeftSidebar from "components/main/LeftSidebar.vue";
import FileDetailsSidebar from "components/files/FileDetailsSidebar.vue";
import TopBar from "components/main/Topbar.vue";
import { ref } from "vue";

export default {
	name: "MainLayout",
	components: { TopBar, FileDetailsSidebar, LeftSidebar },
	setup() {
		const leftDrawerOpen = ref(false);
		const rightDrawerOpen = ref(false);

		return {
			leftDrawerOpen,
			toggleLeftDrawer() {
				leftDrawerOpen.value = !leftDrawerOpen.value;
			},

			rightDrawerOpen,
			updateRightDrawer(state) {
				rightDrawerOpen.value = state;
			},
		};
	},
	mounted() {
		// Listen for file details events
		this.$bus.on('openFileDetails', () => {
			this.rightDrawerOpen = true;
		});

		// Close right drawer when route changes to email or notes
		this.$watch('$route', (to) => {
			if (to.name && (to.name.startsWith('email') || to.name.startsWith('notes'))) {
				this.rightDrawerOpen = false;
			}
		});
	},
	beforeUnmount() {
		this.$bus.off('openFileDetails');
	},
};
</script>
