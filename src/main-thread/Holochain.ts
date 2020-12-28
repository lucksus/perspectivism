import { AdminWebsocket, AppWebsocket, InstallAppRequest } from '@holochain/conductor-api'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'

export default class HolochainLanguageDelegate {
    #languageHash
    #holochainService

    constructor(languageHash: String, holochainService: HolochainService) {
        this.#languageHash = languageHash
        this.#holochainService = holochainService
    }

    registerDNA(...) {
        
    }

    call(fnName: String, params: object): any {

    }
}

export class HolochainService {
    #cellsByLanguage: any

    constructor(dbAdapter) {
        this.#cellsByLanguage = low(dbAdapter)
    }

    ensureInstallDNAforLanguage() {

    }

    getDelegateForLanguage(languageHash: String) {
        return new HolochainLanguageDelegate(languageHash, this)
    }
}

export function init(dbFilePath) {
    const adapter = new FileSync(path.join(dbFilePath, 'holochain-service.json'))
    return new HolochainService(adapter)
}