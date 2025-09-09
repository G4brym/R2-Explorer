<template>
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t bg-card">
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
      <div class="text-sm text-muted-foreground">
        <span class="hidden sm:inline">Showing </span>{{ startItem }}-{{ endItem }} <span class="hidden sm:inline">of {{ totalItems }} items</span><span class="sm:hidden">/{{ totalItems }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <label class="text-sm text-muted-foreground hidden lg:inline">Items per page:</label>
        <select 
          v-model="selectedPageSize" 
          @change="handlePageSizeChange"
          class="px-2 py-1 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
          <option :value="200">200</option>
        </select>
      </div>
    </div>
    
    <div class="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm"
        :disabled="!hasPrevious"
        @click="$emit('previous')"
      >
        <ChevronLeftIcon class="w-4 h-4 sm:mr-1" />
        <span class="hidden sm:inline">Previous</span>
      </Button>
      
      <div class="flex items-center space-x-1">
        <span class="px-3 py-1 text-sm">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
      </div>
      
      <Button 
        variant="outline" 
        size="sm"
        :disabled="!hasNext"
        @click="$emit('next')"
      >
        <span class="hidden sm:inline">Next</span>
        <ChevronRightIcon class="w-4 h-4 sm:ml-1" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import Button from "./Button.vue";

const props = defineProps<{
	currentPage: number;
	pageSize: number;
	totalItems: number;
	hasNext: boolean;
	hasPrevious: boolean;
}>();

const emit = defineEmits<{
	"update:pageSize": [size: number];
	next: [];
	previous: [];
}>();

const selectedPageSize = ref(props.pageSize);

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize));

const startItem = computed(() =>
	props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1,
);

const endItem = computed(() =>
	Math.min(props.currentPage * props.pageSize, props.totalItems),
);

watch(
	() => props.pageSize,
	(newSize) => {
		selectedPageSize.value = newSize;
	},
);

function handlePageSizeChange() {
	emit("update:pageSize", selectedPageSize.value);
}
</script>