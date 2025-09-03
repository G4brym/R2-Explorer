<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">File Upload Status</div>
      </q-card-section>

      <q-card-section>
        <div v-if="uploadStatus === 'categorizing'" class="text-center">
          <q-spinner-pie color="primary" size="3em" class="q-mb-md" />
          <div class="text-body1">Analyzing document type...</div>
          <div class="text-caption q-mt-sm">{{ fileName }}</div>
        </div>

        <div v-else-if="uploadStatus === 'suggestion'" class="q-gutter-md">
          <q-banner class="bg-blue-1 text-blue-8" rounded>
            <q-icon slot="avatar" name="info" color="blue" />
            <div class="text-subtitle2">Auto-Organization Suggestion</div>
          </q-banner>
          
          <div class="text-body2">
            Based on the filename, this document should be placed in:
          </div>
          
          <q-card class="bg-grey-1" flat>
            <q-card-section>
              <div class="row items-center q-gutter-sm">
                <q-chip 
                  :color="getCategoryColor(suggestedCategory)"
                  text-color="white"
                  :icon="getCategoryIcon(suggestedCategory)"
                >
                  {{ suggestedCategory }}
                </q-chip>
                <q-icon name="arrow_forward" />
                <code class="text-body2">{{ suggestedPath }}</code>
              </div>
            </q-card-section>
          </q-card>

          <div class="text-caption text-grey-6">
            Original path: {{ originalPath }}
          </div>
        </div>

        <div v-else-if="uploadStatus === 'uploading'" class="text-center">
          <q-linear-progress 
            :value="uploadProgress" 
            color="primary" 
            size="8px" 
            class="q-mb-md" 
          />
          <div class="text-body1">Uploading to {{ finalPath }}</div>
          <div class="text-caption">{{ Math.round(uploadProgress * 100) }}% complete</div>
        </div>

        <div v-else-if="uploadStatus === 'success'" class="text-center">
          <q-icon name="check_circle" color="green" size="3em" class="q-mb-md" />
          <div class="text-body1 text-green">Upload successful!</div>
          <div class="text-caption q-mt-sm">File saved to: {{ finalPath }}</div>
        </div>

        <div v-else-if="uploadStatus === 'error'" class="text-center">
          <q-icon name="error" color="red" size="3em" class="q-mb-md" />
          <div class="text-body1 text-red">Upload failed</div>
          <div class="text-caption q-mt-sm">{{ errorMessage }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn 
          v-if="uploadStatus === 'suggestion'"
          flat 
          label="Upload to Original Location" 
          color="grey-7"
          @click="uploadToOriginal"
        />
        <q-btn 
          v-if="uploadStatus === 'suggestion'"
          unelevated
          label="Upload to Suggested Location" 
          color="primary"
          @click="uploadToSuggested"
        />
        <q-btn 
          v-if="uploadStatus === 'success' || uploadStatus === 'error'"
          flat 
          label="Close" 
          color="primary"
          @click="closeDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'SpendRuleUploadStatus',
  props: {
    modelValue: Boolean,
    fileName: String,
    originalPath: String,
    suggestedPath: String,
    suggestedCategory: String,
    uploadProgress: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: 'categorizing' // categorizing, suggestion, uploading, success, error
    },
    errorMessage: String
  },
  emits: ['update:modelValue', 'upload-to-original', 'upload-to-suggested', 'close'],
  setup(props, { emit }) {
    const showDialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const uploadStatus = computed(() => props.status)
    const finalPath = ref('')

    const getCategoryColor = (category) => {
      const colors = {
        contracts: 'green',
        invoices: 'orange', 
        workflows: 'purple',
        other: 'grey'
      }
      return colors[category] || 'grey'
    }

    const getCategoryIcon = (category) => {
      const icons = {
        contracts: 'description',
        invoices: 'receipt',
        workflows: 'account_tree',
        other: 'folder'
      }
      return icons[category] || 'folder'
    }

    const uploadToOriginal = () => {
      finalPath.value = props.originalPath
      emit('upload-to-original')
    }

    const uploadToSuggested = () => {
      finalPath.value = props.suggestedPath
      emit('upload-to-suggested')
    }

    const closeDialog = () => {
      emit('close')
    }

    return {
      showDialog,
      uploadStatus,
      finalPath,
      getCategoryColor,
      getCategoryIcon,
      uploadToOriginal,
      uploadToSuggested,
      closeDialog
    }
  }
}
</script>