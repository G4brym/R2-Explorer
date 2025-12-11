<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-2xl mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Upload Files</h2>
          <Button variant="ghost" size="icon" @click="close">
            <XIcon class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <!-- Drag and Drop Area -->
        <div
          ref="dropZone"
          class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors"
          :class="{ 'border-primary bg-primary/5': isDragging }"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <UploadIcon class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 class="text-lg font-medium mb-2">Drop files or folders here to upload</h3>
          <p class="text-muted-foreground mb-4">Or click to select files or folders</p>
          <div class="flex space-x-2">
            <Button variant="outline" @click="triggerFileInput">
              <FileIcon class="w-4 h-4 mr-2" />
              Select Files
            </Button>
            <Button variant="outline" @click="triggerFolderInput">
              <FolderIcon class="w-4 h-4 mr-2" />
              Select Folder
            </Button>
          </div>
          
          <input
            ref="fileInput"
            type="file"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
          
          <input
            ref="folderInput"
            type="file"
            webkitdirectory
            directory
            multiple
            class="hidden"
            @change="handleFolderSelect"
          />
        </div>

        <!-- Upload Progress -->
        <div v-if="uploadingFiles.length > 0" class="mt-6">
          <h3 class="font-medium mb-3">Upload Progress</h3>
          <div class="space-y-3">
            <div v-for="file in uploadingFiles" :key="file.name" class="flex items-center space-x-3">
              <!-- Status Icon -->
              <CheckCircleIcon v-if="file.status === 'completed'" class="w-4 h-4 text-green-500 flex-shrink-0" />
              <AlertCircleIcon v-else-if="file.status === 'error'" class="w-4 h-4 text-red-500 flex-shrink-0" />
              <RefreshCwIcon v-else-if="file.status === 'retrying'" class="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
              <FileIcon v-else class="w-4 h-4 text-blue-500 flex-shrink-0" />
              
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ file.name }}</div>
                
                <!-- Error message -->
                <div v-if="file.status === 'error' && file.error" class="text-xs text-red-500 mt-1">
                  {{ file.error }}
                </div>
                
                <!-- Retry info -->
                <div v-else-if="file.status === 'retrying'" class="text-xs text-yellow-600 mt-1">
                  Retrying... (attempt {{ (file.retryCount || 0) + 1 }}/3)
                </div>
                
                <!-- AI Analysis Status -->
                <div v-if="file.aiStatus === 'analyzing'" class="text-xs text-blue-600 mt-1 flex items-center">
                  <div class="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  🧠 AI analyzing document...
                </div>
                <div v-else-if="file.aiStatus === 'completed' && file.aiResult" class="text-xs text-green-600 mt-1">
                  ✨ AI classified as {{ file.aiResult }}
                </div>
                <div v-else-if="file.aiStatus === 'failed'" class="text-xs text-yellow-600 mt-1">
                  ⚠️ AI analysis failed, using filename classification
                </div>
                
                <!-- Progress bar -->
                <div v-if="file.status !== 'completed'" class="w-full bg-muted rounded-full h-2 mt-1">
                  <div 
                    class="h-2 rounded-full transition-all"
                    :class="{
                      'bg-green-500': file.status === 'completed',
                      'bg-red-500': file.status === 'error',
                      'bg-yellow-500': file.status === 'retrying',
                      'bg-primary': file.status === 'uploading'
                    }"
                    :style="{ width: `${file.progress}%` }"
                  />
                </div>
              </div>
              
              <!-- Progress percentage and retry button -->
              <div class="flex items-center space-x-2 flex-shrink-0">
                <div class="text-sm text-muted-foreground">
                  {{ file.status === 'completed' ? 'Done' : `${file.progress}%` }}
                </div>
                <Button 
                  v-if="file.status === 'error'" 
                  variant="ghost" 
                  size="sm" 
                  @click="retryUpload(file)"
                  class="text-xs px-2 py-1 h-6"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
          
          <!-- Overall progress summary -->
          <div class="mt-4 pt-3 border-t">
            <div class="flex justify-between text-sm">
              <span>{{ completedCount }}/{{ uploadingFiles.length }} files uploaded</span>
              <span v-if="hasErrors" class="text-red-500">{{ errorCount }} failed</span>
            </div>
          </div>
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
import { api } from "@/lib/api";
import { safeBase64Encode } from "@/lib/browser";
import { uploadFile as uploadFileToR2 } from "@/lib/chunked-upload";
import { handleError, networkStatus, withRetry } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth";
import {
	AlertCircleIcon,
	CheckCircleIcon,
	FileIcon,
	FolderIcon,
	RefreshCwIcon,
	UploadIcon,
	XIcon,
} from "lucide-vue-next";
import { onMounted, onUnmounted, ref } from "vue";
import { computed } from "vue";

interface Props {
	isOpen: boolean;
	currentPath: string;
	bucket: string;
}

interface UploadingFile {
	name: string;
	progress: number;
	file: File;
	status: "uploading" | "completed" | "error" | "retrying";
	error?: string;
	retryCount?: number;
	aiStatus?: "analyzing" | "completed" | "failed";
	aiResult?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	close: [];
	uploaded: [];
}>();

const authStore = useAuthStore();

const dropZone = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const folderInput = ref<HTMLInputElement>();
const isDragging = ref(false);
const uploadingFiles = ref<UploadingFile[]>([]);

const completedCount = computed(
	() => uploadingFiles.value.filter((f) => f.status === "completed").length,
);

const errorCount = computed(
	() => uploadingFiles.value.filter((f) => f.status === "error").length,
);

const hasErrors = computed(() => errorCount.value > 0);

function close() {
	emit("close");
}

function triggerFileInput() {
	fileInput.value?.click();
}

function triggerFolderInput() {
	folderInput.value?.click();
}

function handleFolderSelect(e: Event) {
	const target = e.target as HTMLInputElement;
	const files = Array.from(target.files || []);

	if (files.length > 0) {
		toast.info(`Selected ${files.length} files from folder structure`);
		uploadFiles(files);
	}
}

function handleDragOver(e: DragEvent) {
	e.preventDefault();
	isDragging.value = true;
}

function handleDragLeave(e: DragEvent) {
	e.preventDefault();
	// Only set to false if leaving the drop zone completely
	if (!dropZone.value?.contains(e.relatedTarget as Node)) {
		isDragging.value = false;
	}
}

async function handleDrop(e: DragEvent) {
	e.preventDefault();
	isDragging.value = false;

	const items = Array.from(e.dataTransfer?.items || []);
	const files: File[] = [];

	// Process both files and directories
	for (const item of items) {
		if (item.kind === "file") {
			const entry = item.webkitGetAsEntry();
			if (entry) {
				const entryFiles = await processEntry(entry);
				files.push(...entryFiles);
			} else {
				// Fallback for browsers that don't support webkitGetAsEntry
				const file = item.getAsFile();
				if (file) files.push(file);
			}
		}
	}

	if (files.length > 0) {
		toast.info(`Processing ${files.length} files from dropped items`);
		uploadFiles(files);
	}
}

// Helper function to recursively process directory entries
async function processEntry(entry: any): Promise<File[]> {
	return new Promise((resolve) => {
		const files: File[] = [];

		if (entry.isFile) {
			entry.file((file: File) => {
				// Preserve folder structure in file path
				const relativePath = entry.fullPath.startsWith("/")
					? entry.fullPath.slice(1)
					: entry.fullPath;

				// Add folder structure to file object for upload path
				Object.defineProperty(file, "webkitRelativePath", {
					value: relativePath,
					writable: false,
				});

				resolve([file]);
			});
		} else if (entry.isDirectory) {
			const dirReader = entry.createReader();

			function readEntries() {
				dirReader.readEntries(async (entries: any[]) => {
					if (entries.length === 0) {
						resolve(files);
						return;
					}

					for (const childEntry of entries) {
						const childFiles = await processEntry(childEntry);
						files.push(...childFiles);
					}

					// Continue reading (directories might have more entries)
					readEntries();
				});
			}

			readEntries();
		} else {
			resolve([]);
		}
	});
}

function handleFileSelect(e: Event) {
	const target = e.target as HTMLInputElement;
	const files = Array.from(target.files || []);
	uploadFiles(files);
}

async function uploadFiles(files: File[]) {
	if (files.length === 0) return;

	// Check network connection
	if (!networkStatus.isOnline) {
		toast.error("Cannot upload files while offline");
		return;
	}

	// Initialize upload tracking
	uploadingFiles.value = files.map((file) => ({
		name: file.name,
		progress: 0,
		file,
		status: "uploading" as const,
		retryCount: 0,
	}));

	// Upload files in parallel with error handling
	const uploadPromises = uploadingFiles.value.map((uploadFile) =>
		uploadSingleFile(uploadFile),
	);

	await Promise.allSettled(uploadPromises);

	// Show summary
	const completed = completedCount.value;
	const failed = errorCount.value;

	if (completed > 0 && failed === 0) {
		toast.success(
			`Successfully uploaded ${completed} file${completed === 1 ? "" : "s"}`,
		);
		emit("uploaded");

		// Auto-close after successful upload
		setTimeout(() => {
			uploadingFiles.value = [];
			emit("close");
		}, 1500);
	} else if (completed > 0 && failed > 0) {
		toast.warning(`Uploaded ${completed} files successfully, ${failed} failed`);
	} else if (failed > 0) {
		toast.error(`Failed to upload ${failed} file${failed === 1 ? "" : "s"}`);
	}
}

async function uploadSingleFile(uploadFile: UploadingFile) {
	const maxRetries = 3;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			if (attempt > 0) {
				uploadFile.status = "retrying";
				uploadFile.retryCount = attempt;
				uploadFile.progress = 0;
			}

			// Handle folder structure from webkitRelativePath or regular file name
			const relativePath =
				(uploadFile.file as any).webkitRelativePath || uploadFile.file.name;

			// SpendRule: Auto-categorize files for henryford_user (client-side fallback)
			let uploadPath = props.currentPath
				? `${props.currentPath}/${relativePath}`
				: relativePath;

			// First, do immediate filename-based categorization
			let documentType = "other";
			let aiSummary = "";
			let vendor = "";

			const filename = uploadFile.file.name.toLowerCase();

			if (
				["invoice", "inv", "bill", "statement", "payment"].some((keyword) =>
					filename.includes(keyword),
				)
			) {
				documentType = "invoices";
			} else if (
				["contract", "agreement", "msa", "sow", "terms"].some((keyword) =>
					filename.includes(keyword),
				)
			) {
				documentType = "contracts";
			} else if (
				["workflow", "process", "diagram", "flow", "procedure"].some(
					(keyword) => filename.includes(keyword),
				)
			) {
				documentType = "workflows";
			} else if (
				["report", "analysis", "summary", "analytics"].some((keyword) =>
					filename.includes(keyword),
				)
			) {
				documentType = "reports";
			} else if (
				["form", "application", "intake", "survey"].some((keyword) =>
					filename.includes(keyword),
				)
			) {
				documentType = "forms";
			}

			// Show initial filename-based classification
			uploadFile.aiResult = `${documentType} (filename)`;

			// Skip AI analysis for files over 25MB to avoid request size limits
			// Note: Base64 encoding adds 33% overhead, so 25MB becomes ~33MB
			const fileSizeMB = uploadFile.file.size / (1024 * 1024);
			const isAiEligible =
				fileSizeMB <= 25 &&
				(uploadFile.file.type === "application/pdf" ||
					uploadFile.file.type.startsWith("image/"));

			if (isAiEligible) {
				try {
					// Set AI analyzing status
					uploadFile.aiStatus = "analyzing";

					const { classifyDocumentWithAI } = await import(
						"@/lib/ai-classifier"
					);
					const aiResult = await classifyDocumentWithAI(
						uploadFile.file,
						uploadFile.file.name,
					);

					if (aiResult.confidence > 0.7) {
						// AI succeeded - update classification
						documentType = aiResult.category;
						aiSummary = aiResult.summary || "";
						vendor = aiResult.vendor || "";

						// Set AI completed status with result
						uploadFile.aiStatus = "completed";
						uploadFile.aiResult = aiResult.summary
							? `${documentType}: ${aiResult.summary}`
							: documentType;

						// Show AI classification success
						if (aiResult.summary) {
							toast.success(
								`✨ AI upgraded: ${documentType} - ${aiResult.summary}`,
							);
						} else {
							toast.success(
								`✨ AI confirmed as ${documentType}${vendor ? " from " + vendor : ""}`,
							);
						}
					} else {
						// AI lower confidence - keep filename classification
						uploadFile.aiStatus = "completed";
						uploadFile.aiResult = documentType;
					}
				} catch (error) {
					console.warn(
						"AI classification failed, keeping filename classification:",
						error,
					);
					// Set AI failed status but keep filename classification
					uploadFile.aiStatus = "failed";
					uploadFile.aiResult = `${documentType} (filename)`;
				}
			} else if (fileSizeMB > 25) {
				console.log(
					`Skipping AI classification for large file (${fileSizeMB.toFixed(1)}MB): ${uploadFile.file.name}`,
				);
				uploadFile.aiResult = `${documentType} (filename - file too large for AI)`;
			}

			// Always add health group and category structure
			// Include username for better admin organization: health_group/username/category/filename
			const categories = [
				"invoices",
				"contracts",
				"workflows",
				"reports",
				"forms",
				"other",
			];
			if (!categories.some((cat) => uploadPath.includes(`/${cat}/`))) {
				const username = authStore.user?.username || "unknown_user";
				// Map username to health group
				const healthGroupMapping: Record<string, string> = {
					henryford_user: "henry_ford",
					kettering_user: "kettering",
					osf_user: "osf",
					test_user: "test_group",
				};
				const healthGroup = healthGroupMapping[username] || "unknown_group";

				// Admin users don't need health group prefix
				if (username === "spendrule_admin") {
					uploadPath = `${documentType}/${uploadFile.file.name}`;
				} else {
					uploadPath = `${healthGroup}/${username}/${documentType}/${uploadFile.file.name}`;
				}
			}

			// Base64 encode the key as expected by the backend (Unicode-safe)
			const encodedKey = safeBase64Encode(uploadPath);

			// Use chunked upload helper which automatically handles files >100MB
			const response = await uploadFileToR2({
				bucket: props.bucket,
				key: encodedKey,
				file: uploadFile.file,
				onProgress: (progress) => {
					uploadFile.progress = progress.percentage;
				},
			});

			// Upload successful
			uploadFile.status = "completed";
			uploadFile.progress = 100;
			return;
		} catch (error: any) {
			console.error(
				`Upload attempt ${attempt + 1} failed for ${uploadFile.name}:`,
				error,
			);

			if (attempt === maxRetries - 1) {
				// Final attempt failed
				uploadFile.status = "error";
				uploadFile.error = error.response?.data?.error || "Upload failed";
				uploadFile.progress = 0;
			} else {
				// Wait before retrying
				await new Promise((resolve) =>
					setTimeout(resolve, 1000 * (attempt + 1)),
				);
			}
		}
	}
}

async function retryUpload(uploadFile: UploadingFile) {
	uploadFile.status = "uploading";
	uploadFile.error = undefined;
	uploadFile.retryCount = 0;
	uploadFile.progress = 0;

	await uploadSingleFile(uploadFile);
}

// Prevent default drag behaviors on window
function preventDefaults(e: DragEvent) {
	e.preventDefault();
	e.stopPropagation();
}

onMounted(() => {
	window.addEventListener("dragenter", preventDefaults);
	window.addEventListener("dragover", preventDefaults);
	window.addEventListener("dragleave", preventDefaults);
	window.addEventListener("drop", preventDefaults);
});

onUnmounted(() => {
	window.removeEventListener("dragenter", preventDefaults);
	window.removeEventListener("dragover", preventDefaults);
	window.removeEventListener("dragleave", preventDefaults);
	window.removeEventListener("drop", preventDefaults);
});
</script>