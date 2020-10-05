import { app } from 'electron'
import * as path from 'path';
import * as fs from 'fs';

export const rootConfigPath = path.join(app.getPath('appData'), 'Perspectivism')
export const dataPath = path.join(rootConfigPath, 'data')
export const languagesPath = path.join(rootConfigPath, 'languages')

export function init() {
    if(!fs.existsSync(rootConfigPath)) {
        fs.mkdirSync(rootConfigPath)
    }

    if(!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath)
    }

    if(!fs.existsSync(languagesPath)) {
        fs.mkdirSync(languagesPath)
    }
}

export function getLanguageStoragePath(name) {
    const languageConfigPath = path.join(languagesPath, name)
    if(!fs.existsSync(languageConfigPath))
        fs.mkdirSync(languageConfigPath)
    const storageDirectory = path.join(languageConfigPath, "storage")
    if(!fs.existsSync(storageDirectory))
        fs.mkdirSync(storageDirectory)
    return storageDirectory
}
