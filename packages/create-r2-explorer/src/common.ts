import {existsSync, mkdirSync, readdirSync} from "fs";
import {basename, dirname, resolve} from "path";
import {chdir} from "process";
import {crash, endSection, log, logRaw, newline, openInBrowser, shapes, startSection,} from "helpers/cli";
import {bgGreen, blue, brandColor, dim, gray} from "helpers/colors";
import {listAccounts, runCommand, wranglerLogin,} from "helpers/command";
import {inputPrompt, processArgument, spinner} from "helpers/interactive";
import {detectPackageManager} from "helpers/packages";
import {C_DEFAULTS} from "./cli";
import type {CArgs, PagesGeneratorContext} from "types";
import {poll} from "helpers/poll";

const {npm} = detectPackageManager();

export const validateProjectDirectory = (relativePath: string) => {
  const path = resolve(relativePath);
  const existsAlready = existsSync(path);
  const isEmpty = existsAlready && readdirSync(path).length === 0; // allow existing dirs _if empty_ to ensure c3 is non-destructive

  if (existsAlready && !isEmpty) {
    return `Directory \`${relativePath}\` already exists and is not empty. Please choose a new name.`;
  }
};

export const setupProjectDirectory = (args: CArgs) => {
  // Crash if the directory already exists
  const path = resolve(args.projectName);
  const err = validateProjectDirectory(path);
  if (err) {
    crash(err);
  }

  const directory = dirname(path);
  const name = basename(path);

  // If the target is a nested directory, create the parent
  mkdirSync(directory, {recursive: true});

  // Change to the parent directory
  chdir(directory);

  return {name, path};
};

export const offerToDeploy = async (ctx: PagesGeneratorContext) => {
  startSection(`Deploy with Cloudflare`, `Step 3 of 3`);

  const label = `deploy via \`${npm} run ${
    ctx.framework?.config.deployCommand ?? "deploy"
  }\``;

  ctx.args.deploy = await processArgument(ctx.args, "deploy", {
    type: "confirm",
    question: "Do you want to deploy your application?",
    label,
    defaultValue: C_DEFAULTS.deploy,
  });

  if (!ctx.args.deploy) return;

  const loginSuccess = await wranglerLogin();
  if (!loginSuccess) return;

  await chooseAccount(ctx);
};

export const runDeploy = async (ctx: PagesGeneratorContext) => {
  if (ctx.args.deploy === false) return;
  if (!ctx.account?.id) {
    crash("Failed to read Cloudflare account.");
    return;
  }

  const deployCmd = `${npm} run ${
    ctx.framework?.config.deployCommand ?? "deploy"
  }`;
  const result = await runCommand(deployCmd, {
    silent: true,
    cwd: ctx.project.path,
    env: {CLOUDFLARE_ACCOUNT_ID: ctx.account.id, NODE_ENV: "production"},
    startText: `Deploying your application`,
    doneText: `${brandColor("deployed")} ${dim(`via \`${deployCmd}\``)}`,
  });

  const deployedUrlRegex = /https:\/\/.+\.(pages|workers)\.dev/;
  const deployedUrlMatch = result.match(deployedUrlRegex);
  if (deployedUrlMatch) {
    ctx.deployedUrl = deployedUrlMatch[0];
  } else {
    crash("Failed to find deployment url.");
  }

  // if a pages url (<sha1>.<project>.pages.dev), remove the sha1
  if (ctx.deployedUrl?.endsWith(".pages.dev")) {
    const [proto, hostname] = ctx.deployedUrl.split("://");
    const hostnameWithoutSHA1 = hostname.split(".").slice(-3).join("."); // only keep the last 3 parts (discard the 4th, i.e. the SHA1)

    ctx.deployedUrl = `${proto}://${hostnameWithoutSHA1}`;
  }
};

export const chooseAccount = async (ctx: PagesGeneratorContext) => {
  const s = spinner();
  s.start(`Selecting Cloudflare account ${dim("retrieving accounts")}`);
  const accounts = await listAccounts();

  let accountId: string;

  if (Object.keys(accounts).length == 1) {
    const accountName = Object.keys(accounts)[0];
    accountId = accounts[accountName];
    s.stop(`${brandColor("account")} ${dim(accountName)}`);
  } else {
    s.stop(
      `${brandColor("account")} ${dim("more than one account available")}`
    );
    const accountOptions = Object.entries(accounts).map(([name, id]) => ({
      label: name,
      value: id,
    }));

    accountId = await inputPrompt({
      type: "select",
      question: "Which account do you want to use?",
      options: accountOptions,
      label: "account",
      defaultValue: accountOptions[0].value,
    });
  }
  const accountName = Object.keys(accounts).find(
    (name) => accounts[name] == accountId
  ) as string;

  ctx.account = {id: accountId, name: accountName};
};

export const printSummary = async (ctx: PagesGeneratorContext) => {
  const nextSteps = [
    [`Navigate to the new directory`, `cd ${ctx.project.name}`],
    [
      `Run the development server`,
      `${npm} run ${ctx.framework?.config.devCommand ?? "start"}`,
    ],
    [
      `Deploy your application`,
      `${npm} run ${ctx.framework?.config.deployCommand ?? "deploy"}`,
    ],
    [
      `Read the documentation`,
      `https://developers.cloudflare.com/${
        ctx.framework
          ? ctx.framework.config.type === "workers"
            ? "workers"
            : "pages"
          : "workers"
      }`,
    ],
    [`Stuck? Join us at`, `https://discord.gg/cloudflaredev`],
  ];

  if (ctx.deployedUrl) {
    const msg = [
      `${gray(shapes.leftT)}`,
      `${bgGreen(" SUCCESS ")}`,
      `${dim(`View your deployed application at`)}`,
      `${blue(ctx.deployedUrl)}`,
    ].join(" ");
    logRaw(msg);
  } else {
    const msg = [
      `${gray(shapes.leftT)}`,
      `${bgGreen(" APPLICATION CREATED ")}`,
      `${dim(`Deploy your application with`)}`,
      `${blue(
        `${npm} run ${ctx.framework?.config.deployCommand ?? "deploy"}`
      )}`,
    ].join(" ");
    logRaw(msg);
  }

  newline();
  nextSteps.forEach((entry) => {
    log(`${dim(entry[0])} ${blue(entry[1])}`);
  });
  newline();

  if (ctx.deployedUrl) {
    const success = await poll(ctx.deployedUrl);
    if (success) {
      if (ctx.args.open) {
        await openInBrowser(ctx.deployedUrl);
      }
    }
  }
  endSection("See you again soon!");
  process.exit(0);
};

export async function getProductionBranch(cwd: string) {
  try {
    const productionBranch = await runCommand(
      // "git branch --show-current", // git@^2.22
      "git rev-parse --abbrev-ref HEAD", // git@^1.6.3
      {
        silent: true,
        cwd,
        useSpinner: false,
        captureOutput: true,
      }
    );

    return productionBranch.trim();
  } catch (err) {
  }

  return "main";
}
