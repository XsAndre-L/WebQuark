export type CommandResult = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type CommandRunner = (
  command: readonly string[],
  cwd: string,
) => Promise<CommandResult>;

export type VersionCheckResult = {
  readonly sourceVersion?: string;
  readonly errors: readonly string[];
};

export type ReleaseResult = {
  readonly version: string;
  readonly releasedVersion?: string;
  readonly changedPaths: readonly string[];
};

export type ReleaseOptions = {
  readonly commandRunner?: CommandRunner;
  readonly date?: string;
};

export type SnapshotEntry = {
  readonly path: string;
  readonly snapshotPath: string;
  readonly existed: boolean;
};


