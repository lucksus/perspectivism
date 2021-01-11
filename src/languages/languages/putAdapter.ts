import type Address from '../../acai/Address'
import type AgentService from '../../acai/AgentService'
import type { PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { IPFSNode } from '../../acai/LanguageContext'
import type HolochainLanguageDelegate from '../../core/storage-services/Holochain/HolochainLanguageDelegate'
import { DNA_NICK } from './dna'

export class IpfsPutAdapter implements PublicSharing {
    #agent: AgentService
    #IPFS: IPFSNode
    #holochain: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        this.#IPFS = context.IPFS
        this.#holochain = context.Holochain as HolochainLanguageDelegate
    }

    async createPublic(languageData: object): Promise<Address> {
        // @ts-ignore
        const { bundleFile, name, description } = languageData
        
        const ipfsAddress = await this.#IPFS.add({content: bundleFile})
        // @ts-ignore
        const hash = ipfsAddress.cid.toString()
        
        const agent = this.#agent
        const expression = agent.createSignedExpression({name, description})
        expression.data = Buffer.from(JSON.stringify(expression.data))
        await this.#holochain.call(DNA_NICK, "anchored-expression", "store_expression", {
            key: hash,
            expression
        })
        
        return hash as Address
    }
}