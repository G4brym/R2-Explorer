<template>
  <div class="h-full flex flex-col">
    <!-- Breadcrumb and actions -->
    <div class="border-b bg-card">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
        <div class="flex items-center space-x-2 text-sm text-muted-foreground">
          <FolderIcon class="w-4 h-4" />
          <span>{{ currentBucket }}</span>
          <template v-if="currentPath">
            <ChevronRightIcon class="w-4 h-4" />
            <span class="text-foreground">{{ currentPath }}</span>
          </template>
        </div>
        
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="!isSelecting && isAdmin && !currentPath"
            variant="default"
            size="sm"
            title="Download ALL health group files as one ZIP (Admin only)"
            @click="downloadAllGroupsAsZip"
            :disabled="loading"
          >
            <DownloadIcon class="w-4 h-4 lg:mr-2" />
            <span class="hidden lg:inline">Download All Groups</span>
          </Button>
          <Button
            v-if="!isSelecting"
            variant="outline"
            size="sm"
            title="Download all files in current folder as ZIP"
            @click="downloadAllAsZip"
            :disabled="loading || files.length === 0"
          >
            <DownloadIcon class="w-4 h-4 lg:mr-2" />
            <span class="hidden lg:inline">Download All</span>
          </Button>
          <Button
            v-if="!isSelecting"
            variant="outline"
            size="sm"
            @click="toggleSelectionMode"
          >
            <CheckSquareIcon class="w-4 h-4 mr-2" />
            Select
          </Button>
          <Button 
            v-if="isSelecting" 
            variant="outline" 
            size="sm"
            title="Select All (Ctrl+A)"
            @click="enhancedSelectAll"
          >
            Select All
          </Button>
          <Button 
            v-if="isSelecting" 
            variant="outline" 
            size="sm"
            @click="enhancedClearSelection"
          >
            Clear
          </Button>
          <Button 
            v-if="isSelecting" 
            variant="outline" 
            size="sm" 
            @click="exitSelectionMode"
          >
            <XIcon class="w-4 h-4 mr-2" />
            Exit
          </Button>
          <Button 
            v-if="!isSelecting" 
            variant="outline" 
            size="sm"
            title="Upload Files (Ctrl+U)"
            @click="showUploadDialog = true"
          >
            <UploadIcon class="w-4 h-4 lg:mr-2" />
            <span class="hidden lg:inline">Upload</span>
          </Button>
          <Button 
            v-if="!isSelecting" 
            variant="outline" 
            size="sm"
            title="New Folder (Ctrl+N)"
            @click="showCreateFolderDialog = true"
          >
            <FolderPlusIcon class="w-4 h-4 lg:mr-2" />
            <span class="hidden lg:inline">New Folder</span>
          </Button>
          <Button 
            v-if="!isSelecting"
            variant="outline" 
            size="sm"
            title="Toggle between folder view and show all files"
            @click="showAllFiles = !showAllFiles"
            :class="showAllFiles ? 'bg-primary text-primary-foreground' : ''"
          >
            <EyeIcon class="w-4 h-4 lg:mr-2" />
            <span class="hidden xl:inline">{{ showAllFiles ? 'Folder View' : 'Show All Files' }}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            title="Keyboard Shortcuts (F1)"
            @click="showKeyboardHelp = true"
          >
            <HelpCircleIcon class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    
    <!-- SpendRule Document Category Hints -->
    <DocumentCategoryHint />
    
    <!-- Bulk Operations Toolbar -->
    <div v-if="isSelecting && selectedItems.length > 0" class="border-b bg-muted/50">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 sm:px-6 py-2 sm:py-3">
        <div class="flex items-center space-x-2 text-sm">
          <span class="font-medium">{{ selectedItems.length }} item{{ selectedItems.length === 1 ? '' : 's' }} selected</span>
        </div>
        
        <div class="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            @click="bulkDownload" 
            :disabled="!hasFilesSelected"
          >
            <DownloadIcon class="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            @click="openMoveDialog()"
          >
            <MoveIcon class="w-4 h-4 mr-2" />
            Move
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            @click="showBulkDeleteDialog = true"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
    
    <!-- File listing -->
    <div class="flex-1 overflow-auto">
      <div v-if="loading" class="p-6">
        <FileListSkeleton :count="8" />
      </div>
      
      <div v-else-if="error" class="flex items-center justify-center h-64">
        <div class="text-center">
          <AlertCircleIcon class="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">Error loading files</h3>
          <p class="text-muted-foreground mb-4">{{ error }}</p>
          <Button @click="loadFiles">Try Again</Button>
        </div>
      </div>
      
      <div v-else-if="files.length === 0" class="flex items-center justify-center h-64">
        <div class="text-center">
          <FolderIcon class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">No files found</h3>
          <p class="text-muted-foreground mb-4">This folder is empty. Upload some files to get started.</p>
          <Button @click="showUploadDialog = true">
            <UploadIcon class="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>
      
      <div v-else class="p-3 sm:p-4 lg:p-6">
        <div class="grid gap-2 sm:gap-3 lg:gap-4">
          <!-- Back navigation -->
          <div v-if="currentPath" 
               class="flex items-center p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
               role="button"
               tabindex="0"
               aria-label="Go back to parent directory"
               @click="navigateUp"
               @keydown.enter="navigateUp"
               @keydown.space.prevent="navigateUp">
            <ArrowLeftIcon class="w-4 h-4 mr-3" />
            <span class="font-medium">.. (Back)</span>
          </div>
          
          <!-- Folders -->
          <div v-for="(folder, index) in folders" :key="folder.name"
               class="flex items-center p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
               :class="{ 
                 'bg-accent': isSelecting && isSelected('folder', folder.name),
                 'ring-2 ring-primary': currentFocusIndex === index
               }"
               role="button"
               tabindex="0"
               :aria-label="`Folder: ${folder.name}. ${isSelecting ? (isSelected('folder', folder.name) ? 'Selected' : 'Not selected') : 'Double click to open'}`"
               :aria-selected="isSelecting ? isSelected('folder', folder.name) : undefined"
               @click="isSelecting ? toggleSelection('folder', folder.name, folder) : navigateToFolder(folder.name)"
               @keydown.enter="isSelecting ? toggleSelection('folder', folder.name, folder) : navigateToFolder(folder.name)"
               @keydown.space.prevent="isSelecting ? toggleSelection('folder', folder.name, folder) : null"
               @contextmenu.prevent="!isSelecting ? showFolderContextMenu($event, folder) : null"
               @focus="currentFocusIndex = index">
            <input 
              v-if="isSelecting" 
              type="checkbox" 
              :checked="isSelected('folder', folder.name)"
              :aria-label="`Select folder ${folder.name}`"
              @click.stop
              @change="toggleSelection('folder', folder.name, folder)"
              class="mr-3"
            />
            <FolderIcon class="w-5 h-5 mr-3 text-blue-500" aria-hidden="true" />
            <div class="flex-1">
              <div class="font-medium">{{ folder.name }}</div>
              <div class="text-sm text-muted-foreground">Folder</div>
            </div>
            <Button 
              v-if="!isSelecting" 
              variant="ghost" 
              size="icon"
              :aria-label="`More options for ${folder.name}`"
              @click.stop="showFolderContextMenu($event, folder)"
            >
              <MoreHorizontalIcon class="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
          
          <!-- Files -->
          <div v-for="(file, fileIndex) in filesList" :key="file.key"
               class="flex items-center p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
               :class="{ 
                 'bg-accent': isSelecting && isSelected('file', file.key),
                 'ring-2 ring-primary': currentFocusIndex === folders.length + fileIndex
               }"
               role="button"
               tabindex="0"
               :aria-label="`File: ${file.name}. Size: ${formatBytes(file.size)}. Modified: ${formatDate(file.lastModified)}. ${isSelecting ? (isSelected('file', file.key) ? 'Selected' : 'Not selected') : 'Click to preview'}`"
               :aria-selected="isSelecting ? isSelected('file', file.key) : undefined"
               @click="isSelecting ? toggleSelection('file', file.key, file) : previewFile(file)"
               @keydown.enter="isSelecting ? toggleSelection('file', file.key, file) : previewFile(file)"
               @keydown.space.prevent="isSelecting ? toggleSelection('file', file.key, file) : null"
               @contextmenu.prevent="!isSelecting ? showContextMenu($event, file) : null"
               @focus="currentFocusIndex = folders.length + fileIndex">
            <input 
              v-if="isSelecting" 
              type="checkbox" 
              :checked="isSelected('file', file.key)"
              :aria-label="`Select file ${file.name}`"
              @click.stop
              @change="toggleSelection('file', file.key, file)"
              class="mr-3"
            />
            <component :is="getFileIcon(file.name)" class="w-5 h-5 mr-3 text-muted-foreground" aria-hidden="true" />
            <div class="flex-1">
              <div class="font-medium">{{ file.name }}</div>
              <div class="text-sm text-muted-foreground">
                <template v-if="file.isFolder">
                  Folder
                </template>
                <template v-else>
                  {{ formatBytes(file.size) }} • {{ formatDate(file.lastModified) }}
                </template>
              </div>
            </div>
            <Button 
              v-if="!isSelecting" 
              variant="ghost" 
              size="icon"
              :aria-label="`More options for ${file.name}`"
              @click.stop="showContextMenu($event, file)"
            >
              <MoreHorizontalIcon class="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination Controls -->
    <Pagination
      v-if="!loading && (files.length > 0 || currentPage > 1)"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-items="totalItems"
      :has-next="hasNextPage"
      :has-previous="currentPage > 1"
      @update:page-size="handlePageSizeChange"
      @next="handleNextPage"
      @previous="handlePreviousPage"
    />
    
    <!-- Upload Dialog -->
    <FileUploadDialog
      :is-open="showUploadDialog"
      :current-path="currentPath"
      :bucket="currentBucket"
      @close="showUploadDialog = false"
      @uploaded="handleFileUploaded"
    />
    
    <!-- Create Folder Dialog -->
    <CreateFolderDialog
      :is-open="showCreateFolderDialog"
      :current-path="currentPath"
      :bucket="currentBucket"
      @close="showCreateFolderDialog = false"
      @created="handleFolderCreated"
    />
    
    <!-- File Preview Dialog -->
    <FilePreviewDialog
      :is-open="showPreviewDialog"
      :file="selectedPreviewFile"
      :bucket="currentBucket"
      @close="closePreview"
    />
    
    <!-- Move File Dialog (Improved with shadcn/ui) -->
    <ImprovedMoveFileDialog
      v-model="showMoveDialog"
      :items="moveItems"
      :bucket="currentBucket"
      :current-path="currentPath"
      @moved="handleFileMoved"
    />
    
    <!-- File Context Menu -->
    <FileContextMenu
      :is-open="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :file="contextMenu.file"
      :bucket="currentBucket"
      :current-path="currentPath"
      @close="closeContextMenu"
      @deleted="handleFileDeleted"
      @renamed="handleFileRenamed"
      @move="handleContextMenuMove"
    />
    
    <!-- Folder Context Menu -->
    <FolderContextMenu
      :is-open="folderContextMenu.show"
      :x="folderContextMenu.x"
      :y="folderContextMenu.y"
      :folder="folderContextMenu.folder"
      :bucket="currentBucket"
      :current-path="currentPath"
      @close="closeFolderContextMenu"
      @deleted="handleFolderDeleted"
      @renamed="handleFolderRenamed"
      @folder-created="handleFolderCreated"
    />
    
    <!-- Bulk Delete Confirmation Dialog -->
    <div v-if="showBulkDeleteDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card class="w-full max-w-md mx-4">
        <CardHeader>
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
              <TrashIcon class="w-4 h-4 text-destructive-foreground" />
            </div>
            <h2 class="text-xl font-semibold">Delete {{ selectedItems.length }} item{{ selectedItems.length === 1 ? '' : 's' }}?</h2>
          </div>
        </CardHeader>
        
        <CardContent>
          <p class="text-muted-foreground mb-4">
            This action cannot be undone. Are you sure you want to delete the selected {{ selectedItems.length }} item{{ selectedItems.length === 1 ? '' : 's' }}?
          </p>
          
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="showBulkDeleteDialog = false">
              Cancel
            </Button>
            <Button variant="destructive" @click="bulkDelete">
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Bulk Operation Loading Overlay -->
    <LoadingOverlay
      :show="bulkOperationLoading"
      title="Deleting Files"
      message="Please wait while we delete the selected items..."
      :progress="bulkOperationProgress"
      :persistent="true"
    />
    
    <!-- Keyboard Shortcuts Help Dialog -->
    <div v-if="showKeyboardHelp" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card class="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <KeyboardIcon class="w-5 h-5" />
              <h2 class="text-xl font-semibold">Keyboard Shortcuts</h2>
            </div>
            <Button variant="ghost" size="icon" @click="showKeyboardHelp = false">
              <XIcon class="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div class="grid gap-6">
            <div>
              <h3 class="font-semibold mb-3">File Management</h3>
              <div class="grid gap-2 text-sm">
                <div class="flex justify-between">
                  <span>Upload files</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Ctrl + U</kbd>
                </div>
                <div class="flex justify-between">
                  <span>New folder</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Ctrl + N</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Refresh</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Ctrl + R</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="font-semibold mb-3">Selection</h3>
              <div class="grid gap-2 text-sm">
                <div class="flex justify-between">
                  <span>Toggle selection mode</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Ctrl + S</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Select all</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Ctrl + A</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Toggle item selection</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Delete selected</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Delete</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Exit selection mode</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Escape</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="font-semibold mb-3">Navigation</h3>
              <div class="grid gap-2 text-sm">
                <div class="flex justify-between">
                  <span>Move up</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Move down</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Go to first item</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Home</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Go to last item</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">End</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Open/Select item</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="font-semibold mb-3">General</h3>
              <div class="grid gap-2 text-sm">
                <div class="flex justify-between">
                  <span>Show this help</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">F1</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Close dialogs</span>
                  <kbd class="px-2 py-1 bg-muted rounded text-xs">Escape</kbd>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t text-xs text-muted-foreground">
            <p>Use Tab to navigate between interactive elements. Screen reader users can navigate using standard ARIA patterns.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import CreateFolderDialog from "@/components/files/CreateFolderDialog.vue";
import FileContextMenu from "@/components/files/FileContextMenu.vue";
import FilePreviewDialog from "@/components/files/FilePreviewDialog.vue";
import FileUploadDialog from "@/components/files/FileUploadDialog.vue";
import FolderContextMenu from "@/components/files/FolderContextMenu.vue";
import ImprovedMoveFileDialog from "@/components/files/ImprovedMoveFileDialog.vue";
import DocumentCategoryHint from "@/components/spendrule/DocumentCategoryHint.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import CardContent from "@/components/ui/CardContent.vue";
import CardHeader from "@/components/ui/CardHeader.vue";
import FileListSkeleton from "@/components/ui/FileListSkeleton.vue";
import LoadingOverlay from "@/components/ui/LoadingOverlay.vue";
import LoadingSpinner from "@/components/ui/LoadingSpinner.vue";
import Pagination from "@/components/ui/Pagination.vue";
import { api } from "@/lib/api";
import { safeBase64Encode } from "@/lib/browser";
import {
	handleError,
	networkStatus,
	operationManager,
	withRetry,
} from "@/lib/errors";
import { deduplicateRequest, performanceMonitor } from "@/lib/performance";
import { toast } from "@/lib/toast";
import { formatBytes, formatDate } from "@/lib/utils";
import {
	AlertCircleIcon,
	ArrowLeftIcon,
	CheckSquareIcon,
	ChevronRightIcon,
	DownloadIcon,
	Eye as EyeIcon,
	FileIcon,
	FileTextIcon,
	FolderIcon,
	FolderPlusIcon,
	HelpCircleIcon,
	ImageIcon,
	KeyboardIcon,
	LoaderIcon,
	MoreHorizontalIcon,
	MoveIcon,
	TrashIcon,
	UploadIcon,
	XIcon,
} from "lucide-vue-next";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const files = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const isAdmin = ref(false);
const showUploadDialog = ref(false);
const showCreateFolderDialog = ref(false);
const showPreviewDialog = ref(false);
const showAllFiles = ref(false);
const selectedPreviewFile = ref<any>(null);
const contextMenu = ref({
	show: false,
	x: 0,
	y: 0,
	file: null as any,
});

const folderContextMenu = ref({
	show: false,
	x: 0,
	y: 0,
	folder: null as any,
});

const isSelecting = ref(false);
const selectedItems = ref<
	Array<{ type: "file" | "folder"; key: string; item: any }>
>([]);
const showBulkDeleteDialog = ref(false);
const bulkOperationLoading = ref(false);
const bulkOperationProgress = ref(0);
const showKeyboardHelp = ref(false);
const showMoveDialog = ref(false);
const moveItems = ref<
	Array<{ type: "file" | "folder"; key: string; name: string }>
>([]);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(50);
const totalItems = ref(0);
const hasNextPage = ref(false);
const cursor = ref<string | null>(null);
const cursors = ref<string[]>([]); // Store cursors for previous pages

const currentBucket = computed(() => route.params.bucket as string);
const currentPath = computed(() => {
	const pathMatch = route.params.pathMatch as string;
	return pathMatch ? decodeURIComponent(pathMatch) : "";
});

const folders = computed(() =>
	files.value
		.filter((item) => item.isFolder)
		.map((item) => ({ name: item.name.replace(/\/$/, "") })),
);

const filesList = computed(() => files.value.filter((item) => !item.isFolder));

const hasFilesSelected = computed(() =>
	selectedItems.value.some((item) => item.type === "file"),
);

// Folder statistics for sidebar
const folderStats = computed(() => {
	const filesCount = filesList.value.length;
	const foldersCount = folders.value.length;
	const totalSize = filesList.value.reduce(
		(sum, file) => sum + (file.size || 0),
		0,
	);

	return {
		files: filesCount,
		folders: foldersCount,
		totalSize: totalSize > 0 ? formatBytes(totalSize) : "",
	};
});

// Emit stats updates to parent (AppLayout)
const emit = defineEmits<{
	"update-stats": [
		stats: { files: number; folders: number; totalSize: string },
	];
}>();

const currentFocusIndex = ref(-1);
const allItems = computed(() => [
	...folders.value.map((f) => ({ ...f, type: "folder" as const })),
	...filesList.value.map((f) => ({ ...f, type: "file" as const })),
]);

function getFileIcon(filename: string) {
	const ext = filename.split(".").pop()?.toLowerCase();

	if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) {
		return ImageIcon;
	}
	if (["txt", "md", "json", "csv"].includes(ext || "")) {
		return FileTextIcon;
	}
	return FileIcon;
}

async function loadFiles(resetPagination = false) {
	if (resetPagination) {
		currentPage.value = 1;
		cursor.value = null;
		cursors.value = [];
	}

	const operationId = "loadFiles";
	const requestKey = `loadFiles:${currentBucket.value}:${currentPath.value}`;

	// Check network status first
	if (!networkStatus.isOnline) {
		error.value = "You are offline. Please check your connection.";
		toast.warning("Cannot load files while offline");
		return;
	}

	// Start performance monitoring
	const endTiming = performanceMonitor.startTiming("loadFiles");

	await operationManager.execute(
		operationId,
		async () => {
			loading.value = true;
			error.value = "";

			// Deduplicate concurrent requests to same path
			const response = await deduplicateRequest(requestKey, async () => {
				const params: any = {
					limit: pageSize.value,
					delimiter: "/", // Add delimiter to get folder listings
				};

				// Add prefix when inside a folder (base64 encoded, Unicode-safe)
				if (currentPath.value) {
					const prefixPath = currentPath.value.endsWith("/")
						? currentPath.value
						: `${currentPath.value}/`;
					params.prefix = safeBase64Encode(prefixPath);
				}

				if (cursor.value && currentPage.value > 1) {
					params.cursor = cursor.value;
				}

				return await api.get(`/buckets/${currentBucket.value}`, { params });
			});

			const objects = response.data.objects || [];
			const prefixes = response.data.delimitedPrefixes || [];

			// Capture admin status from API response
			isAdmin.value = response.data.isAdmin || false;

			// Update pagination info
			totalItems.value = response.data.objects?.length || 0;
			hasNextPage.value = response.data.truncated || false;
			if (response.data.cursor) {
				cursor.value = response.data.cursor;
			}

			// Client-side filtering based on current path
			const currentPrefix = currentPath.value ? `${currentPath.value}/` : "";

			// Filter objects based on view mode
			const filteredObjects = showAllFiles.value
				? objects // Show all files when "Show All Files" is enabled
				: objects.filter((obj: any) => {
						if (!currentPrefix) {
							// Root level: show files that don't have '/' OR have only one level
							return !obj.key.includes("/") || obj.key.split("/").length === 2;
						} else {
							// Subfolder: show files that start with current prefix and are direct children
							if (obj.key.startsWith(currentPrefix)) {
								const relativePath = obj.key.substring(currentPrefix.length);
								return !relativePath.includes("/"); // Direct child, not nested further
							}
							return false;
						}
					});

			// Extract folder names from delimitedPrefixes (actual folders from API)
			const folderNames = new Set<string>();

			// Add folders from delimitedPrefixes (these are actual folders)
			if (prefixes && prefixes.length > 0) {
				prefixes.forEach((prefix: string) => {
					// Handle root level vs subfolder prefixes
					if (!currentPrefix) {
						// Root level: extract top-level folder name
						const folderPath = prefix.endsWith("/")
							? prefix.slice(0, -1)
							: prefix;
						const folderName = folderPath.split("/")[0]; // Get first part for root level
						if (folderName) {
							folderNames.add(folderName);
						}
					} else {
						// Subfolder: extract relative folder name
						if (prefix.startsWith(currentPrefix)) {
							const relativePath = prefix.substring(currentPrefix.length);
							const folderPath = relativePath.endsWith("/")
								? relativePath.slice(0, -1)
								: relativePath;
							const folderName = folderPath.split("/")[0]; // Get first part of relative path
							if (folderName) {
								folderNames.add(folderName);
							}
						}
					}
				});
			}

			// Also extract folder names from object keys for backward compatibility
			objects.forEach((obj: any) => {
				if (!currentPrefix) {
					// Root level: extract top-level folders
					const parts = obj.key.split("/");
					if (parts.length > 1) {
						folderNames.add(parts[0]);
					}
				} else {
					// Subfolder: extract immediate subfolders
					if (obj.key.startsWith(currentPrefix)) {
						const relativePath = obj.key.substring(currentPrefix.length);
						const parts = relativePath.split("/");
						if (parts.length > 1) {
							folderNames.add(parts[0]);
						}
					}
				}
			});

			files.value = [
				// Add folder entries
				...Array.from(folderNames).map((folderName) => ({
					name: folderName,
					isFolder: true,
					key: currentPrefix + folderName + "/",
					size: 0,
					lastModified: null, // Explicitly set to null for folders
				})),
				// Add filtered objects
				...filteredObjects.map((obj: any) => ({
					...obj,
					name: obj.key.split("/").pop() || obj.key,
					isFolder: false,
				})),
			];

			loading.value = false;
			endTiming(); // Record performance metric
		},
		{
			context: {
				operation: "Load Files",
				component: "FilesPage",
				retry: loadFiles,
			},
			retry: true,
			maxAttempts: 3,
		},
	);

	// Update local loading state from operation manager
	loading.value = operationManager.isLoading(operationId);
	const operationError = operationManager.getError(operationId);
	if (operationError) {
		error.value = operationError;
	}
}

function navigateToFolder(folderName: string) {
	const newPath = currentPath.value
		? `${currentPath.value}/${folderName}`
		: folderName;
	router.push(`/files/${currentBucket.value}/${encodeURIComponent(newPath)}`);
}

function navigateUp() {
	const pathParts = currentPath.value.split("/");
	pathParts.pop();

	if (pathParts.length === 0) {
		router.push(`/files/${currentBucket.value}`);
	} else {
		const newPath = pathParts.join("/");
		router.push(`/files/${currentBucket.value}/${encodeURIComponent(newPath)}`);
	}
}

function showContextMenu(event: MouseEvent, file: any) {
	event.preventDefault();
	event.stopPropagation();

	contextMenu.value = {
		show: true,
		x: event.clientX,
		y: event.clientY,
		file: {
			...file,
			isFolder: false,
		},
	};
}

function closeContextMenu() {
	contextMenu.value.show = false;
	contextMenu.value.file = null;
}

function showFolderContextMenu(event: MouseEvent, folder: any) {
	event.preventDefault();
	event.stopPropagation();

	folderContextMenu.value = {
		show: true,
		x: event.clientX,
		y: event.clientY,
		folder: folder,
	};
}

function closeFolderContextMenu() {
	folderContextMenu.value.show = false;
	folderContextMenu.value.folder = null;
}

function handleFileUploaded() {
	toast.success("Files uploaded successfully");
	loadFiles();
}

function handleFolderCreated() {
	toast.success("Folder created successfully");
	loadFiles();
}

function handleFileDeleted() {
	toast.success("File deleted successfully");
	loadFiles();
	closeContextMenu();
}

function handleFileRenamed() {
	toast.success("File renamed successfully");
	loadFiles();
	closeContextMenu();
}

function handleContextMenuMove() {
	if (contextMenu.value.file) {
		moveItems.value = [
			{
				type: "file",
				key: contextMenu.value.file.key,
				name: contextMenu.value.file.name,
			},
		];
		showMoveDialog.value = true;
		closeContextMenu();
	}
}

function handleFolderDeleted() {
	toast.success("Folder deleted successfully");
	loadFiles();
	closeFolderContextMenu();
}

function handleFolderRenamed() {
	toast.success("Folder renamed successfully");
	loadFiles();
	closeFolderContextMenu();
}

// Multi-select functions
function toggleSelectionMode() {
	isSelecting.value = true;
	selectedItems.value = [];
}

function exitSelectionMode() {
	isSelecting.value = false;
	selectedItems.value = [];
}

function selectAll() {
	selectedItems.value = [];

	// Add all folders
	folders.value.forEach((folder) => {
		selectedItems.value.push({
			type: "folder",
			key: folder.name,
			item: folder,
		});
	});

	// Add all files
	filesList.value.forEach((file) => {
		selectedItems.value.push({
			type: "file",
			key: file.key,
			item: file,
		});
	});
}

function clearSelection() {
	selectedItems.value = [];
}

function toggleSelection(type: "file" | "folder", key: string, item: any) {
	const index = selectedItems.value.findIndex(
		(selected) => selected.type === type && selected.key === key,
	);

	if (index > -1) {
		selectedItems.value.splice(index, 1);
	} else {
		selectedItems.value.push({ type, key, item });
	}
}

function isSelected(type: "file" | "folder", key: string): boolean {
	return selectedItems.value.some(
		(selected) => selected.type === type && selected.key === key,
	);
}

function bulkDownload() {
	const fileItems = selectedItems.value.filter((item) => item.type === "file");

	if (fileItems.length === 0) {
		toast.warning("No files selected for download");
		return;
	}

	fileItems.forEach(({ item }) => {
		const url = `${api.defaults.baseURL}/buckets/${currentBucket.value}/${encodeURIComponent(item.key)}`;

		// Create temporary link and trigger download
		const link = document.createElement("a");
		link.href = url;
		link.download = item.name;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});

	toast.success(
		`Started downloading ${fileItems.length} file${fileItems.length === 1 ? "" : "s"}`,
	);
}

async function downloadAllAsZip() {
	try {
		loading.value = true;
		toast.info(
			"Preparing ZIP archive... This may take a while for large folders.",
		);

		// Fetch the ZIP file with authentication (Unicode-safe encoding)
		const response = await api.get(
			`/buckets/${currentBucket.value}/download/zip`,
			{
				params: currentPath.value
					? {
							prefix: safeBase64Encode(
								currentPath.value.endsWith("/")
									? currentPath.value
									: `${currentPath.value}/`,
							),
						}
					: {},
				responseType: "blob",
				timeout: 300000, // 5 minute timeout for large downloads
			},
		);

		// Create blob URL for download
		const blob = new Blob([response.data], { type: "application/zip" });
		const downloadUrl = window.URL.createObjectURL(blob);

		// Generate filename from path or use default
		let filename = "download.zip";
		if (currentPath.value) {
			const folderName = currentPath.value.split("/").pop() || "download";
			filename = `${folderName}.zip`;
		}

		// Create temporary link and trigger download
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Cleanup blob URL
		window.URL.revokeObjectURL(downloadUrl);

		toast.success("ZIP archive downloaded successfully");
	} catch (error: any) {
		console.error("Download failed:", error);
		const errorMessage =
			error.response?.data?.error || "Failed to download files as ZIP";
		toast.error(errorMessage);
	} finally {
		loading.value = false;
	}
}

async function downloadAllGroupsAsZip() {
	try {
		loading.value = true;
		toast.info(
			"Preparing complete archive of all health groups... This may take a while.",
		);

		// Fetch the complete ZIP file with authentication
		const response = await api.get(
			`/buckets/${currentBucket.value}/download/all-groups`,
			{
				responseType: "blob",
				timeout: 600000, // 10 minute timeout for large downloads
			},
		);

		// Create blob URL for download
		const blob = new Blob([response.data], { type: "application/zip" });
		const downloadUrl = window.URL.createObjectURL(blob);

		// Generate filename with date
		const today = new Date().toISOString().split("T")[0];
		const filename = `all_health_groups_${today}.zip`;

		// Create temporary link and trigger download
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Cleanup blob URL
		window.URL.revokeObjectURL(downloadUrl);

		toast.success("Complete archive downloaded successfully");
	} catch (error: any) {
		console.error("Download all groups failed:", error);
		const errorMessage =
			error.response?.data?.error || "Failed to download all health groups";
		toast.error(errorMessage);
	} finally {
		loading.value = false;
	}
}

async function bulkDelete() {
	if (selectedItems.value.length === 0) return;

	showBulkDeleteDialog.value = false;
	bulkOperationLoading.value = true;
	bulkOperationProgress.value = 0;

	const totalItems = selectedItems.value.length;
	let completedItems = 0;

	try {
		const deletePromises = selectedItems.value.map(async ({ type, item }) => {
			try {
				if (type === "file") {
					await withRetry(
						() =>
							api.post(`/buckets/${currentBucket.value}/delete`, {
								key: safeBase64Encode(item.key),
							}),
						{ maxAttempts: 2 },
					);
				} else {
					const folderPath = currentPath.value
						? `${currentPath.value}/${item.name}`
						: item.name;
					await withRetry(
						() =>
							api.post(`/buckets/${currentBucket.value}/folders/delete`, {
								path: folderPath,
							}),
						{ maxAttempts: 2 },
					);
				}

				completedItems++;
				bulkOperationProgress.value = Math.round(
					(completedItems / totalItems) * 100,
				);
			} catch (error) {
				console.error(`Failed to delete ${item.name}:`, error);
				completedItems++;
				bulkOperationProgress.value = Math.round(
					(completedItems / totalItems) * 100,
				);
				throw error;
			}
		});

		await Promise.all(deletePromises);
		toast.success(
			`Deleted ${selectedItems.value.length} item${selectedItems.value.length === 1 ? "" : "s"} successfully`,
		);
		selectedItems.value = [];
		loadFiles();
	} catch (error) {
		handleError(error, {
			operation: "Bulk Delete",
			component: "FilesPage",
		});
	} finally {
		bulkOperationLoading.value = false;
		bulkOperationProgress.value = 0;
	}
}

function previewFile(file: any) {
	selectedPreviewFile.value = file;
	showPreviewDialog.value = true;
}

function closePreview() {
	showPreviewDialog.value = false;
	selectedPreviewFile.value = null;
}

// Keyboard navigation and shortcuts
function handleKeyDown(event: KeyboardEvent) {
	const { key, ctrlKey, metaKey, shiftKey } = event;
	const isModifier = ctrlKey || metaKey;

	// Global shortcuts
	switch (key) {
		case "Escape":
			if (isSelecting.value) {
				exitSelectionMode();
				event.preventDefault();
			}
			break;

		case "a":
		case "A":
			if (isModifier) {
				if (isSelecting.value) {
					enhancedSelectAll();
				} else {
					toggleSelectionMode();
					enhancedSelectAll();
				}
				event.preventDefault();
			}
			break;

		case "u":
		case "U":
			if (isModifier && !isSelecting.value) {
				showUploadDialog.value = true;
				event.preventDefault();
			}
			break;

		case "n":
		case "N":
			if (isModifier && !isSelecting.value) {
				showCreateFolderDialog.value = true;
				event.preventDefault();
			}
			break;

		case "s":
		case "S":
			if (isModifier) {
				toggleSelectionMode();
				event.preventDefault();
			}
			break;

		case "Delete":
		case "Backspace":
			if (isSelecting.value && selectedItems.value.length > 0 && !shiftKey) {
				showBulkDeleteDialog.value = true;
				event.preventDefault();
			}
			break;

		case "r":
		case "R":
			if (isModifier && !isSelecting.value) {
				loadFiles();
				event.preventDefault();
			}
			break;

		case "F1":
			showKeyboardHelp.value = true;
			event.preventDefault();
			break;

		case "ArrowUp":
			if (allItems.value.length > 0) {
				currentFocusIndex.value = Math.max(0, currentFocusIndex.value - 1);
				focusCurrentItem();
				event.preventDefault();
			}
			break;

		case "ArrowDown":
			if (allItems.value.length > 0) {
				currentFocusIndex.value = Math.min(
					allItems.value.length - 1,
					currentFocusIndex.value + 1,
				);
				focusCurrentItem();
				event.preventDefault();
			}
			break;

		case "Home":
			if (allItems.value.length > 0) {
				currentFocusIndex.value = 0;
				focusCurrentItem();
				event.preventDefault();
			}
			break;

		case "End":
			if (allItems.value.length > 0) {
				currentFocusIndex.value = allItems.value.length - 1;
				focusCurrentItem();
				event.preventDefault();
			}
			break;

		case " ": // Space
			if (isSelecting.value && currentFocusIndex.value >= 0) {
				const item = allItems.value[currentFocusIndex.value];
				if (item) {
					const key = item.type === "folder" ? item.name : item.key;
					enhancedToggleSelection(item.type, key, item);
				}
				event.preventDefault();
			}
			break;
	}
}

function focusCurrentItem() {
	// Focus the current item in the list
	nextTick(() => {
		const items = document.querySelectorAll('[role="button"][tabindex="0"]');
		const targetItem =
			items[currentFocusIndex.value + (currentPath.value ? 1 : 0)]; // +1 for back button
		if (targetItem) {
			(targetItem as HTMLElement).focus();
		}
	});
}

// Announce changes to screen readers
function announceToScreenReader(message: string) {
	const announcement = document.createElement("div");
	announcement.setAttribute("aria-live", "polite");
	announcement.setAttribute("aria-atomic", "true");
	announcement.style.position = "absolute";
	announcement.style.left = "-10000px";
	announcement.style.width = "1px";
	announcement.style.height = "1px";
	announcement.style.overflow = "hidden";
	announcement.textContent = message;

	document.body.appendChild(announcement);

	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

// Enhanced selection functions with screen reader support
function enhancedToggleSelection(
	type: "file" | "folder",
	key: string,
	item: any,
) {
	const wasSelected = isSelected(type, key);
	toggleSelection(type, key, item);

	// Announce to screen readers
	const action = wasSelected ? "deselected" : "selected";
	const itemType = type === "folder" ? "folder" : "file";
	announceToScreenReader(
		`${itemType} ${item.name} ${action}. ${selectedItems.value.length} items selected.`,
	);
}

function enhancedSelectAll() {
	const beforeCount = selectedItems.value.length;
	selectAll();
	const afterCount = selectedItems.value.length;

	announceToScreenReader(`Selected all ${afterCount} items.`);
}

function enhancedClearSelection() {
	const count = selectedItems.value.length;
	clearSelection();
	announceToScreenReader(`Cleared selection. ${count} items deselected.`);
}

// Pagination functions
function handleNextPage() {
	if (hasNextPage.value) {
		// Store current cursor for going back
		if (cursor.value) {
			cursors.value[currentPage.value - 1] = cursor.value;
		}
		currentPage.value++;
		loadFiles();
	}
}

function handlePreviousPage() {
	if (currentPage.value > 1) {
		currentPage.value--;
		// Restore cursor for previous page
		if (currentPage.value > 1) {
			cursor.value = cursors.value[currentPage.value - 2] || null;
		} else {
			cursor.value = null;
		}
		loadFiles();
	}
}

function handlePageSizeChange(newSize: number) {
	pageSize.value = newSize;
	loadFiles(true); // Reset pagination
}

// Move file functions
function openMoveDialog(
	items?: Array<{ type: "file" | "folder"; key: string; item: any }>,
) {
	if (items && items.length > 0) {
		moveItems.value = items.map((item) => ({
			type: item.type,
			key: item.key,
			name: item.item.name,
		}));
	} else if (selectedItems.value.length > 0) {
		moveItems.value = selectedItems.value.map((item) => ({
			type: item.type,
			key: item.key,
			name: item.item.name,
		}));
	}

	if (moveItems.value.length > 0) {
		showMoveDialog.value = true;
	} else {
		toast.warning("Please select items to move");
	}
}

function handleFileMoved() {
	clearSelection();
	loadFiles(true); // Reload files after move
}

watch(
	() => route.params,
	() => loadFiles(true),
	{ immediate: true },
);

// Watch for stats changes and emit to parent
watch(
	folderStats,
	(newStats) => {
		emit("update-stats", newStats);
	},
	{ immediate: true },
);

// Listen for refresh events from layout
function handleRefreshEvent() {
	loadFiles();
}

function handleUploadEvent() {
	showUploadDialog.value = true;
}

function handleCreateFolderEvent() {
	showCreateFolderDialog.value = true;
}

// Add keyboard event listener
onMounted(() => {
	document.addEventListener("keydown", handleKeyDown);
	window.addEventListener("refresh-view", handleRefreshEvent);
	window.addEventListener("trigger-upload", handleUploadEvent);
	window.addEventListener("trigger-create-folder", handleCreateFolderEvent);
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeyDown);
	window.removeEventListener("refresh-view", handleRefreshEvent);
	window.removeEventListener("trigger-upload", handleUploadEvent);
	window.removeEventListener("trigger-create-folder", handleCreateFolderEvent);

	// Log performance report on component unmount
	if (import.meta.env.DEV) {
		performanceMonitor.logReport();
	}
});
</script>
