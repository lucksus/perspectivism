import type Address from '../../ad4m/Address'
import type AgentService from '../../ad4m/AgentService'
import type { PublicSharing } from '../../ad4m/Language'
import type LanguageContext from '../../ad4m/LanguageContext'
import type { IPFSNode } from '../../ad4m/LanguageContext'

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