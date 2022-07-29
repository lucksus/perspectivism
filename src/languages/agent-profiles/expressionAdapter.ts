import type { ExpressionAdapter as Interface } from '@perspect3vism/ad4m/Language'
import type Address from '@perspect3vism/ad4m/Address'
import type Expression from '@perspect3vism/ad4m/Expression'
import AgentPutAdapter from './putAdapter'
import { DNA_NICK } from './dna'
import type LanguageContext from '@perspect3vism/ad4m-language-context/LanguageContext'
import type HolochainLanguageDelegate from '@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate'
import { agentFromExpression } from './profile'

export default class ExpressionAdapter implements Interface {
    putAdapter: AgentPutAdapter
    #holochain: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.putAdapter = new AgentPutAdapter()
        this.#holochain = context.Holochain as HolochainLanguageDelegate
    }

    async get(address: Address): Promise<void | Expression> {
        const expression = await this.#holochain.call(DNA_NICK, "did-profiles", "get_profile", address)
        console.log("agent-profiles got expression from HC:", expression)
        if(!expression) {
            return null
        }

        const did = expression.data.signed_agent
        const agent = agentFromExpression(expression)
        // TODO: this is a quick-hack - it will break the expression's validity/signature
        // The DNA's expression structure needs to be changed..
        expression.data = agent
        expression.author = { did }
        return expression
    }
}