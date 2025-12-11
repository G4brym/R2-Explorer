<template>
  <Card v-if="showHint" class="m-6">
    <CardHeader class="bg-blue-50 dark:bg-blue-950">
      <div class="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
        <InfoIcon class="w-5 h-5" />
        <h3 class="text-lg font-semibold">SpendRule Auto-Organization</h3>
      </div>
    </CardHeader>
    
    <CardContent class="pt-4">
      <p class="text-sm text-muted-foreground mb-4">
        Files will be automatically organized based on type:
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <div class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-2">
            <FileTextIcon class="w-4 h-4 mr-1" />
            <span class="text-sm font-medium">Contracts</span>
          </div>
          <div class="text-xs text-muted-foreground">
            contract, agreement, msa, sow
          </div>
        </div>
        
        <div class="text-center">
          <div class="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 mb-2">
            <ReceiptIcon class="w-4 h-4 mr-1" />
            <span class="text-sm font-medium">Invoices</span>
          </div>
          <div class="text-xs text-muted-foreground">
            invoice, inv, bill, statement
          </div>
        </div>
        
        <div class="text-center">
          <div class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-2">
            <WorkflowIcon class="w-4 h-4 mr-1" />
            <span class="text-sm font-medium">Workflows</span>
          </div>
          <div class="text-xs text-muted-foreground">
            workflow, process, diagram, visio
          </div>
        </div>
      </div>
      
      <div class="mt-4 pt-4 border-t">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">
            Files are organized into health group folders automatically
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            @click="hideHint"
            class="text-muted-foreground hover:text-foreground"
          >
            <XIcon class="w-4 h-4 mr-1" />
            Hide
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import CardContent from "@/components/ui/CardContent.vue";
import CardHeader from "@/components/ui/CardHeader.vue";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/browser";
import { FileTextIcon, InfoIcon, XIcon } from "lucide-vue-next";
import { onMounted, ref } from "vue";

// Custom icons for SpendRule categories
const ReceiptIcon = FileTextIcon; // Using FileText as receipt icon
const WorkflowIcon = FileTextIcon; // Using FileText as workflow icon

const showHint = ref(true);

function hideHint() {
	showHint.value = false;
	// Store preference in localStorage (safe for private browsing)
	safeLocalStorageSet("spendrule-hide-category-hint", "true");
}

onMounted(() => {
	// Check if user has hidden the hint before (safe for private browsing)
	const hidePreference = safeLocalStorageGet("spendrule-hide-category-hint");
	if (hidePreference === "true") {
		showHint.value = false;
	}
});
</script>