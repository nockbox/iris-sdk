import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  prepareIrisE2ePackage,
  type IrisE2ePackageMetadata,
} from '../scripts/prepare-withdrawal-e2e-package.js';

let fixtureSequence = 0;

interface FixtureOptions {
  packageName?: string;
  readinessFails?: boolean;
  includeSecret?: boolean;
}

test('clean checkout packs deterministically with immutable identity and executable driver', async () => {
  const fixture = createFixture('clean package with spaces');
  const first = await prepareIrisE2ePackage({
    checkout: fixture.checkout,
    output_dir: join(fixture.root, 'first output'),
    expected_revision: fixture.revision,
    expected_version: '0.3.0',
  });
  const second = await prepareIrisE2ePackage({
    checkout: fixture.checkout,
    output_dir: join(fixture.root, 'second output'),
  });

  assert.equal(first.schema_version, 1);
  assert.equal(first.package_name, '@nockbox/iris-sdk');
  assert.equal(first.package_version, '0.3.0');
  assert.equal(first.git_revision, fixture.revision);
  assert.match(first.tarball_sha256, /^[0-9a-f]{64}$/);
  assert.match(first.npm_integrity, /^sha512-/);
  assert.match(first.npm_shasum, /^[0-9a-f]{40}$/);
  assert.equal(first.driver_path, 'dist/e2e/encode-withdrawal-e2e.js');
  assert.ok(first.files.some(file => file.path === first.driver_path));
  assert.ok(first.files.some(file => file.path === 'dist/e2e/iris_wasm_bg.wasm'));
  assert.ok(first.files.every(file => allowedPackagePath(file.path)));
  assert.equal(first.tarball_sha256, second.tarball_sha256);
  assert.equal(first.npm_integrity, second.npm_integrity);
  assert.equal(sha256(readFileSync(first.tarball_path)), first.tarball_sha256);
  assert.ok(existsSync(`${first.tarball_path}.metadata.json`));

  const extractedRoot = join(fixture.root, 'extracted driver');
  mkdirSync(extractedRoot, { recursive: true });
  run('tar', ['-xzf', first.tarball_path, '-C', extractedRoot, `package/${first.driver_path}`]);
  const driver = join(extractedRoot, 'package', first.driver_path);
  const execution = spawnSync(process.execPath, [driver], {
    input: '{"probe":true}',
    encoding: 'utf8',
  });
  assert.equal(execution.status, 0, execution.stderr);
  assert.deepEqual(JSON.parse(execution.stdout), {
    ok: true,
    request: { probe: true },
  });
});

test('package CLI emits one metadata object and accepts explicit checkout and output paths', () => {
  const fixture = createFixture('cli package');
  const script = fileURLToPath(
    new URL('../scripts/prepare-withdrawal-e2e-package.ts', import.meta.url)
  );
  const outputDir = join(fixture.root, 'cli output');
  const execution = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      script,
      '--checkout',
      fixture.checkout,
      '--output-dir',
      outputDir,
      '--expected-revision',
      fixture.revision,
      '--expected-version',
      '0.3.0',
    ],
    { encoding: 'utf8' }
  );
  assert.equal(execution.status, 0, execution.stderr);
  assert.equal(execution.stderr, '');
  assert.equal(execution.stdout.split('\n').filter(Boolean).length, 1);
  const metadata = JSON.parse(execution.stdout) as IrisE2ePackageMetadata;
  assert.equal(metadata.git_revision, fixture.revision);
  assert.equal(metadata.tarball_path.startsWith(outputDir), true);
});

test('dirty and wrong checkouts are rejected before package creation', async () => {
  const dirty = createFixture('dirty package');
  writeFileSync(join(dirty.checkout, 'README.md'), 'dirty\n');
  await assert.rejects(
    () =>
      prepareIrisE2ePackage({
        checkout: dirty.checkout,
        output_dir: join(dirty.root, 'output'),
      }),
    /must be clean/
  );

  const wrong = createFixture('wrong package', { packageName: '@example/not-iris' });
  await assert.rejects(
    () =>
      prepareIrisE2ePackage({
        checkout: wrong.checkout,
        output_dir: join(wrong.root, 'output'),
      }),
    /package name/
  );
});

test('unexpected sensitive files and lifecycle failures are rejected', async () => {
  const secret = createFixture('secret package', { includeSecret: true });
  await assert.rejects(
    () =>
      prepareIrisE2ePackage({
        checkout: secret.checkout,
        output_dir: join(secret.root, 'output'),
      }),
    /unexpected or sensitive/
  );

  const failing = createFixture('failing lifecycle', { readinessFails: true });
  await assert.rejects(
    () =>
      prepareIrisE2ePackage({
        checkout: failing.checkout,
        output_dir: join(failing.root, 'output'),
      }),
    /test:pack-readiness/
  );
});

test('revision and version expectations distinguish same-version checkouts', async () => {
  const fixture = createFixture('identity package');
  await assert.rejects(
    () =>
      prepareIrisE2ePackage({
        checkout: fixture.checkout,
        output_dir: join(fixture.root, 'wrong revision'),
        expected_revision: 'f'.repeat(40),
      }),
    /git revision mismatch/
  );
  await assert.rejects(
    () =>
      prepareIrisE2ePackage({
        checkout: fixture.checkout,
        output_dir: join(fixture.root, 'wrong version'),
        expected_version: '9.9.9',
      }),
    /package version mismatch/
  );
});

function createFixture(label: string, options: FixtureOptions = {}) {
  fixtureSequence += 1;
  const root = join(
    process.env.TMPDIR ?? '/tmp',
    `iris-e2e-package-${process.pid}-${Date.now()}-${fixtureSequence}-${label}`
  );
  const checkout = join(root, 'checkout');
  mkdirSync(join(checkout, 'dist', 'e2e'), { recursive: true });
  mkdirSync(join(checkout, 'test-fixtures'), { recursive: true });
  const packageJson = {
    name: options.packageName ?? '@nockbox/iris-sdk',
    version: '0.3.0',
    type: 'module',
    bin: {
      'iris-withdrawal-e2e': './dist/e2e/encode-withdrawal-e2e.js',
    },
    files: ['dist', 'test-fixtures', 'README.md'],
    scripts: {
      'test:pack-readiness': options.readinessFails
        ? 'node -e "process.exit(7)"'
        : 'node -e "process.exit(0)"',
      prepare: 'node -e "process.exit(0)"',
    },
  };
  writeFileSync(join(checkout, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  writeFileSync(join(checkout, 'README.md'), 'fixture\n');
  writeFileSync(join(checkout, 'LICENSE'), 'fixture license\n');
  writeFileSync(join(checkout, 'test-fixtures', 'vector.json'), '{"fixture":true}\n');
  writeFileSync(
    join(checkout, 'dist', 'e2e', 'encode-withdrawal-e2e.js'),
    [
      '#!/usr/bin/env node',
      "let input = '';",
      "process.stdin.setEncoding('utf8');",
      "process.stdin.on('data', chunk => { input += chunk; });",
      "process.stdin.on('end', () => {",
      '  process.stdout.write(`${JSON.stringify({ ok: true, request: JSON.parse(input) })}\\n`);',
      '});',
      '',
    ].join('\n')
  );
  writeFileSync(join(checkout, 'dist', 'e2e', 'iris_wasm_bg.wasm'), 'fixture wasm\n');
  if (options.includeSecret) {
    writeFileSync(join(checkout, 'dist', 'secret.pem'), 'not-a-real-secret\n');
  }
  run('git', ['init', '--quiet'], checkout);
  run('git', ['config', 'user.name', 'Iris E2E Fixture'], checkout);
  run('git', ['config', 'user.email', 'fixture@example.invalid'], checkout);
  run('git', ['add', '.'], checkout);
  run('git', ['-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture'], checkout);
  const revision = run('git', ['rev-parse', 'HEAD'], checkout).stdout.trim();
  return { root, checkout, revision };
}

function run(program: string, args: readonly string[], cwd?: string) {
  const result = spawnSync(program, [...args], {
    cwd,
    encoding: 'utf8',
    shell: false,
  });
  assert.equal(result.status, 0, result.stderr);
  return result;
}

function allowedPackagePath(path: string): boolean {
  return (
    path === 'LICENSE' ||
    path === 'README.md' ||
    path === 'package.json' ||
    path.startsWith('dist/') ||
    path.startsWith('test-fixtures/')
  );
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}
