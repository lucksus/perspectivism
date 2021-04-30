import type Address from '@perspect3vism/ad4m/Address'
import type AgentService from '@perspect3vism/ad4m/AgentService'
import type { PublicSharing } from '@perspect3vism/ad4m/Language'
import type LanguageContext from '@perspect3vism/ad4m-language-context/LanguageContext'
import type { IPFSNode } from '@perspect3vism/ad4m-language-context/LanguageContext'

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