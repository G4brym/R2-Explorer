<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Create New Folder</h2>
          <Button variant="ghost" size="icon" @click="close">
            <XIcon class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form @submit.prevent="createFolder" class="space-y-4">
          <div class="space-y-2">
            <label for="folderName" class="text-sm font-medium">Folder Name</label>
            <Input
              id="folderName"
              v-model="folderName"
              placeholder="Enter folder name"
              required
              :disabled="loading"
              class="w-full"
            />
          </div>
          
          <div class="flex justify-end space-x-2">
            <Button variant="outline" type="button" @click="close" :disabled="loading">
              Cancel
            </Button>
            <Button type="submit" :disabled="loading">
              <LoaderIcon v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
              Create Folder
            </Button>
          </div>
          
          <div v-if="error" class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {{ error }}
          </div>
        </form>
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
import { LoaderIcon, XIcon } from "lucide-vue-next";
import { ref, watch } from "vue";

interface Props {
	isOpen: boolean;
	currentPath: string;
	bucket: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	close: [];
	created: [];
}>();

const folderName = ref("");
const loading = ref(false);
const error = ref("");

function close() {
	emit("close");
	reset();
}

function reset() {
	folderName.value = "";
	loading.value = false;
	error.value = "";
}

async function createFolder() {
	if (!folderName.value.trim()) return;

	loading.value = true;
	error.value = "";

	try {
		const folderPath = props.currentPath
			? `${props.currentPath}/${folderName.value.trim()}/`
			: `${folderName.value.trim()}/`;

		await api.post(`/buckets/${props.bucket}/folder`, {
			// Worker expects base64-encoded key (Unicode-safe)
			key: safeBase64Encode(folderPath),
		});

		console.log(`Created folder: ${folderPath}`);
		emit("created");
		close();
	} catch (e: any) {
		error.value = e.response?.data?.error || "Failed to create folder";
		console.error("Failed to create folder:", e);
	} finally {
		loading.value = false;
	}
}

// Reset form when dialog opens
watch(
	() => props.isOpen,
	(isOpen) => {
		if (isOpen) {
			reset();
		}
	},
);
</script>
