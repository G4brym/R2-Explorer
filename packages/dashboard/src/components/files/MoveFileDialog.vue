<template>
  <q-dialog v-model="show" @hide="handleClose">
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Move {{ isMultiple ? 'Items' : 'Item' }}</div>
      </q-card-section>
      
      <q-card-section>
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">
            {{ isMultiple ? `Moving ${items.length} items` : `Moving: ${itemName}` }}
          </div>
        </div>
        
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Select destination folder:</div>
          
          <!-- Current location breadcrumb -->
          <div class="q-mb-sm text-caption text-grey-6">
            Current location: {{ currentPath || '/' }}
          </div>
          
          <!-- Folder tree navigation -->
          <div class="folder-tree-container" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <!-- Root folder -->
            <q-item 
              clickable 
              v-ripple
              :class="{ 'bg-primary text-white': selectedFolder === '' }"
              @click="selectedFolder = ''"
            >
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Root ({{ bucket }})</q-item-label>
              </q-item-section>
            </q-item>
            
            <!-- User's health group folder (if not admin) -->
            <q-item 
              v-if="userHealthGroup && userHealthGroup !== 'admin'"
              clickable 
              v-ripple
              :class="{ 'bg-primary text-white': selectedFolder === userHealthGroup }"
              @click="selectedFolder = userHealthGroup"
              style="padding-left: 24px"
            >
              <q-item-section avatar>
                <q-icon name="folder" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ userHealthGroup }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <!-- Category folders -->
            <q-item 
              v-for="category in categoryFolders"
              :key="category"
              clickable 
              v-ripple
              :class="{ 'bg-primary text-white': selectedFolder === getFullPath(category) }"
              @click="selectedFolder = getFullPath(category)"
              :style="{ paddingLeft: userHealthGroup ? '48px' : '24px' }"
            >
              <q-item-section avatar>
                <q-icon name="folder" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ category }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <!-- Loading indicator -->
            <div v-if="loadingFolders" class="q-pa-md text-center">
              <q-spinner color="primary" size="30px" />
            </div>
            
            <!-- Custom folders from API -->
            <q-item 
              v-for="folder in availableFolders"
              :key="folder.path"
              clickable 
              v-ripple
              :class="{ 'bg-primary text-white': selectedFolder === folder.path }"
              @click="selectedFolder = folder.path"
              :style="{ paddingLeft: `${(folder.depth + 1) * 24}px` }"
            >
              <q-item-section avatar>
                <q-icon name="folder" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ folder.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>
          
          <!-- Manual path input -->
          <q-input 
            v-model="selectedFolder" 
            label="Or enter path manually"
            class="q-mt-md"
            dense
            outlined
            :hint="destinationHint"
          />
        </div>
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="handleClose" />
        <q-btn 
          flat 
          label="Move" 
          color="primary" 
          :loading="loading"
          :disable="!canMove"
          @click="handleMove" 
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth";
import { computed, onMounted, ref, watch } from "vue";

interface MoveItem {
	type: "file" | "folder";
	key: string;
	name: string;
}

const props = defineProps<{
	modelValue: boolean;
	items: MoveItem[];
	bucket: string;
	currentPath: string;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
	moved: [];
}>();

const authStore = useAuthStore();
const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

const loading = ref(false);
const loadingFolders = ref(false);
const selectedFolder = ref("");
const availableFolders = ref<
	Array<{ name: string; path: string; depth: number }>
>([]);

const userHealthGroup = computed(() => {
	const username = authStore.user?.username;
	if (username === "henryford_user") return "henry_ford";
	if (username === "kettering_user") return "kettering";
	if (username === "osf_user") return "osf";
	if (username === "test_user") return "test_group";
	if (username === "spendrule_admin") return "admin";
	return null;
});

const categoryFolders = [
	"contracts",
	"invoices",
	"workflows",
	"reports",
	"forms",
	"other",
];

const isMultiple = computed(() => props.items.length > 1);
const itemName = computed(() => props.items[0]?.name || "");

const canMove = computed(() => {
	if (!selectedFolder.value && selectedFolder.value !== "") return false;

	// Prevent moving to same location
	const destinationPath = selectedFolder.value
		? `${selectedFolder.value}/`
		: "";
	return !props.items.some((item) => {
		const itemPath = item.key.substring(0, item.key.lastIndexOf("/") + 1);
		return itemPath === destinationPath;
	});
});

const destinationHint = computed(() => {
	if (!selectedFolder.value) return "Files will be moved to root";
	return `Files will be moved to: ${selectedFolder.value}/`;
});

function getFullPath(category: string): string {
	if (userHealthGroup.value && userHealthGroup.value !== "admin") {
		return `${userHealthGroup.value}/${category}`;
	}
	return category;
}

async function loadAvailableFolders() {
	loadingFolders.value = true;
	try {
		const response = await api.get(`/buckets/${props.bucket}`, {
			params: {
				delimiter: "/",
				limit: 1000,
			},
		});

		const folders: Array<{ name: string; path: string; depth: number }> = [];

		// Process delimited prefixes (folders)
		if (response.data.delimitedPrefixes) {
			response.data.delimitedPrefixes.forEach((prefix: string) => {
				const cleanPath = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
				const parts = cleanPath.split("/");
				const name = parts[parts.length - 1];
				const depth = parts.length - 1;

				// Skip if it's a category folder we already show
				if (!categoryFolders.includes(name)) {
					folders.push({ name, path: cleanPath, depth });
				}
			});
		}

		availableFolders.value = folders;
	} catch (error) {
		console.error("Failed to load folders:", error);
	} finally {
		loadingFolders.value = false;
	}
}

async function handleMove() {
	loading.value = true;

	try {
		const movePromises = props.items.map((item) => {
			const fileName = item.key.split("/").pop();
			const newPath = selectedFolder.value
				? `${selectedFolder.value}/${fileName}`
				: fileName;

			return api.post(`/buckets/${props.bucket}/move`, {
				from: item.key,
				to: newPath,
			});
		});

		await Promise.all(movePromises);

		toast.success(
			isMultiple.value
				? `Successfully moved ${props.items.length} items`
				: `Successfully moved ${itemName.value}`,
		);

		emit("moved");
		handleClose();
	} catch (error: any) {
		toast.error(
			error.response?.data?.error ||
				`Failed to move ${isMultiple.value ? "items" : "item"}`,
		);
	} finally {
		loading.value = false;
	}
}

function handleClose() {
	show.value = false;
	selectedFolder.value = "";
}

onMounted(() => {
	loadAvailableFolders();
});

watch(
	() => props.modelValue,
	(val) => {
		if (val) {
			loadAvailableFolders();
		}
	},
);
</script>

<style scoped>
.folder-tree-container {
  background: white;
}

.q-item {
  min-height: 36px;
}
</style>