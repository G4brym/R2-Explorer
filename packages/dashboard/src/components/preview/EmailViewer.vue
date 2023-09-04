<template>
  <div>
    <div v-if="emailData.sender">
      <strong>Sender:</strong> {{ emailData.sender }}
    </div>
    <div v-if="emailData.receiver">
      <strong>Receiver:</strong> {{ emailData.receiver }}
    </div>
    <div v-if="emailData.content">
      <strong>Content:</strong>
      <div v-html="emailData.content"></div>
    </div>
  </div>
</template>

<script>
const PostalMime = require('postal-mime');

export default {
  props: ['filedata'],
  data: function () {
    return {
      emailData: null
    }
  },
  methods: {
    async parseEmail() {
      try {
        const parser = new PostalMime.default();
        const parsedEmailData = await parser.parse(this.filedata);

        // Extract sender, receiver, and content
        const sender = parsedEmailData.from?.address;
        const receiver = parsedEmailData.to?.address;
        const content = parsedEmailData.text;

        this.emailData = {
          sender,
          receiver,
          content,
        };
      } catch (error) {
        console.error('Error parsing email data:', error);
      }
    }
  },
  mounted() {
    this.parseEmail();
  }
}
</script>
