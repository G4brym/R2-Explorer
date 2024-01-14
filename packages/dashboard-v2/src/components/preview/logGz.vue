<template>
  <template v-if="data">
    <pre v-for="(item, index) in data" :key="index" v-html="item"/>
  </template>
</template>

<script>
import * as fflate from "fflate";

export default {
  props: ['filedata'],
  data: function () {
    return {
      data: null
    }
  },
  mounted() {
    const parsedData = new Uint8Array(this.filedata);
    const decompressed = fflate.decompressSync(parsedData);

    const origText = fflate.strFromU8(decompressed);

    this.data = origText.split('\n').map(val => {
      try {
        return JSON.stringify(JSON.parse(val), null, 2)
      } catch (e) {
        return val
      }
    })
  }
}
</script>
