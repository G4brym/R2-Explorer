export type CArgs = {
	projectName: string;
	deploy?: boolean;
	open?: boolean;
};

export type CArg = CArgs[keyof CArgs];

type UpdaterPackageScript = (cmd: string) => string;
