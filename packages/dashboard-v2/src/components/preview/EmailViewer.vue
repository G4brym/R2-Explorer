<template>
  <template v-if="emailData">

    <h5 class="font-18">{{ emailData.subject }}</h5>

    <hr/>

    <div class="d-flex align-items-start mb-2 mt-1">
      <div class="w-100">
        <small class="float-end">{{ emailData.date }}</small>
        <small class="text-muted">From: {{ emailData.from?.name }} &lt;{{ emailData.from?.address }}&gt;</small>
      </div>

    </div>
    <div class="w-100">
        <small class="text-muted">To:
          <template v-for="recipient of emailData.to">
            {{ recipient.name }} &lt;{{ recipient.address }}&gt;&semi;
          </template>
        </small>
    </div>


    <h5 class="mb-3" v-if="!emailData.html && !emailData.text">This email has no HTML or text content</h5>

    <template v-if="emailData.html">
      <br/>
      <div class="overflow-auto" v-html="emailData.htmlAsText.replaceAll('\n', '<br>')"></div>
      <hr/>
    </template>

    <template v-if="emailData.text">
      <details :open="emailData.html ? undefined : 'open'">
        <summary>Text</summary>
        <br/>
        <div class="overflow-auto" v-html="emailData.text.replaceAll('\n', '<br>')"></div>
      </details>
      <hr/>
    </template>

    <template v-if="emailData.attachments?.length > 0">
      <h5 class="mb-3">This email has {{ emailData.attachments.length }} attachment(s):</h5>
      <div class="w-100" v-for="attachment of emailData.attachments" :key="attachment.filename">
        <small class="text-muted">{{ attachment.filename }}</small>
      </div>
    </template>

  </template>

  <template v-else>
    <div class="text-center">
      <div class="lds-dual-ring"></div>
    </div>
  </template>
</template>


<script>
import PostalMime from "postal-mime";
import { convert } from "html-to-text";

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
        const parsedEmail = await parser.parse(this.filedata);

        this.emailData = parsedEmail;
        if (parsedEmail.html) {
          this.emailData.htmlAsText = convert(parsedEmail.html, {});
        }
      } catch (error) {
        console.error('Error parsing email data:', error);
      }
    }
  },
  async mounted() {
    await this.parseEmail();
  }
}
</script>
