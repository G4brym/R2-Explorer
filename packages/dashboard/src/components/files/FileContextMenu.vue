<template>
  <div
    v-if="isOpen"
    ref="menuRef"
    class="fixed bg-card border rounded-md shadow-lg py-1 z-50 min-w-[160px]"
    :style="menuPositionRef"
  >
    <button
      class="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-left"
      :disabled="loading"
      @click="download"
    >
      <LoaderIcon v-if="downloading" class="w-4 h-4 mr-2 animate-spin" />
      <DownloadIcon v-else class="w-4 h-4 mr-2" />
      {{ downloading ? 'Downloading...' : 'Download' }}
    </button>
    
    <button
      class="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-left"
      :disabled="loading"
      @click="rename"
    >
      <EditIcon class="w-4 h-4 mr-2" />
      Rename
    </button>
    
    <button
      class="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-left"
      :disabled="loading"
      @click="move"
    >
      <MoveIcon class="w-4 h-4 mr-2" />
      Move
    </button>
    
    <div class="h-px bg-border my-1" />
    
    <button
      class="flex items-center w-full px-3 py-2 text-sm hover:bg-accent text-destructive text-left"
      :disabled="loading"
      @click="deleteFile"
    >
      <TrashIcon class="w-4 h-4 mr-2" />
      Delete
    </button>
  </div>

  <!-- Rename Dialog -->
  <div v-if="showRenameDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Rename {{ file?.name }}</h2>
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
              :placeholder="file?.name"
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
          <h2 class="text-xl font-semibold">Delete {{ file?.name }}?</h2>
        </div>
      </CardHeader>
      
      <CardContent>
        <p class="text-muted-foreground mb-4">
          This action cannot be undone. Are you sure you want to delete this {{ file?.isFolder ? 'folder' : 'file' }}?
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
import { safeBase64Encode } from "@/lib/browser";
import { toast } from "@/lib/toast";
import {
	DownloadIcon,
	EditIcon,
	LoaderIcon,
	MoveIcon,
	TrashIcon,
	XIcon,
} from "lucide-vue-next";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

interface FileItem {
	name: string;
	key: string;
	size?: number;
	lastModified?: string;
	isFolder?: boolean;
}

interface Props {
	isOpen: boolean;
	x: number;
	y: number;
	file: FileItem | null;
	bucket: string;
	currentPath: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	close: [];
	deleted: [];
	renamed: [];
	move: [];
}>();

const menuRef = ref<HTMLElement>();
const showRenameDialog = ref(false);
const showDeleteDialog = ref(false);
const newName = ref("");
const loading = ref(false);
const downloading = ref(false);
const error = ref("");
const menuPositionRef = ref({ left: "0px", top: "0px" });

// Calculate smart positioning to keep menu within viewport
function calculateMenuPosition() {
	// Only calculate if menu is open and props are available
	if (!props.isOpen || props.x === undefined || props.y === undefined) {
		return { left: "0px", top: "0px" };
	}

	const MENU_WIDTH = 160;
	const MENU_HEIGHT = 160; // Approximate height for 4 items
	const PADDING = 8;

	// Get current viewport dimensions (recalculated each time)
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	let left = props.x;
	let top = props.y;

	// Adjust horizontal position if menu would go off right edge
	if (left + MENU_WIDTH + PADDING > viewportWidth) {
		left = Math.max(PADDING, props.x - MENU_WIDTH);
	}

	// Adjust vertical position if menu would go off bottom edge
	if (top + MENU_HEIGHT + PADDING > viewportHeight) {
		top = Math.max(PADDING, props.y - MENU_HEIGHT);
	}

	// Ensure menu doesn't go off left or top edges
	left = Math.max(PADDING, left);
	top = Math.max(PADDING, top);

	return {
		left: `${left}px`,
		top: `${top}px`,
	};
}

// Watch for prop changes and recalculate position
watch(
	[() => props.isOpen, () => props.x, () => props.y],
	() => {
		if (props.isOpen) {
			menuPositionRef.value = calculateMenuPosition();
		}
	},
	{ immediate: true },
);

async function download() {
	if (!props.file) return;

	downloading.value = true;

	try {
		// Encode the key with base64 as required by backend (Unicode-safe)
		const encodedKey = safeBase64Encode(props.file.key);

		// Fetch file with authentication
		const response = await api.get(
			`/buckets/${props.bucket}/${encodeURIComponent(encodedKey)}`,
			{
				responseType: "blob",
				timeout: 300000, // allow up to 5 minutes for large files
			},
		);

		// Create blob URL for download
		const blob = new Blob([response.data]);
		const url = window.URL.createObjectURL(blob);

		// Create temporary link and trigger download
		const link = document.createElement("a");
		link.href = url;
		link.download = props.file.name;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Cleanup blob URL
		window.URL.revokeObjectURL(url);

		// Reset after a short delay to show feedback
		setTimeout(() => {
			downloading.value = false;
			emit("close");
		}, 500);
	} catch (error) {
		downloading.value = false;
		console.error("Download failed:", error);
		toast.error("Failed to download file");
		emit("close");
	}
}

function move() {
	if (!props.file) return;
	emit("move");
	emit("close");
}

function rename() {
	if (!props.file) return;

	newName.value = props.file.name;
	showRenameDialog.value = true;
	emit("close");
}

function deleteFile() {
	showDeleteDialog.value = true;
	emit("close");
}

function cancelRename() {
	showRenameDialog.value = false;
	newName.value = "";
	error.value = "";
	loading.value = false;
}

async function confirmRename() {
	if (!props.file || !newName.value.trim()) return;

	loading.value = true;
	error.value = "";

	try {
		const oldKey = props.file.key;
		const pathParts = oldKey.split("/");
		pathParts[pathParts.length - 1] = newName.value.trim();
		const newKey = pathParts.join("/");

		await api.post(`/buckets/${props.bucket}/move`, {
			// Send base64-encoded keys to match API contract (Unicode-safe)
			oldKey: safeBase64Encode(oldKey),
			newKey: safeBase64Encode(newKey),
		});

		emit("renamed");
		cancelRename();
	} catch (e: any) {
		error.value = e.response?.data?.error || "Failed to rename file";
		console.error("Failed to rename file:", e);
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
	if (!props.file) return;

	loading.value = true;
	error.value = "";

	try {
		await api.post(`/buckets/${props.bucket}/delete`, {
			// Encode to base64 for server consistency (Unicode-safe)
			key: safeBase64Encode(props.file.key),
		});

		emit("deleted");
		cancelDelete();
	} catch (e: any) {
		error.value = e.response?.data?.error || "Failed to delete file";
		console.error("Failed to delete file:", e);
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
