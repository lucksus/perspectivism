import type { ExpressionAdapter as Interface } from '../../acai/Language'
import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type LanguageContext from '../../acai/LanguageContext'
import AgentPutAdapter from './putAdapter'
import type HolochainLanguageDelegate from '../../main-thread/Holochain'
import { DNA_NICK } from './dna'
import { PERSPECTIVISM_PROFILE } from './agentAdapter'

export default class ExpressionAdapter implements Interface {
    putAdapter: AgentPutAdapter
    #holochain: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.putAdapter = new AgentPutAdapter()
        this.#holochain = context.Holochain as HolochainLanguageDelegate
    }

    async get(address: Address): Promise<void | Expression> {
        const result = await this.#holochain.call(DNA_NICK, "did-profiles", "get_profile", address)
        if(result) {
            const agentExpression = result[PERSPECTIVISM_PROFILE] as Expression
            return agentExpression
        } else {
            return null
        }
    }
}