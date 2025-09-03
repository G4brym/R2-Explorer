<template>
  <q-btn dense flat round icon="menu" @click="$emit('toggle')" />

  <q-toolbar-title style="overflow: unset" class="text-bold">
    <q-avatar>
      <img src="/logo-white.svg">
    </q-avatar>
    Explorer
  </q-toolbar-title>
  <q-space />
  <div v-if="mainStore.buckets.length > 1">
    <bucket-picker/>
  </div>
  
  <!-- Logout button for authenticated users -->
  <q-btn 
    flat 
    round 
    icon="logout" 
    @click="logout"
    class="q-ml-sm"
  >
    <q-tooltip>Logout</q-tooltip>
  </q-btn>
</template>

<script>
import BucketPicker from "components/main/BucketPicker.vue";
import { useMainStore } from "stores/main-store";
import { useAuthStore } from "stores/auth-store";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
	name: "TopBar",
	emits: ["toggle"],
	components: { BucketPicker },
	setup() {
		const mainStore = useMainStore();
		const authStore = useAuthStore();
		const router = useRouter();

		const logout = async () => {
			await authStore.LogOut(router);
		};

		return { 
			mainStore,
			logout
		};
	},
});
</script>
