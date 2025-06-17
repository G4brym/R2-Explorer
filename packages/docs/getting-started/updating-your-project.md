# Update your project

R2 Explorer receives updates regularly, you will be prompted to update your application inside your
instance, in the bottom left connor, like this:

![Update available](/assets/update-available.png)

## Manual update

In order to update your application, just run:

```bash
npm install r2-explorer@latest --save
```

Then proceed to deploy your application:
```bash
wrangler deploy
```

## Update using github actions

You can check if your workers needs to update in fork github repository, by looking into the commits behind
section.

To start the update, just click sync fork and then click update branch.

This will update your fork and trigger an automatic deploy to update your Cloudflare worker.

:::warning
Update using github actions, **requires** you to setup your instance following this [tutorial here](./creating-a-new-project.html).
:::

![update](/assets/github-action/update-available.png)
