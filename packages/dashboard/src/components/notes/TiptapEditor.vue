<template>
  <editor-content :editor="editor" class="tiptap-editor" />
</template>

<script>
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { defineComponent, onBeforeUnmount, watch } from "vue";

export default defineComponent({
	name: "TiptapEditor",
	components: {
		EditorContent,
	},
	props: {
		modelValue: {
			type: String,
			default: "",
		},
		editable: {
			type: Boolean,
			default: true,
		},
	},
	emits: ["update:modelValue"],
	setup(props, { emit }) {
		const editor = useEditor({
			content: props.modelValue,
			editable: props.editable,
			extensions: [
				StarterKit,
				Placeholder.configure({
					placeholder: "Start writing...",
				}),
				Typography,
			],
			onUpdate: ({ editor }) => {
				emit("update:modelValue", editor.getHTML());
			},
		});

		watch(
			() => props.modelValue,
			(value) => {
				if (editor.value && editor.value.getHTML() !== value) {
					editor.value.commands.setContent(value, false);
				}
			},
		);

		watch(
			() => props.editable,
			(value) => {
				if (editor.value) {
					editor.value.setEditable(value);
				}
			},
		);

		onBeforeUnmount(() => {
			if (editor.value) {
				editor.value.destroy();
			}
		});

		return {
			editor,
		};
	},
});
</script>

<style>
.tiptap-editor {
  min-height: 300px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 12px;
}

.tiptap-editor .ProseMirror {
  outline: none;
  min-height: 280px;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap-editor .ProseMirror h1 {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
}

.tiptap-editor .ProseMirror h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.75em 0;
}

.tiptap-editor .ProseMirror h3 {
  font-size: 1.17em;
  font-weight: bold;
  margin: 0.83em 0;
}

.tiptap-editor .ProseMirror ul,
.tiptap-editor .ProseMirror ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.tiptap-editor .ProseMirror li {
  margin: 0.25em 0;
}

.tiptap-editor .ProseMirror code {
  background-color: #f4f4f4;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-family: monospace;
}

.tiptap-editor .ProseMirror pre {
  background-color: #f4f4f4;
  border-radius: 4px;
  padding: 0.75em 1em;
  overflow-x: auto;
}

.tiptap-editor .ProseMirror pre code {
  background: none;
  padding: 0;
}

.tiptap-editor .ProseMirror blockquote {
  border-left: 3px solid #ccc;
  margin: 0.5em 0;
  padding-left: 1em;
  color: #666;
}

.tiptap-editor .ProseMirror hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 1em 0;
}

.tiptap-editor .ProseMirror strong {
  font-weight: bold;
}

.tiptap-editor .ProseMirror em {
  font-style: italic;
}
</style>
