import { AdminWebsocket, AppWebsocket, InstallAppRequest } from '@holochain/conductor-api'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import { execHolochain } from '@holochain-open-dev/holochain-run-dna/src/execHolochain'
import { installApp } from '@holochain-open-dev/holochain-run-dna/src/installApp'
import { rootPath } from 'electron-root-path'
import fs from 'fs'
export default class HolochainLanguageDelegate {
    #languageHash
    #holochainService

    constructor(languageHash: String, holochainService: HolochainService) {
        this.#languageHash = languageHash
        this.#holochainService = holochainService
    }

    registerDNA(dnaFile: Buffer, nick: String) {
        this.#holochainService.ensureInstallDNAforLanguage(this.#languageHash, nick, dnaFile)
    }

    call(dnaNick: String, fnName: String, params: object): any {

    }
}

export class HolochainService {
    #cellsByLanguage: any
    #adminPort: number
    #appPort: number
    #adminWebsocket: AdminWebsocket
    #appWebsocket: AppWebsocket
    #dataPath: string
    #ready: Promise<void>

    constructor(dbAdapter, configPath, dataPath) {
        let resolveReady
        this.#ready = new Promise(resolve => resolveReady = resolve)

        this.#dataPath = dataPath
        this.#cellsByLanguage = low(dbAdapter)

        const holochainAdminPort = 1337
        process.env.PATH = `${rootPath}:${process.env.PATH}`
        execHolochain(holochainAdminPort, configPath).then(async result => {
            try {
                this.#adminPort = result[1]
                this.#adminWebsocket = await AdminWebsocket.connect(
                    `ws://localhost:${this.#adminPort}`
                )
    
                console.debug("Holochain admin interface connected on port", this.#adminPort)
                this.#appPort = this.#adminPort + 1
                this.#adminWebsocket.attachAppInterface({ port: this.#appPort })
                this.#appWebsocket = await AppWebsocket.connect(`ws://localhost:${this.#appPort}`)
                console.debug("Holochain app interface connected on port", this.#appPort)
                resolveReady()
            } catch(e) {
                console.error("Error intializing Holochain conductor:", e)
            }
            
        })
    }

    async ensureInstallDNAforLanguage(lang: String, nick: String, dnaFile: Buffer) {
        try {
            await this.#ready
            console.debug("Installing DNA", nick, "for language", lang)
            console.debug(dnaFile)
            let installedCellIds = await this.#adminWebsocket.listCellIds()
            console.debug("Installed cells before:", installedCellIds)
            const cellId = HolochainService.cellId(lang, nick)
            const dnaFilePath = path.join(this.#dataPath, cellId)
    
            fs.writeFileSync(dnaFilePath, dnaFile)
            await installApp(this.#adminPort, this.#appPort, [dnaFilePath], nick)
    
            installedCellIds = await this.#adminWebsocket.listCellIds()
            console.debug("Installed cells after:", installedCellIds)
        } catch(e) {
            console.error("Error during install of DNA:", e)
        }

    }

    getDelegateForLanguage(languageHash: String) {
        return new HolochainLanguageDelegate(languageHash, this)
    }

    static cellId(languageHash: String, dnaNick: String) {
        return `${languageHash}-${dnaNick}`
    }


}

export function init(configFilePath, dbFilePath) {
    const adapter = new FileSync(path.join(dbFilePath, 'holochain-service.json'))
    return new HolochainService(adapter, configFilePath, dbFilePath)
}