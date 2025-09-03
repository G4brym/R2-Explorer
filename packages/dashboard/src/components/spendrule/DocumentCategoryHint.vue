<template>
  <q-card v-if="showHint" class="q-ma-md" flat bordered>
    <q-card-section class="bg-blue-1">
      <div class="text-subtitle2 text-blue-8">
        <q-icon name="info" class="q-mr-xs" />
        SpendRule Auto-Organization
      </div>
    </q-card-section>
    <q-card-section>
      <div class="text-body2 q-mb-sm">
        Files will be automatically organized based on type:
      </div>
      <div class="row q-gutter-md">
        <div class="col">
          <q-chip color="green" text-color="white" icon="description">
            Contracts
          </q-chip>
          <div class="text-caption q-mt-xs">
            contract, agreement, msa, sow
          </div>
        </div>
        <div class="col">
          <q-chip color="orange" text-color="white" icon="receipt">
            Invoices
          </q-chip>
          <div class="text-caption q-mt-xs">
            invoice, inv, bill, statement
          </div>
        </div>
        <div class="col">
          <q-chip color="purple" text-color="white" icon="account_tree">
            Workflows
          </q-chip>
          <div class="text-caption q-mt-xs">
            workflow, process, diagram, flow
          </div>
        </div>
        <div class="col">
          <q-chip color="grey" text-color="white" icon="folder">
            Other
          </q-chip>
          <div class="text-caption q-mt-xs">
            all other files
          </div>
        </div>
      </div>
      <div class="text-caption q-mt-md text-grey-6">
        <q-icon name="lightbulb" class="q-mr-xs" />
        Tip: You can create subfolders within each category to organize by vendor
      </div>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat dense @click="dismissHint" label="Got it" color="primary" />
    </q-card-actions>
  </q-card>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'DocumentCategoryHint',
  setup() {
    const showHint = ref(localStorage.getItem('spendrule-hint-dismissed') !== 'true')

    const dismissHint = () => {
      showHint.value = false
      localStorage.setItem('spendrule-hint-dismissed', 'true')
    }

    return {
      showHint,
      dismissHint
    }
  }
}
</script>