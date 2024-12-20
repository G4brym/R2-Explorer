## 1st Method (Github Action - Recommended)

Start by creating a new fork of the [github repository here](https://github.com/G4brym/R2-Explorer/fork).

![Fork](/assets/github-action/fork.png)

Create a new API Token as described in the [official Cloudflare Docs](https://developers.cloudflare.com/workers/wrangler/migration/v1-to-v2/wrangler-legacy/authentication/#api-token).

Then, in your new repository go to Settings -> Secret and variables -> Actions -> New repository secret.

![new secret](/assets/github-action/new-secret.png)

Create a new secret with the name `CF_API_TOKEN` and the value as the newly created token.

![add cf token](/assets/github-action/add-cf-token.png)

Now switch to the variables tab and create the following variables:

- `R2EXPLORER_WORKER_NAME` this is the worker named used to identify the worker in your Cloudflare account.
- `R2EXPLORER_CONFIG` object with the R2-explorer configuration, [read more here](./configuration.md).
- `R2EXPLORER_BUCKETS` buckets in the format `{r2-explorer name}:{bucket name}`, define one bucket per line.
- `R2EXPLORER_DOMAIN` **optional** domain name used to serve the R2-explorer instance, when not set, you will be given a workers.dev domain.


Example variables:

- `R2EXPLORER_WORKER_NAME => my-r2-explorer`
- `R2EXPLORER_CONFIG => { readonly: true }`
- `R2EXPLORER_BUCKETS => example-1:r2-explorer-example-1`
- `R2EXPLORER_DOMAIN => my-domain.com`


![add variables](/assets/github-action/add-variables.png)


Now go to the github repository and click Actions -> I understand my workflows, go ahead and enable them.

![enable actions](/assets/github-action/enable-actions.png)


After enabling actions, go ahead and trigger a new deploy, you can use this flow at any time to re-deploy
your application.

Click Actions -> Deploy -> Run workflow -> Run workflow.

![trigger update](/assets/github-action/trigger-update.png)


## 2nd Method (create-cloudflare)

Creating your own instance of R2 Explorer is easy, after making sure you have [Node](https://nodejs.org) installed,
run this tool that will help you get started:

```bash
npm create cloudflare@latest r2-explorer -- --template "G4brym/R2-Explorer/template"
```

This command with automatically create the project files locally and install all dependencies.


!!! note

    This uses the official create-cloudflare package, your wrangler informations are never shared with r2-explorer!


## 3rd Method (manual template)

If you prefer to do the things yourself, there is a project template available on 
[github here](https://github.com/G4brym/R2-Explorer/tree/main/template), that you can use.
