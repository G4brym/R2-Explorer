#!/usr/bin/env node
import {crash, logRaw, startSection} from "helpers/cli";
import {dim} from "helpers/colors";
import {processArgument} from "helpers/interactive";
import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import {version} from "../package.json";
import {validateProjectDirectory} from "./common";
import {runWorkersGenerator} from "./workers";
import {CArgs} from "types";

export const C_DEFAULTS = {
  projectName: 'my-r2-explorer',
  deploy: undefined,
  open: true,
};

export const main = async (argv: string[]) => {
  const args = await parseArgs(argv);

  printBanner();

  const projectName = await processArgument<string>(args, "projectName", {
    type: "text",
    question: `In which directory do you want to create your application?`,
    helpText: "also used as application name",
    defaultValue: C_DEFAULTS.projectName,
    label: "dir",
    validate: (value) =>
      validateProjectDirectory(String(value) || C_DEFAULTS.projectName),
    format: (val) => `./${val}`,
  });

  const validatedArgs: CArgs = {
    ...args,
    projectName,
  };

  await runWorkersGenerator(validatedArgs);
};

const printBanner = () => {
  logRaw(dim(`\nusing create-r2-explorer version ${version}\n`));
  startSection(`Create an application with Cloudflare`, "Step 1 of 3");
};

export const parseArgs = async (argv: string[]): Promise<Partial<CArgs>> => {
  const args = await yargs(hideBin(argv))
    .scriptName("create-r2-explorer")
    .usage("$0 [args]")
    .positional("name", {type: "string"})
    .option("deploy", {type: "boolean"})
    .option("open", {
      type: "boolean",
      default: true,
      description:
        "opens your browser after your deployment, set --no-open to disable",
    })
    .version(version)
    .help().argv;

  return {
    ...C_DEFAULTS,
    projectName: args._[0] as string | undefined,
    ...args,
  };
};

main(process.argv).catch((e) => crash(e));
