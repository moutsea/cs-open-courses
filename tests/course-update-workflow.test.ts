import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

test('course workflow commits generated updates, ignores unrelated changes and safely skips empty commits', async () => {
  const workflow = await readFile('.github/workflows/auto-update-courses.yml', 'utf8')
  const step = workflow.slice(workflow.indexOf('      - name: Commit approved updates'))
  assert.ok(step.includes('if: ${{ !inputs.shadow_mode }}'), 'Shadow runs must not publish build changes')
  const script = step.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n')
  const directory = await mkdtemp(path.join(tmpdir(), 'course-workflow-test-'))
  const checkout = path.join(directory, 'checkout')
  const remote = path.join(directory, 'remote.git')
  await mkdir(checkout)
  const git = (...args: string[]) => execFileSync('git', args, { cwd: checkout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const put = async (file: string, text: string) => {
    await mkdir(path.dirname(path.join(checkout, file)), { recursive: true })
    await writeFile(path.join(checkout, file), text)
  }
  const run = () => execFileSync('bash', ['-e', '-c', script], { cwd: checkout, encoding: 'utf8', env: { ...process.env, GITHUB_REF_NAME: 'main' }, stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    git('init', '-b', 'main')
    git('config', 'user.name', 'Review Test')
    git('config', 'user.email', 'review@example.invalid')
    git('init', '--bare', remote)
    git('remote', 'add', 'origin', remote)
    await put('automation/course-feed-state.json', '{}\n')
    await put('course-content/en/example.md', '# Example\n')
    await put('src/data/generated/course-revisions.json', '{}\n')
    git('add', '.')
    git('commit', '-m', 'Initial fixture')
    const firstCommit = git('rev-parse', 'HEAD')
    assert.match(run(), /No approved course updates/)
    assert.equal(git('rev-parse', 'HEAD'), firstCommit)

    await put('src/data/generated/course-revisions.json', '{"changed":true}\n')
    await put('src/data/generated/catalog-routes.json', '{"new":true}\n')
    await put('unrelated.txt', 'Do not include this file\n')
    run()
    assert.notEqual(git('rev-parse', 'HEAD'), firstCommit)
    assert.deepEqual(git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').split('\n'), [
      'src/data/generated/catalog-routes.json', 'src/data/generated/course-revisions.json'
    ])
    assert.equal(git('--git-dir', remote, 'rev-parse', 'main'), git('rev-parse', 'HEAD'))
    const generatedCommit = git('rev-parse', 'HEAD')
    assert.match(run(), /No approved course updates/)
    assert.equal(git('rev-parse', 'HEAD'), generatedCommit)

    await put('course-content/en/new-course.md', '# New Course\n')
    await put('src/data/generated/course-search-index.json', '[]\n')
    run()
    assert.deepEqual(git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').split('\n'), [
      'course-content/en/new-course.md', 'src/data/generated/course-search-index.json'
    ])
    assert.equal(git('status', '--short'), '?? unrelated.txt')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
