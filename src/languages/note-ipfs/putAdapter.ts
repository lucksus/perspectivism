import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type { PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { IPFSNode } from '../../acai/LanguageContext'

export class IpfsPutAdapter implements PublicSharing {
    #agent: Agent
    #IPFS: IPFSNode

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        this.#IPFS = context.IPFS
    }

    async createPublic(note: object): Promise<Address> {
        const expression = {
            author: this.#agent.did,
            timestamp: new Date().toString(),
            data: note,
        }

        const content = JSON.stringify(expression)
        const result = await this.#IPFS.add({content})
        // @ts-ignore
        return result.cid.toString() as Address
    }
}