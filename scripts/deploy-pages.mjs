/**
 * Выкладка собранного сайта на GitHub Pages.
 *
 * Что делает: берёт готовую папку dist, делает из неё отдельный git-репозиторий
 * с одним коммитом и force-push'ит его в ветку gh-pages. История основного
 * репозитория при этом не засоряется сборками.
 *
 * Запуск:  npm run deploy   (сначала соберёт с нужным базовым путём)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REMOTE = process.env.PAGES_REMOTE ?? 'https://github.com/qt1995/remont.git'
const BRANCH = process.env.PAGES_BRANCH ?? 'gh-pages'

// import.meta.dirname появился в Node 20.11 — берём путь через URL, чтобы работало и на 20.10
const root = fileURLToPath(new URL('..', import.meta.url))
const dist = resolve(root, 'dist')

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('Нет собранного сайта. Сначала: npm run build:pages')
  process.exit(1)
}

const git = (args, cwd = dist) =>
  execFileSync('git', args, { cwd, stdio: 'inherit', env: { ...process.env, GIT_TERMINAL_PROMPT: '1' } })

// Jekyll на Pages игнорирует файлы и папки, начинающиеся с подчёркивания.
writeFileSync(resolve(dist, '.nojekyll'), '')

// Свежий репозиторий на каждую выкладку: одна ветка, один коммит.
rmSync(resolve(dist, '.git'), { recursive: true, force: true })

git(['init', '-q'])
git(['checkout', '-q', '-b', BRANCH])
git(['add', '-A'])
git(['commit', '-q', '-m', 'Выкладка сайта: ' + new Date().toISOString()])
git(['push', '-f', REMOTE, BRANCH])

console.log('\nГотово. Ветка ' + BRANCH + ' обновлена в ' + REMOTE)
