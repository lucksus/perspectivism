import { AdminWebsocket, AppWebsocket, InstallAppRequest } from '@holochain/conductor-api'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import { execHolochain } from '@holochain-open-dev/holochain-run-dna/src/execHolochain'
import { installApp } from '@holochain-open-dev/holochain-run-dna/src/installApp'
import { rootPath } from 'electron-root-path'
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

    call(dnaNick: String, fnName: String, params: object) {

    }
}

export class HolochainService {
    #cellsByLanguage: any
    #adminPort: number
    #adminWebsocket: AdminWebsocket
    #appWebsocket: AppWebsocket

    constructor(dbAdapter, configPath) {
        this.#cellsByLanguage = low(dbAdapter)
        const holochainAdminPort = 1337
        process.env.PATH = `${rootPath}:${process.env.PATH}`
        console.debug("PATH is now:", process.env.PATH)
        execHolochain(holochainAdminPort, configPath).then(async result => {
            this.#adminPort = result[1]
            this.#adminWebsocket = await AdminWebsocket.connect(
                `ws://localhost:${this.#adminPort}`
            )

            console.debug("Holochain admin interface connected on port", this.#adminPort)

            const appSocketPort = this.#adminPort + 1
            this.#adminWebsocket.attachAppInterface({ port: appSocketPort })
            this.#appWebsocket = await AppWebsocket.connect(`ws://localhost:${appSocketPort}`)

            console.debug("Holochain app interface connected on port", appSocketPort)

            // @ts-ignore
            this.ensureInstallDNAforLanguage()
        })
    }

    async ensureInstallDNAforLanguage(lang: String, nick: String, dnaFile: Buffer) {
        const cellId = HolochainService.cellId(lang, nick)
        const installedCellIds = await this.#adminWebsocket.listCellIds()
        console.debug("Installed cells:", installedCellIds)
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
    return new HolochainService(adapter, configFilePath)
}