# What is Email Explorer?

Email Explorer is a feature, that allows you and your team to see and open email received using
[Cloudflare Email routing](https://www.cloudflare.com/developer-platform/email-routing/).

![Email routing screenshot](/assets/setup-email-routing-4.png)

It works by catching the emails you configure to send to your R2 Explorer instance, saving theses
in a R2 bucket and then exposing a UI built around the R2 API.


## Are there new features coming to Email Explorer?

Yes, the features planned for the near future are:

- Custom email folders
- Configure rules to send emails to specific folders (like gmail filters)
- Delete emails
- Move emails between folders
- Email Search


## Setup Email Explorer

After having your worker updated and deployed in your Cloudflare account, head over to the Cloudflare Dash and open
the domain you want to setup.

:::warning
Email Explorer requires that you have at least R2 Explorer `v1.0.0`.

Follow the [create a new project](/getting-started/creating-a-new-project.html) or
[migrate to 1.0](./migrating-to-1.0.html) guides!
:::

Open the Email -> Email Routing

![open email routing tab](/assets/setup-email-routing-3.png)

Then click Routes and in the bottom select Edit in the Catch-all address.

![edit routing](/assets/setup-email-routing.png)

:::info
You can also setup individual email routes, intead of using the catch-all.
:::

Finally click Send to a Worker, pick your R2 Explorer instance and click save.

![edit routing](/assets/setup-email-routing-2.png)

Congratulations! you will now be able to see all the emails you receive inside your R2 Explorer instance.

By default your emails will end up in the 1º bucket you have, but you can overwrite it, read more
[here](/getting-started/configuration.html#configuring-email-explorer-target-bucket).
