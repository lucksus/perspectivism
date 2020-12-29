import { AdminWebsocket, AppWebsocket, InstallAppRequest } from '@holochain/conductor-api'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import { execHolochain } from '@holochain-open-dev/holochain-run-dna/src/execHolochain'
import { rootPath } from 'electron-root-path'
export default class HolochainLanguageDelegate {
    #languageHash
    #holochainService

    constructor(languageHash: String, holochainService: HolochainService) {
        this.#languageHash = languageHash
        this.#holochainService = holochainService
    }

    registerDNA(dnaFile: Buffer, nick: String) {
        
    }

    call(dnaNick: String, fnName: String, params: object) {

    }
}

export class HolochainService {
    #cellsByLanguage: any

    constructor(dbAdapter, configPath) {
        this.#cellsByLanguage = low(dbAdapter)
        const holochainAdminPort = 1337
        process.env.PATH = `${rootPath}:${process.env.PATH}`
        console.debug("PATH is now:", process.env.PATH)
        execHolochain(holochainAdminPort, configPath)
    }

    ensureInstallDNAforLanguage() {

    }

    getDelegateForLanguage(languageHash: String) {
        return new HolochainLanguageDelegate(languageHash, this)
    }
}

export function init(configFilePath, dbFilePath) {
    const adapter = new FileSync(path.join(dbFilePath, 'holochain-service.json'))
    return new HolochainService(adapter, configFilePath)
}