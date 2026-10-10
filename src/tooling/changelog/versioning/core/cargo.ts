import { parseStableVersion } from '../stable-version.js';
import { escapeRegExp } from './files.js';

export function readCargoPackageVersion(cargoToml: string): string {
  const packageSection = readTomlSection(cargoToml, 'package');
  const versions = [
    ...packageSection.matchAll(/^version\s*=\s*"([^"]+)"\s*(?:#.*)?$/gm),
  ];
  if (versions.length !== 1) {
    throw new Error('Cargo.toml [package] must contain exactly one string version.');
  }
  return versions[0][1];
}

export function updateCargoPackageVersion(
  cargoToml: string,
  version: string,
): string {
  parseStableVersion(version);
  const sectionRange = findTomlSectionRange(cargoToml, 'package');
  const section = cargoToml.slice(sectionRange.start, sectionRange.end);
  const matches = [...section.matchAll(/^version\s*=\s*"([^"]+)"\s*(?:#.*)?$/gm)];
  if (matches.length !== 1) {
    throw new Error('Cargo.toml [package] must contain exactly one string version.');
  }

  const match = matches[0];
  const matchStart = sectionRange.start + (match.index ?? 0);
  const fullMatch = match[0];
  const replacement = fullMatch.replace(`"${match[1]}"`, `"${version}"`);
  return (
    cargoToml.slice(0, matchStart) +
    replacement +
    cargoToml.slice(matchStart + fullMatch.length)
  );
}

export function readCargoLockPackageVersion(
  cargoLock: string,
  packageName: string,
): string {
  const packages = cargoLock
    .split(/(?=^\[\[package\]\]\s*$)/m)
    .filter((block) => /^\[\[package\]\]\s*$/m.test(block))
    .filter((block) => readTomlString(block, 'name') === packageName);

  if (packages.length !== 1) {
    throw new Error(
      `Cargo.lock must contain exactly one ${JSON.stringify(packageName)} package record.`,
    );
  }

  const version = readTomlString(packages[0], 'version');
  if (!version) {
    throw new Error(`Cargo.lock package ${packageName} has no string version.`);
  }
  return version;
}

export function updateCargoLockPackageVersion(
  cargoLock: string,
  packageName: string,
  version: string,
): string {
  parseStableVersion(version);
  readCargoLockPackageVersion(cargoLock, packageName);
  return cargoLock
    .split(/(?=^\[\[package\]\]\s*$)/m)
    .map((block) => {
      if (readTomlString(block, 'name') !== packageName) {
        return block;
      }
      return block.replace(
        /^(version\s*=\s*")[^"]+("[^\r\n]*)/m,
        (_match, prefix: string, suffix: string) => prefix + version + suffix,
      );
    })
    .join('');
}

function readTomlSection(source: string, section: string): string {
  const range = findTomlSectionRange(source, section);
  return source.slice(range.start, range.end);
}

function findTomlSectionRange(
  source: string,
  section: string,
): { readonly start: number; readonly end: number } {
  const headerPattern = new RegExp(`^\\[${escapeRegExp(section)}\\]\\s*$`, 'gm');
  const headers = [...source.matchAll(headerPattern)];
  if (headers.length !== 1) {
    throw new Error(`Cargo.toml must contain exactly one [${section}] section.`);
  }

  const header = headers[0];
  const start = (header.index ?? 0) + header[0].length;
  const nextHeader = /^\s*\[[^\]]+\]\s*$/m.exec(source.slice(start));
  return {
    start,
    end: nextHeader ? start + (nextHeader.index ?? 0) : source.length,
  };
}

function readTomlString(source: string, key: string): string | undefined {
  const pattern = new RegExp(
    `^${escapeRegExp(key)}\\s*=\\s*"([^"]+)"\\s*(?:#.*)?$`,
    'm',
  );
  return pattern.exec(source)?.[1];
}

