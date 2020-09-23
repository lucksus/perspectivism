import { app } from 'electron'
import * as path from 'path';
import * as fs from 'fs';

export const rootConfigPath = path.join(app.getPath('appData'), 'Perspectivism')
export const dataPath = path.join(rootConfigPath, 'data')

export function init() {
    if(!fs.existsSync(rootConfigPath)) {
        fs.mkdirSync(rootConfigPath)
    }

    if(!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath)
    }
}
