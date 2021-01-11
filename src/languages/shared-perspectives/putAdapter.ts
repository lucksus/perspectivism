import type Address from '../../acai/Address'
import type AgentService from '../../acai/AgentService'
import type { PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { IPFSNode } from '../../acai/LanguageContext'

export class IpfsPutAdapter implements PublicSharing {
    #agent: AgentService
    #IPFS: IPFSNode

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        this.#IPFS = context.IPFS
    }

    async createPublic(note: object): Promise<Address> {
        const agent = this.#agent
        const expression = agent.createSignedExpression(note)
        const content = JSON.stringify(expression)
        const result = await this.#IPFS.add({content})
        // @ts-ignore
        return result.cid.toString() as Address
    }
}