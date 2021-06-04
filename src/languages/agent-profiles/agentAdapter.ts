import type Agent from '@perspect3vism/ad4m/Agent'
import type Expression from '@perspect3vism/ad4m/Expression'
import type { AgentAdapter as Interface } from '@perspect3vism/ad4m/Language'
import type LanguageContext from '@perspect3vism/ad4m-language-context/LanguageContext'
import type HolochainLanguageDelegate from '@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate'
import { DNA_NICK } from './dna'
import { agentFromExpression, profileExpressionFromAgent } from './profile'


export default class AgentAdapter implements Interface {
    #holochain: HolochainLanguageDelegate
    #context: LanguageContext

    constructor(context: LanguageContext) {
        this.#holochain = context.Holochain as HolochainLanguageDelegate
        this.#context = context
    }

    async setProfile(agent: Agent) {
        const existingProfile = await this.getProfile(this.#context.agent.did)

        const oldAgent = JSON.stringify(existingProfile)
        const newAgent = JSON.stringify(agent)
        const changed = oldAgent !== newAgent

        if(!changed)
            return

        const expression = profileExpressionFromAgent(agent, this.#context)

        if(!existingProfile) {
            await this.#holochain.call(DNA_NICK, "did-profiles", "create_profile", expression)
        }
        else if (changed) {
            await this.#holochain.call(DNA_NICK, "did-profiles", "update_profile", expression)
        }
    }

    async getProfile(did: string): Promise<Agent|void> {
        return agentFromExpression(await this.#holochain.call(DNA_NICK, "did-profiles", "get_profile", did))
    }
}