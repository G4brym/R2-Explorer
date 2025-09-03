<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
      <CardHeader class="flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <component :is="getFileIcon(file?.name)" class="w-5 h-5" />
            <h2 class="text-xl font-semibold truncate">{{ file?.name }}</h2>
          </div>
          <div class="flex items-center space-x-2">
            <Button variant="outline" size="sm" @click="downloadFile">
              <DownloadIcon class="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="icon" @click="close">
              <XIcon class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent class="flex-1 overflow-auto p-0">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center h-64">
          <LoaderIcon class="w-8 h-8 animate-spin" />
          <span class="ml-2">Loading preview...</span>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="flex flex-col items-center justify-center h-64 p-6">
          <AlertCircleIcon class="w-12 h-12 text-destructive mb-4" />
          <h3 class="text-lg font-semibold mb-2">Preview not available</h3>
          <p class="text-muted-foreground text-center mb-4">{{ error }}</p>
          <Button @click="downloadFile">
            <DownloadIcon class="w-4 h-4 mr-2" />
            Download file instead
          </Button>
        </div>
        
        <!-- Image Preview -->
        <div v-else-if="isImage" class="p-6">
          <img 
            :src="previewUrl" 
            :alt="file?.name"
            class="max-w-full max-h-full mx-auto rounded-lg shadow-lg"
            @load="loading = false"
            @error="handlePreviewError"
          />
        </div>
        
        <!-- PDF Preview -->
        <div v-else-if="isPdf" class="h-full">
          <iframe
            :src="previewUrl"
            class="w-full h-full border-0"
            @load="loading = false"
            @error="handlePreviewError"
          />
        </div>
        
        <!-- Text File Preview -->
        <div v-else-if="isText" class="p-6">
          <pre class="bg-muted p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">{{ textContent }}</pre>
        </div>
        
        <!-- Unsupported File Type -->
        <div v-else class="flex flex-col items-center justify-center h-64 p-6">
          <FileIcon class="w-12 h-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">Preview not supported</h3>
          <p class="text-muted-foreground text-center mb-4">
            Preview is not available for {{ getFileExtension(file?.name) }} files
          </p>
          <Button @click="downloadFile">
            <DownloadIcon class="w-4 h-4 mr-2" />
            Download file
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { 
  XIcon, 
  DownloadIcon, 
  LoaderIcon, 
  AlertCircleIcon, 
  FileIcon, 
  FileTextIcon, 
  ImageIcon 
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'

interface FileItem {
  name: string
  key: string
  size?: number
  lastModified?: string
}

interface Props {
  isOpen: boolean
  file: FileItem | null
  bucket: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref('')
const textContent = ref('')
const blobUrl = ref('')

const previewUrl = computed(() => {
  // For images and PDFs, we'll use a blob URL after fetching with auth
  if (blobUrl.value) return blobUrl.value
  
  // Fallback for direct URL (won't work without auth)
  if (!props.file) return ''
  return `${api.defaults.baseURL}/buckets/${props.bucket}/${encodeURIComponent(props.file.key)}`
})

const isImage = computed(() => {
  if (!props.file) return false
  const ext = getFileExtension(props.file.name).toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)
})

const isPdf = computed(() => {
  if (!props.file) return false
  return getFileExtension(props.file.name).toLowerCase() === 'pdf'
})

const isText = computed(() => {
  if (!props.file) return false
  const ext = getFileExtension(props.file.name).toLowerCase()
  return ['txt', 'md', 'json', 'csv', 'xml', 'yaml', 'yml', 'log'].includes(ext)
})

function getFileExtension(filename: string) {
  return filename.split('.').pop() || ''
}

function getFileIcon(filename: string) {
  if (!filename) return FileIcon
  
  const ext = getFileExtension(filename).toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
    return ImageIcon
  }
  if (['txt', 'md', 'json', 'csv', 'xml', 'yaml', 'yml', 'log'].includes(ext)) {
    return FileTextIcon
  }
  return FileIcon
}

function close() {
  emit('close')
  reset()
}

function reset() {
  loading.value = false
  error.value = ''
  textContent.value = ''
  
  // Clean up blob URL if exists
  if (blobUrl.value) {
    window.URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = ''
  }
}

async function downloadFile() {
  if (!props.file) return
  
  try {
    // Encode the key with base64 as required by backend
    const encodedKey = btoa(props.file.key)
    
    // Fetch the file with authentication
    const response = await api.get(`/buckets/${props.bucket}/${encodeURIComponent(encodedKey)}`, {
      responseType: 'blob'
    })
    
    // Create a blob URL and download
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = props.file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    toast.error('Failed to download file')
  }
}

function handlePreviewError() {
  loading.value = false
  error.value = 'Failed to load preview'
}

async function loadFileContent() {
  if (!props.file) return
  
  loading.value = true
  error.value = ''
  
  try {
    // For text files, fetch as text
    if (isText.value) {
      const encodedKey = btoa(props.file.key)
      const response = await api.get(`/buckets/${props.bucket}/${encodeURIComponent(encodedKey)}`, {
        responseType: 'text'
      })
      textContent.value = response.data
    } 
    // For images and PDFs, fetch as blob and create object URL
    else if (isImage.value || isPdf.value) {
      const encodedKey = btoa(props.file.key)
      const response = await api.get(`/buckets/${props.bucket}/${encodeURIComponent(encodedKey)}`, {
        responseType: 'blob'
      })
      
      // Clean up old blob URL if exists
      if (blobUrl.value) {
        window.URL.revokeObjectURL(blobUrl.value)
      }
      
      // Create new blob URL for preview
      blobUrl.value = window.URL.createObjectURL(response.data)
    }
  } catch (e: any) {
    error.value = e.response?.status === 404 
      ? 'File not found' 
      : 'Failed to load file content'
    console.error('Failed to load file content:', e)
  } finally {
    loading.value = false
  }
}

// Load preview when file changes
watch(() => props.file, (newFile) => {
  if (newFile && props.isOpen) {
    reset()
    loadFileContent()
  }
}, { immediate: true })

// Reset when dialog closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    reset()
  }
})
</script>