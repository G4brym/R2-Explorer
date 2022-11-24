<template>
  <div id="pdfvuer">
    <pdf
      :src="pdfdata"
      v-for="i in numPages"
      :key="i"
      :id="i"
      :page="i"
      v-model:scale="scale"
      style="width: 100%; margin: 20px auto"
      :annotation="true"
      :resize="true"
    >
      <template v-slot:loading> loading content here... </template>
    </pdf>
  </div>
</template>

<script>
import pdfvuer from 'pdfvuer'

export default {
  components: {
    pdf: pdfvuer
  },
  props: ['pdfUrl'],
  data () {
    return {
      page: 1,
      numPages: 0,
      pdfdata: undefined,
      errors: [],
      scale: 'page-width'
    }
  },
  mounted () {
    this.getPdf()
  },
  methods: {
    getPdf () {
      const self = this
      self.pdfdata = pdfvuer.createLoadingTask(this.pdfUrl)
      self.pdfdata.then((pdf) => {
        self.numPages = pdf.numPages
      })
    }
  }
}
</script>
<style lang="css" scoped>
/* Page content */
.content {
  padding: 16px;
}
</style>
