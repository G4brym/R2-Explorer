<template>
  <div
    v-if="isOpen"
    ref="menuRef"
    class="fixed bg-card border rounded-md shadow-lg py-1 z-50 min-w-[160px]"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <button
      class="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-left"
      @click="createSubfolder"
    >
      <FolderPlusIcon class="w-4 h-4 mr-2" />
      New Folder
    </button>
    
    <div class="h-px bg-border my-1" />
    
    <button
      class="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-left"
      @click="rename"
    >
      <EditIcon class="w-4 h-4 mr-2" />
      Rename
    </button>
    
    <div class="h-px bg-border my-1" />
    
    <button
      class="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-destructive text-left"
      @click="deleteFolder"
    >
      <TrashIcon class="w-4 h-4 mr-2" />
      Delete
    </button>
  </div>

  <!-- Create Subfolder Dialog -->
  <div v-if="showCreateDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Create New Folder</h2>
          <Button variant="ghost" size="icon" @click="cancelCreate">
            <XIcon class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form @submit.prevent="confirmCreate" class="space-y-4">
          <div class="space-y-2">
            <label for="folderName" class="text-sm font-medium">Folder Name</label>
            <Input
              id="folderName"
              v-model="newFolderName"
              placeholder="Enter folder name"
              required
              :disabled="loading"
              class="w-full"
            />
          </div>
          
          <div class="flex justify-end space-x-2">
            <Button variant="outline" type="button" @click="cancelCreate" :disabled="loading">
              Cancel
            </Button>
            <Button type="submit" :disabled="loading">
              <LoaderIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
              Create
            </Button>
          </div>
          
          <div v-if="error" class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {{ error }}
          </div>
        </form>
      </CardContent>
    </Card>
  </div>

  <!-- Rename Dialog -->
  <div v-if="showRenameDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Rename {{ folder?.name }}</h2>
          <Button variant="ghost" size="icon" @click="cancelRename">
            <XIcon class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form @submit.prevent="confirmRename" class="space-y-4">
          <div class="space-y-2">
            <label for="newName" class="text-sm font-medium">New Name</label>
            <Input
              id="newName"
              v-model="newName"
              :placeholder="folder?.name"
              required
              :disabled="loading"
              class="w-full"
            />
          </div>
          
          <div class="flex justify-end space-x-2">
            <Button variant="outline" type="button" @click="cancelRename" :disabled="loading">
              Cancel
            </Button>
            <Button type="submit" :disabled="loading">
              <LoaderIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
              Rename
            </Button>
          </div>
          
          <div v-if="error" class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {{ error }}
          </div>
        </form>
      </CardContent>
    </Card>
  </div>

  <!-- Delete Confirmation Dialog -->
  <div v-if="showDeleteDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-destructive-foreground" />
          </div>
          <h2 class="text-xl font-semibold">Delete {{ folder?.name }}?</h2>
        </div>
      </CardHeader>
      
      <CardContent>
        <p class="text-muted-foreground mb-4">
          This action cannot be undone. Are you sure you want to delete this folder and all its contents?
        </p>
        
        <div class="flex justify-end space-x-2">
          <Button variant="outline" @click="cancelDelete" :disabled="loading">
            Cancel
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="loading">
            <LoaderIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            Delete
          </Button>
        </div>
        
        <div v-if="error" class="p-3 mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {{ error }}
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import CardContent from "@/components/ui/CardContent.vue";
import CardHeader from "@/components/ui/CardHeader.vue";
import Input from "@/components/ui/Input.vue";
import { api } from "@/lib/api";
import {
	EditIcon,
	FolderPlusIcon,
	LoaderIcon,
	TrashIcon,
	XIcon,
} from "lucide-vue-next";
import { onMounted, onUnmounted, ref } from "vue";

interface FolderItem {
	name: string;
	key?: string;
}

interface Props {
	isOpen: boolean;
	x: number;
	y: number;
	folder: FolderItem | null;
	bucket: string;
	currentPath: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	close: [];
	deleted: [];
	renamed: [];
	folderCreated: [];
}>();

const menuRef = ref<HTMLElement>();
const showCreateDialog = ref(false);
const showRenameDialog = ref(false);
const showDeleteDialog = ref(false);
const newFolderName = ref("");
const newName = ref("");
const loading = ref(false);
const error = ref("");

function createSubfolder() {
	newFolderName.value = "";
	showCreateDialog.value = true;
	emit("close");
}

function rename() {
	if (!props.folder) return;

	newName.value = props.folder.name;
	showRenameDialog.value = true;
	emit("close");
}

function deleteFolder() {
	showDeleteDialog.value = true;
	emit("close");
}

function cancelCreate() {
	showCreateDialog.value = false;
	newFolderName.value = "";
	error.value = "";
	loading.value = false;
}

async function confirmCreate() {
	if (!newFolderName.value.trim() || !props.folder) return;

	loading.value = true;
	error.value = "";

	try {
		const folderPath = props.currentPath
			? `${props.currentPath}/${props.folder.name}/${newFolderName.value.trim()}`
			: `${props.folder.name}/${newFolderName.value.trim()}`;

		await api.post(`/buckets/${props.bucket}/folders`, {
			name: folderPath,
		});

		emit("folderCreated");
		cancelCreate();
	} catch (e: any) {
		error.value = e.response?.data?.error || "Failed to create folder";
		console.error("Failed to create folder:", e);
	} finally {
		loading.value = false;
	}
}

function cancelRename() {
	showRenameDialog.value = false;
	newName.value = "";
	error.value = "";
	loading.value = false;
}

async function confirmRename() {
	if (!props.folder || !newName.value.trim()) return;

	loading.value = true;
	error.value = "";

	try {
		const oldPath = props.currentPath
			? `${props.currentPath}/${props.folder.name}`
			: props.folder.name;
		const newPath = props.currentPath
			? `${props.currentPath}/${newName.value.trim()}`
			: newName.value.trim();

		await api.post(`/buckets/${props.bucket}/folders/move`, {
			from: oldPath,
			to: newPath,
		});

		emit("renamed");
		cancelRename();
	} catch (e: any) {
		error.value = e.response?.data?.error || "Failed to rename folder";
		console.error("Failed to rename folder:", e);
	} finally {
		loading.value = false;
	}
}

function cancelDelete() {
	showDeleteDialog.value = false;
	error.value = "";
	loading.value = false;
}

async function confirmDelete() {
	if (!props.folder) return;

	loading.value = true;
	error.value = "";

	try {
		const folderPath = props.currentPath
			? `${props.currentPath}/${props.folder.name}`
			: props.folder.name;

		await api.post(`/buckets/${props.bucket}/folders/delete`, {
			path: folderPath,
		});

		emit("deleted");
		cancelDelete();
	} catch (e: any) {
		error.value = e.response?.data?.error || "Failed to delete folder";
		console.error("Failed to delete folder:", e);
	} finally {
		loading.value = false;
	}
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
	if (
		props.isOpen &&
		menuRef.value &&
		!menuRef.value.contains(event.target as Node)
	) {
		emit("close");
	}
}

// Close menu on escape key
function handleKeyDown(event: KeyboardEvent) {
	if (event.key === "Escape" && props.isOpen) {
		emit("close");
	}
}

onMounted(() => {
	document.addEventListener("click", handleClickOutside);
	document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
	document.removeEventListener("keydown", handleKeyDown);
});
</script>