import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import type HolochainLanguageDelegate from '../../main-thread/Holochain'
import AgentAdapter from './agentAdapter'
import ExpressionAdapter from './expressionAdapter'
import { DNA, DNA_NICK } from './dna'

export const name: string = "agent-profiles"

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export default function create(context: LanguageContext): Language {
    const Holochain = context.Holochain as HolochainLanguageDelegate
    Holochain.registerDNAs([{file: DNA, nick: DNA_NICK}])

    const agentAdapter = new AgentAdapter(context)
    const expressionAdapter = new ExpressionAdapter(context)

    return {
        name,
        agentAdapter,
        expressionAdapter,
        interactions,
    } as Language
}

