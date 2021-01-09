import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import type HolochainLanguageDelegate from '../../main-thread/Holochain'
import Adapter from './adapter'
import { ExpressionUI } from './expressionUI'
import { DNA, DNA_NICK } from './dna'
import LanguageAdapter from './languageAdapter'

export const name: string = "languages"

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export default function create(context: LanguageContext): Language {
    const Holochain = context.Holochain as HolochainLanguageDelegate
    Holochain.registerDNAs([{file: DNA, nick: DNA_NICK}])

    const expressionAdapter = new Adapter(context)
    const expressionUI = new ExpressionUI()
    const languageAdapter = new LanguageAdapter(context)

    return {
        name,
        expressionAdapter,
        expressionUI,
        languageAdapter,
        interactions,
    } as Language
}

