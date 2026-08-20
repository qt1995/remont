/**
 * Путь к файлу из public/ с учётом базового пути сборки.
 * Локально BASE_URL = "/", на GitHub Pages — "/remont/".
 */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')
