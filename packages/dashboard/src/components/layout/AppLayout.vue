<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b bg-card">
      <div class="flex h-16 items-center px-4">
        <div class="flex items-center space-x-4">
          <!-- Sidebar toggle -->
          <Button 
            variant="ghost" 
            size="icon"
            class="lg:hidden"
            @click="toggleSidebar"
          >
            <MenuIcon class="w-4 h-4" />
          </Button>
          
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <FolderIcon class="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 class="text-xl font-semibold">Explorer</h1>
          </div>
        </div>
        
        <!-- Breadcrumb (if available from route) -->
        <div class="hidden md:flex items-center space-x-2 text-sm text-muted-foreground ml-6">
          <template v-if="currentBucket">
            <ChevronRightIcon class="w-4 h-4" />
            <span class="font-medium">{{ currentBucket }}</span>
            <template v-if="currentPath">
              <ChevronRightIcon class="w-4 h-4" />
              <span>{{ currentPath }}</span>
            </template>
          </template>
        </div>
        
        <div class="ml-auto flex items-center space-x-4">
          <!-- Refresh button -->
          <Button 
            variant="ghost" 
            size="icon"
            title="Refresh (Ctrl+R)"
            @click="refreshCurrentView"
          >
            <RefreshCwIcon class="w-4 h-4" />
          </Button>
          
          <!-- Dark mode toggle -->
          <Button variant="ghost" size="icon" @click="toggleTheme">
            <SunIcon v-if="isDark" class="w-4 h-4" />
            <MoonIcon v-else class="w-4 h-4" />
          </Button>
          
          <!-- User menu (desktop only - mobile uses sidebar) -->
          <div class="hidden lg:flex items-center space-x-2">
            <span class="text-sm text-muted-foreground">{{ authStore.user?.username }}</span>
            <Button variant="ghost" size="icon" @click="handleLogout">
              <LogOutIcon class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
    
    <div class="flex h-[calc(100vh-4rem)]">
      <!-- Sidebar -->
      <aside 
        class="w-64 border-r bg-card transition-all duration-300"
        :class="{ 
          '-ml-64 lg:ml-0': !showSidebar,
          'ml-0': showSidebar
        }"
      >
        <div class="p-4">
          <!-- User Section -->
          <div class="mb-6 pb-4 border-b">
            <div class="flex items-center space-x-3 mb-3">
              <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span class="text-primary-foreground text-sm font-medium">
                  {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ authStore.user?.username }}</div>
                <div class="text-xs text-muted-foreground">Authenticated</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              class="w-full justify-start"
              @click="handleLogout"
            >
              <LogOutIcon class="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          
          <!-- Quick Actions -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
            <div class="space-y-1">
              <Button 
                variant="ghost" 
                class="w-full justify-start"
                @click="triggerUpload"
              >
                <UploadIcon class="w-4 h-4 mr-3" />
                Upload Files
              </Button>
              <Button 
                variant="ghost" 
                class="w-full justify-start"
                @click="triggerCreateFolder"
              >
                <FolderPlusIcon class="w-4 h-4 mr-3" />
                New Folder
              </Button>
              <Button 
                variant="ghost" 
                class="w-full justify-start"
                @click="refreshCurrentView"
              >
                <RefreshCwIcon class="w-4 h-4 mr-3" />
                Refresh
              </Button>
            </div>
          </div>
          
          <!-- Statistics -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-muted-foreground mb-3">Current Folder</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Files:</span>
                <span>{{ folderStats.files }}</span>
              </div>
              <div class="flex justify-between">
                <span>Folders:</span>
                <span>{{ folderStats.folders }}</span>
              </div>
              <div v-if="folderStats.totalSize" class="flex justify-between">
                <span>Total Size:</span>
                <span>{{ folderStats.totalSize }}</span>
              </div>
            </div>
          </div>
          
          <!-- SpendRule Info -->
          <div class="border rounded-lg p-3 bg-muted/50">
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-2 h-2 bg-green-500 rounded-full" />
              <span class="text-xs font-medium">SpendRule Active</span>
            </div>
            <p class="text-xs text-muted-foreground">
              Documents will be automatically categorized and organized for workflow processing.
            </p>
          </div>
        </div>
      </aside>
      
      <!-- Main content -->
      <main class="flex-1 overflow-hidden">
        <router-view 
          @update-stats="updateFolderStats"
          @upload="$emit('upload')"
          @create-folder="$emit('createFolder')"
        />
      </main>
    </div>
    
    <!-- Mobile sidebar overlay -->
    <div 
      v-if="showSidebar && !isDesktop"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="closeSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/browser";
import { formatBytes } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
	ChevronRightIcon,
	FolderIcon,
	FolderPlusIcon,
	LogOutIcon,
	MenuIcon,
	MoonIcon,
	RefreshCwIcon,
	SunIcon,
	UploadIcon,
} from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isDark = ref(false);
const showSidebar = ref(true);
const isDesktop = ref(true);

const folderStats = ref({
	files: 0,
	folders: 0,
	totalSize: "",
});

const currentBucket = computed(() => route.params.bucket as string);
const currentPath = computed(() => {
	const pathMatch = route.params.pathMatch as string;
	return pathMatch ? decodeURIComponent(pathMatch) : "";
});

function toggleTheme() {
	isDark.value = !isDark.value;
	if (isDark.value) {
		document.documentElement.classList.add("dark");
		safeLocalStorageSet("theme", "dark");
	} else {
		document.documentElement.classList.remove("dark");
		safeLocalStorageSet("theme", "light");
	}
}

function toggleSidebar() {
	showSidebar.value = !showSidebar.value;
}

function closeSidebar() {
	if (!isDesktop.value) {
		showSidebar.value = false;
	}
}

function refreshCurrentView() {
	// Emit event to refresh current view
	window.dispatchEvent(new Event("refresh-view"));
}

function triggerUpload() {
	// Dispatch global event to trigger upload dialog
	window.dispatchEvent(new Event("trigger-upload"));
}

function triggerCreateFolder() {
	// Dispatch global event to trigger create folder dialog
	window.dispatchEvent(new Event("trigger-create-folder"));
}

function updateFolderStats(stats: {
	files: number;
	folders: number;
	totalSize?: string;
}) {
	folderStats.value = stats;
}

function handleResize() {
	isDesktop.value = window.innerWidth >= 1024;
	if (isDesktop.value) {
		showSidebar.value = true;
	}
}

async function handleLogout() {
	await authStore.logout(router);
}

onMounted(() => {
	// Initialize theme (safe for private browsing)
	const savedTheme = safeLocalStorageGet("theme");
	const systemPrefersDark =
		window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;

	isDark.value = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

	if (isDark.value) {
		document.documentElement.classList.add("dark");
	}

	// Initialize responsive behavior
	handleResize();
	window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
});

// Define emits
defineEmits<{
	upload: [];
	createFolder: [];
}>();
</script>