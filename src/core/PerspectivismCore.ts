import * as Config from './Config'
import * as Db from './db'
import type { PerspectivismDb } from './db'
import * as Holochain from './storage-services/Holochain'
import * as IPFS from './storage-services/IPFS'
import AgentService from './agent/AgentService'
import PerspectivesController from './PerspectivesController'
import LanguageController from './LanguageController'
import * as GraphQL from './graphQL-interface/GraphQL'
import * as DIDs from './agent/DIDs'
import type { DIDResolver } from './agent/DIDs'
import Signatures from './agent/Signatures'
import type Perspective from './Perspective'


export default class PerspectivismCore {
    #holochain: any
    #IPFS: any

    #agentService: AgentService
    #db: PerspectivismDb
    #didResolver: DIDResolver
    #signatures: Signatures

    #perspectivesController: PerspectivesController
    #languageController: LanguageController

    constructor() {
        Config.init()

        this.#agentService = new AgentService(Config.rootConfigPath)
        this.#agentService.load()
        this.#db = Db.init(Config.dataPath)
        this.#didResolver = DIDs.init(Config.dataPath)
        this.#signatures = new Signatures(this.#didResolver)
    }

    get agentService(): AgentService {
        return this.#agentService
    }

    get perspectivesController(): PerspectivesController {
        return this.#perspectivesController
    }

    get languageController(): LanguageController {
        return this.#languageController
    }

    async startGraphQLServer() {
        const { url, subscriptionsUrl } = await GraphQL.startServer(this)
        console.log(`🚀  GraphQL Server ready at ${url}`)
        console.log(`🚀  GraphQL subscriptions ready at ${subscriptionsUrl}`)
    }

    async initServices() {
        this.#holochain = Holochain.init(Config.holochainConfigPath, Config.holochainDataPath)
        this.#IPFS = await IPFS.init()
    }

    async waitForAgent(): Promise<void> {
        return this.#agentService.ready
    }

    initControllers() {
        this.#languageController = new LanguageController({
            agent: this.#agentService,
            IPFS: this.#IPFS,
            signatures: this.#signatures
        }, this.#holochain)

        this.#perspectivesController = new PerspectivesController(Config.rootConfigPath, {
            db: this.#db,
            agentService: this.agentService,
            languageController: this.#languageController
        })
    }

    perspectiveByUuid(uuid: string): Perspective|void {

    }
}

export function create(): PerspectivismCore {
    return new PerspectivismCore()
}