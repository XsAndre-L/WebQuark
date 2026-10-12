export const STABLE_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export type StableVersion = {
  readonly value: string;
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
};

export function parseStableVersion(value: unknown, label = 'Version'): StableVersion {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a stable X.Y.Z SemVer.`);
  }

  const match = STABLE_VERSION_PATTERN.exec(value);
  if (!match) {
    throw new Error(
      `${label} must be a stable X.Y.Z SemVer; received ${JSON.stringify(value)}.`,
    );
  }

  return {
    value,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function compareStableVersions(left: StableVersion, right: StableVersion): number {
  return (
    Math.sign(left.major - right.major) ||
    Math.sign(left.minor - right.minor) ||
    Math.sign(left.patch - right.patch)
  );
}
