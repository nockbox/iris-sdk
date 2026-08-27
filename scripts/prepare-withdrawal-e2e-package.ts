import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const EXPECTED_PACKAGE_NAME = '@nockbox/iris-sdk';
const DRIVER_PATH = 'dist/e2e/encode-withdrawal-e2e.js';
const WASM_PATH = 'dist/e2e/iris_wasm_bg.wasm';
const METADATA_SCHEMA_VERSION = 1;
const execFileAsync = promisify(execFile);

export interface PackedFileFacts {
  path: string;
  size: number;
  mode: number;
}

export interface IrisE2ePackageMetadata {
  schema_version: 1;
  package_name: string;
  package_version: string;
  git_revision: string;
  tarball_path: string;
  tarball_sha256: string;
  npm_integrity: string;
  npm_shasum: string;
  driver_path: typeof DRIVER_PATH;
  files: PackedFileFacts[];
  node_version: string;
  npm_version: string;
}

export interface PrepareIrisPackageOptions {
  checkout: string;
  output_dir: string;
  expected_revision?: string;
  expected_version?: string;
}

interface NpmPackResult {
  name: string;
  version: string;
  filename: string;
  shasum: string;
  integrity: string;
  files: PackedFileFacts[];
}

export async function prepareIrisE2ePackage(
  options: PrepareIrisPackageOptions
): Promise<IrisE2ePackageMetadata> {
  const checkout = resolve(options.checkout);
  const outputDir = resolve(options.output_dir);
  const packageJsonPath = resolve(checkout, 'package.json');
  const packageJson = parsePackageJson(await readFile(packageJsonPath, 'utf8'));
  if (packageJson.name !== EXPECTED_PACKAGE_NAME) {
    throw new Error(`package name must be ${EXPECTED_PACKAGE_NAME}`);
  }
  if (options.expected_version && packageJson.version !== options.expected_version) {
    throw new Error(
      `package version mismatch: expected ${options.expected_version}, observed ${packageJson.version}`
    );
  }
  if (isWithin(checkout, outputDir)) {
    throw new Error('output directory must be outside the Iris checkout');
  }

  const statusBefore = await run(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    checkout
  );
  if (statusBefore.stdout.trim().length > 0) {
    throw new Error('Iris checkout must be clean before packaging');
  }
  const revision = (
    await run('git', ['rev-parse', '--verify', 'HEAD^{commit}'], checkout)
  ).stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(revision)) {
    throw new Error('Iris checkout did not resolve to a full git revision');
  }
  if (options.expected_revision && revision !== options.expected_revision) {
    throw new Error(
      `git revision mismatch: expected ${options.expected_revision}, observed ${revision}`
    );
  }

  const nodeVersion = process.version;
  const npmVersion = (await run('npm', ['--version'], checkout)).stdout.trim();
  requireSupportedToolchain(nodeVersion, npmVersion);
  await run('npm', ['run', 'test:pack-readiness', '--silent', '--offline'], checkout);
  const wasmDestination = resolve(checkout, WASM_PATH);
  const dependencyWasm = resolve(checkout, 'node_modules/@nockbox/iris-wasm/iris_wasm_bg.wasm');
  if (!(await pathExists(wasmDestination))) {
    await copyFile(dependencyWasm, wasmDestination);
  }
  await mkdir(outputDir, { recursive: true });

  const expectedFilename = `${packageJson.name.replace(/^@/, '').replace('/', '-')}-${packageJson.version}.tgz`;
  const expectedTarball = resolve(outputDir, expectedFilename);
  const expectedMetadata = `${expectedTarball}.metadata.json`;
  if (await pathExists(expectedTarball)) {
    throw new Error(`refusing to overwrite existing tarball ${expectedTarball}`);
  }
  if (await pathExists(expectedMetadata)) {
    throw new Error(`refusing to overwrite existing metadata ${expectedMetadata}`);
  }

  const packed = await run(
    'npm',
    ['pack', '--silent', '--offline', '--json', '--pack-destination', outputDir],
    checkout
  );
  const result = parsePackResult(packed.stdout);
  if (result.name !== packageJson.name || result.version !== packageJson.version) {
    throw new Error('npm pack returned a different package identity');
  }
  const tarballPath = resolve(outputDir, result.filename);
  if (dirname(tarballPath) !== outputDir || tarballPath !== expectedTarball) {
    throw new Error('npm pack returned an unexpected tarball path');
  }
  validatePackedFiles(result.files);
  if (!result.integrity.startsWith('sha512-') || !/^[0-9a-f]{40}$/.test(result.shasum)) {
    throw new Error('npm pack returned malformed integrity metadata');
  }

  const statusAfter = await run(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    checkout
  );
  if (statusAfter.stdout.trim().length > 0) {
    throw new Error('Iris packaging lifecycle modified the checkout');
  }
  const metadata: IrisE2ePackageMetadata = {
    schema_version: METADATA_SCHEMA_VERSION,
    package_name: result.name,
    package_version: result.version,
    git_revision: revision,
    tarball_path: tarballPath,
    tarball_sha256: await sha256File(tarballPath),
    npm_integrity: result.integrity,
    npm_shasum: result.shasum,
    driver_path: DRIVER_PATH,
    files: [...result.files].sort((left, right) => left.path.localeCompare(right.path)),
    node_version: nodeVersion,
    npm_version: npmVersion,
  };
  await writeFile(expectedMetadata, `${JSON.stringify(metadata, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  return metadata;
}

function parsePackageJson(raw: string): { name: string; version: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Iris package.json is malformed');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Iris package.json must be an object');
  }
  const value = parsed as Record<string, unknown>;
  if (typeof value.name !== 'string' || typeof value.version !== 'string') {
    throw new Error('Iris package.json must contain string name and version');
  }
  return { name: value.name, version: value.version };
}

function parsePackResult(stdout: string): NpmPackResult {
  let parsed: unknown;
  for (let index = stdout.indexOf('['); index >= 0; index = stdout.indexOf('[', index + 1)) {
    try {
      parsed = JSON.parse(stdout.slice(index));
      break;
    } catch {
      // npm lifecycle output may precede the final JSON array.
    }
  }
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error('npm pack did not return one JSON package result');
  }
  const result = parsed[0] as Partial<NpmPackResult>;
  if (
    typeof result.name !== 'string' ||
    typeof result.version !== 'string' ||
    typeof result.filename !== 'string' ||
    typeof result.shasum !== 'string' ||
    typeof result.integrity !== 'string' ||
    !Array.isArray(result.files)
  ) {
    throw new Error('npm pack result is missing identity or file metadata');
  }
  const files = result.files.map((entry, index) => {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof entry.path !== 'string' ||
      typeof entry.size !== 'number' ||
      typeof entry.mode !== 'number'
    ) {
      throw new Error(`npm pack file metadata ${index} is malformed`);
    }
    return { path: entry.path, size: entry.size, mode: entry.mode };
  });
  return {
    name: result.name,
    version: result.version,
    filename: result.filename,
    shasum: result.shasum,
    integrity: result.integrity,
    files,
  };
}

function validatePackedFiles(files: readonly PackedFileFacts[]): void {
  const paths = new Set<string>();
  for (const file of files) {
    const normalized = file.path.split('\\').join('/');
    const lower = normalized.toLowerCase();
    if (
      normalized !== file.path ||
      normalized.startsWith('/') ||
      normalized.split('/').includes('..') ||
      file.size < 0 ||
      !Number.isSafeInteger(file.size) ||
      !Number.isSafeInteger(file.mode)
    ) {
      throw new Error(`unsafe npm package entry ${file.path}`);
    }
    if (!paths.add(normalized)) {
      throw new Error(`duplicate npm package entry ${normalized}`);
    }
    const allowed =
      normalized === 'LICENSE' ||
      normalized === 'README.md' ||
      normalized === 'package.json' ||
      normalized.startsWith('dist/') ||
      normalized.startsWith('test-fixtures/');
    const sensitive =
      lower.includes('.env') ||
      lower.endsWith('.pem') ||
      lower.endsWith('.key') ||
      lower.endsWith('.p12') ||
      lower.endsWith('.npmrc') ||
      lower.includes('credential') ||
      lower.includes('secret');
    if (!allowed || sensitive) {
      throw new Error(`unexpected or sensitive npm package entry ${normalized}`);
    }
  }
  if (!paths.has(DRIVER_PATH) || !paths.has(WASM_PATH) || !paths.has('package.json')) {
    throw new Error(
      'npm package is missing the bundled withdrawal driver, WASM module, or package.json'
    );
  }
}

function requireSupportedToolchain(nodeVersion: string, npmVersion: string): void {
  const nodeMajor = Number.parseInt(nodeVersion.replace(/^v/, '').split('.')[0], 10);
  const npmMajor = Number.parseInt(npmVersion.split('.')[0], 10);
  if (!Number.isSafeInteger(nodeMajor) || nodeMajor < 22) {
    throw new Error(`Node 22 or newer is required, observed ${nodeVersion}`);
  }
  if (!Number.isSafeInteger(npmMajor) || npmMajor < 10) {
    throw new Error(`npm 10 or newer is required, observed ${npmVersion}`);
  }
}

function isWithin(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

async function run(
  program: string,
  args: readonly string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execFileAsync(program, [...args], {
      cwd,
      env: {
        ...process.env,
        npm_config_audit: 'false',
        npm_config_fund: 'false',
        npm_config_update_notifier: 'false',
      },
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const stderr =
      typeof error === 'object' &&
      error !== null &&
      'stderr' in error &&
      typeof error.stderr === 'string'
        ? error.stderr.trim()
        : 'no stderr';
    throw new Error(`${program} ${args.join(' ')} failed: ${stderr}`);
  }
}

function parseArgs(argv: readonly string[]): PrepareIrisPackageOptions {
  const defaultCheckout = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let checkout = defaultCheckout;
  let outputDir: string | undefined;
  let expectedRevision: string | undefined;
  let expectedVersion: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${flag} requires a value`);
    }
    switch (flag) {
      case '--checkout':
        checkout = value;
        break;
      case '--output-dir':
        outputDir = value;
        break;
      case '--expected-revision':
        expectedRevision = value;
        break;
      case '--expected-version':
        expectedVersion = value;
        break;
      default:
        throw new Error(`unknown argument ${flag}`);
    }
    index += 1;
  }
  if (!outputDir) {
    throw new Error('--output-dir is required');
  }
  return {
    checkout,
    output_dir: outputDir,
    expected_revision: expectedRevision,
    expected_version: expectedVersion,
  };
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entrypoint === fileURLToPath(import.meta.url)) {
  prepareIrisE2ePackage(parseArgs(process.argv.slice(2)))
    .then(metadata => {
      process.stdout.write(`${JSON.stringify(metadata)}\n`);
    })
    .catch(error => {
      process.stderr.write(`iris E2E package preparation failed: ${String(error)}\n`);
      process.exitCode = 1;
    });
}
