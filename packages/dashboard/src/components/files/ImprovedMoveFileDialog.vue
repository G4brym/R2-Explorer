<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>
    
    <!-- Modal Container - ensures centering -->
    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
      <Card class="relative w-full max-w-2xl transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8">
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">Move {{ isMultiple ? 'Items' : 'Item' }}</h2>
            <p class="text-sm text-muted-foreground mt-1">
              {{ isMultiple ? `Moving ${items.length} items` : `Moving: ${itemName}` }}
            </p>
          </div>
          <Button variant="ghost" size="icon" @click="handleClose">
            <XIcon class="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent class="space-y-4 max-h-[60vh] overflow-y-auto">
        <!-- Current Location Badge -->
        <div class="flex items-center gap-2">
          <Badge variant="outline" class="text-xs">
            <FolderIcon class="h-3 w-3 mr-1" />
            Current: {{ currentPath || 'Root' }}
          </Badge>
        </div>
        
        <!-- Search/Filter Input -->
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchTerm"
            placeholder="Search folders..."
            class="pl-10"
          />
        </div>
        
        <!-- Folder Tree with Responsive Height -->
        <div class="border rounded-lg">
          <div class="p-3 border-b bg-muted/30">
            <h4 class="text-sm font-medium">Select Destination</h4>
          </div>
          
          <div class="max-h-48 sm:max-h-56 lg:max-h-64 xl:max-h-72 overflow-y-auto">
            <!-- Root Folder -->
            <div 
              @click="selectedFolder = ''"
              :class="[
                'flex items-center gap-3 px-3 py-2 cursor-pointer border-b hover:bg-accent/50 transition-colors',
                selectedFolder === '' ? 'bg-primary/10 border-primary/20' : ''
              ]"
            >
              <HomeIcon class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm">Root ({{ bucket }})</span>
              <Badge v-if="selectedFolder === ''" variant="default" class="ml-auto text-xs">Selected</Badge>
            </div>
            
            <!-- Health Group Folder -->
            <div 
              v-if="userHealthGroup && userHealthGroup !== 'admin'"
              @click="selectedFolder = userHealthGroup"
              :class="[
                'flex items-center gap-3 px-6 py-2 cursor-pointer border-b hover:bg-accent/50 transition-colors',
                selectedFolder === userHealthGroup ? 'bg-primary/10 border-primary/20' : ''
              ]"
            >
              <BuildingIcon class="h-4 w-4 text-blue-500" />
              <span class="text-sm font-medium">{{ userHealthGroup }}</span>
              <Badge v-if="selectedFolder === userHealthGroup" variant="default" class="ml-auto text-xs">Selected</Badge>
            </div>
            
            <!-- Category Folders with Icons -->
            <div 
              v-for="category in filteredCategoryFolders"
              :key="category.path"
              @click="selectedFolder = category.path"
              :class="[
                'flex items-center gap-3 px-8 py-2 cursor-pointer border-b hover:bg-accent/50 transition-colors',
                selectedFolder === category.path ? 'bg-primary/10 border-primary/20' : ''
              ]"
            >
              <component :is="category.icon" class="h-4 w-4" :class="category.iconColor" />
              <span class="text-sm">{{ category.name }}</span>
              <Badge 
                :variant="category.variant" 
                class="text-xs"
              >
                {{ category.badge }}
              </Badge>
              <Badge v-if="selectedFolder === category.path" variant="default" class="ml-auto text-xs">Selected</Badge>
            </div>
            
            <!-- Loading Indicator -->
            <div v-if="loadingFolders" class="flex items-center justify-center py-4">
              <LoaderIcon class="h-4 w-4 animate-spin mr-2" />
              <span class="text-sm text-muted-foreground">Loading folders...</span>
            </div>
            
            <!-- Custom Folders -->
            <div 
              v-for="folder in filteredAvailableFolders"
              :key="folder.path"
              @click="selectedFolder = folder.path"
              :class="[
                'flex items-center gap-3 cursor-pointer border-b hover:bg-accent/50 transition-colors',
                selectedFolder === folder.path ? 'bg-primary/10 border-primary/20' : '',
                `px-${8 + (folder.depth * 4)} py-2`
              ]"
            >
              <FolderIcon class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm">{{ folder.name }}</span>
              <Badge v-if="selectedFolder === folder.path" variant="default" class="ml-auto text-xs">Selected</Badge>
            </div>
            
            <!-- No Results -->
            <div v-if="filteredCategoryFolders.length === 0 && filteredAvailableFolders.length === 0 && !loadingFolders" 
                 class="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <SearchXIcon class="h-4 w-4 mr-2" />
              No folders found
            </div>
          </div>
        </div>
        
        <!-- Manual Path Input with Collapsible -->
        <Collapsible>
          <CollapsibleTrigger class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronRightIcon class="h-4 w-4" />
            Advanced: Enter path manually
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2">
            <Input 
              v-model="selectedFolder" 
              placeholder="e.g. henry_ford/contracts/vendor_name"
              class="font-mono text-sm"
            />
          </CollapsibleContent>
        </Collapsible>
        
        <!-- Destination Preview -->
        <Alert>
          <InfoIcon class="h-4 w-4" />
          <AlertDescription>
            <strong>Destination:</strong> 
            {{ destinationHint }}
          </AlertDescription>
        </Alert>
      </CardContent>
      
      <div class="flex items-center justify-between p-6 border-t bg-muted/30">
        <div class="text-sm text-muted-foreground">
          {{ canMove ? 'Ready to move' : 'Select a different destination' }}
        </div>
        
        <div class="flex gap-2">
          <Button variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button 
            @click="handleMove" 
            :disabled="!canMove || loading"
            class="min-w-[100px]"
          >
            <LoaderIcon v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
            <MoveIcon v-else class="h-4 w-4 mr-2" />
            {{ loading ? 'Moving...' : 'Move' }}
          </Button>
        </div>
      </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Alert from "@/components/ui/Alert.vue";
import AlertDescription from "@/components/ui/AlertDescription.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import CardContent from "@/components/ui/CardContent.vue";
import CardHeader from "@/components/ui/CardHeader.vue";
import Input from "@/components/ui/Input.vue";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth";
import {
	ArchiveIcon,
	BarChartIcon,
	BuildingIcon,
	ChevronRightIcon,
	ClipboardIcon,
	CreditCardIcon,
	FileTextIcon,
	FolderIcon,
	HomeIcon,
	InfoIcon,
	LoaderIcon,
	MoveIcon,
	SearchIcon,
	SearchXIcon,
	GitBranchIcon as WorkflowIcon,
	XIcon,
} from "lucide-vue-next";
import {
	CollapsibleRoot as Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "radix-vue";
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
const searchTerm = ref("");
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

// Enhanced category folders with better UI
const categoryFolders = computed(() => [
	{
		name: "contracts",
		path: getFullPath("contracts"),
		icon: FileTextIcon,
		iconColor: "text-green-600",
		badge: "Legal",
		variant: "secondary" as const,
	},
	{
		name: "invoices",
		path: getFullPath("invoices"),
		icon: CreditCardIcon,
		iconColor: "text-blue-600",
		badge: "Finance",
		variant: "secondary" as const,
	},
	{
		name: "workflows",
		path: getFullPath("workflows"),
		icon: WorkflowIcon,
		iconColor: "text-purple-600",
		badge: "Process",
		variant: "secondary" as const,
	},
	{
		name: "reports",
		path: getFullPath("reports"),
		icon: BarChartIcon,
		iconColor: "text-orange-600",
		badge: "Analysis",
		variant: "secondary" as const,
	},
	{
		name: "forms",
		path: getFullPath("forms"),
		icon: ClipboardIcon,
		iconColor: "text-indigo-600",
		badge: "Data",
		variant: "secondary" as const,
	},
	{
		name: "other",
		path: getFullPath("other"),
		icon: ArchiveIcon,
		iconColor: "text-gray-600",
		badge: "Misc",
		variant: "outline" as const,
	},
]);

const filteredCategoryFolders = computed(() => {
	if (!searchTerm.value) return categoryFolders.value;
	return categoryFolders.value.filter((folder) =>
		folder.name.toLowerCase().includes(searchTerm.value.toLowerCase()),
	);
});

const filteredAvailableFolders = computed(() => {
	if (!searchTerm.value) return availableFolders.value;
	return availableFolders.value.filter(
		(folder) =>
			folder.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
			folder.path.toLowerCase().includes(searchTerm.value.toLowerCase()),
	);
});

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
				const categoryNames = categoryFolders.value.map((c) => c.name);
				if (!categoryNames.includes(name)) {
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
				? `Successfully moved ${props.items.length} items to ${selectedFolder.value || "root"}`
				: `Successfully moved ${itemName.value} to ${selectedFolder.value || "root"}`,
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
	searchTerm.value = "";
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