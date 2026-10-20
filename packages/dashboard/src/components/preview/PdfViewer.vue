<template>
  <div ref="container">
    <div v-if="loading" class="text-center q-my-lg">loading content here...</div>
    <div v-if="loadError" class="pdf-error text-negative text-center q-my-lg">
      Failed to load PDF preview.
    </div>
    <vue-pdf-embed
      v-if="containerWidth > 0"
      :source="pdfUrl"
      :width="containerWidth"
      text-layer
      annotation-layer
      @loaded="onLoaded"
      @rendered="onRendered"
      @loading-failed="onLoadingFailed"
      @rendering-failed="onRenderingFailed"
    />
  </div>
</template>

<script>
import VuePdfEmbed from "vue-pdf-embed";
import "vue-pdf-embed/dist/styles/annotationLayer.css";
import "vue-pdf-embed/dist/styles/textLayer.css";

export default {
	components: {
		VuePdfEmbed,
	},
	props: ["pdfUrl"],
	data() {
		return {
			containerWidth: 0,
			loading: true,
			loadError: false,
			resizeObserver: null,
		};
	},
	mounted() {
		this.updateWidth();
		this.resizeObserver = new ResizeObserver(() => {
			this.updateWidth();
		});
		this.resizeObserver.observe(this.$refs.container);
	},
	beforeUnmount() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
	},
	methods: {
		updateWidth() {
			const width = this.$refs.container?.clientWidth ?? 0;
			if (width > 0 && width !== this.containerWidth) {
				this.containerWidth = width;
			}
		},
		onLoaded() {
			this.loading = false;
		},
		onRendered() {
			this.loading = false;
		},
		onLoadingFailed(error) {
			this.loading = false;
			this.loadError = true;
			this.$emit("error", error);
		},
		onRenderingFailed(error) {
			this.loading = false;
			this.loadError = true;
			this.$emit("error", error);
		},
	},
};
</script>
<style lang="css" scoped>
/* Page content */
.content {
  padding: 16px;
}
</style>
