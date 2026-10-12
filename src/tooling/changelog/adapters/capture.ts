import type { ChangelogConfig, CaptureContentConfig } from '../config/index.js';
import type { CaptureImageFormat } from '../shared/capture-format.js';
import type { CapturePreview } from '../notes/preview.js';

export interface CaptureJob {
  id: string; mode: 'custom' | 'page'; visualId?: string; output: string;
  format: CaptureImageFormat; viewport: { width: number; height: number }; fullPage: boolean;
}
export interface CaptureConfiguration<E extends CaptureJob = CaptureJob> { path: string; bytes: Buffer; entries: E[] }
export interface CaptureFingerprintInput { path: string; build?: boolean }
export interface CapturePackageInput { name: string; path: string; trees: readonly string[] }
export interface CaptureFingerprint { sha256: string; webquark: Record<string, string>; watchRoots: string[] }
export interface CapturePreparation<E extends CaptureJob = CaptureJob> {
  config: CaptureContentConfig; entries: readonly E[]; signal: AbortSignal; runDirectory: string;
  buildFingerprint: string; capturePreview: CapturePreview; cached?: unknown; stageOnly: boolean;
  report: Record<string, unknown>; assertCurrent(): Promise<void>;
  /** Keep the managed preview in the originating package instance. */
  generatePreviewFeed(): ReturnType<typeof import('../notes/feed.js').generateWhatsNew>;
}
/** Private credentials/resources stay inside this application-owned handle. */
export interface OwnedCaptureRuntime<E extends CaptureJob = CaptureJob> {
  expiresAt: string; cached?: unknown;
  verifyCurrent(): Promise<void>;
  capture(entry: E, outputPath: string, scenarioReport: Record<string, unknown>): Promise<void>;
  close(): Promise<void>;
}
export interface CaptureAdapter<E extends CaptureJob = CaptureJob> {
  id: string; revision: string; defaults: Readonly<Record<string, unknown>>;
  inputs: readonly CaptureFingerprintInput[]; packages: readonly CapturePackageInput[];
  /** Imported app modules must stop watch mode when their source changes. */
  restartInputs: readonly string[];
  readConfiguration(config: ChangelogConfig): Promise<CaptureConfiguration<E>>;
  projection(entries: readonly E[]): unknown;
  repositoryContent(entry: E): boolean;
  validateEntry?(entry: E): void;
  prepare(context: CapturePreparation<E>): Promise<OwnedCaptureRuntime<E>>;
  /** Always called for reviewed publication; seed/actor/query/read gates cannot be skipped. */
  validateReviewedEvidence(config: CaptureContentConfig, report: Record<string, unknown>, selected: readonly E[]): Promise<void>;
  /** Authoritative redacted startup cleanup evidence, when preparation cannot return a handle. */
  preparationFailure?(runDirectory: string, report: Record<string, unknown>): Promise<void>;
}
