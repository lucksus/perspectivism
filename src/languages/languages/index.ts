import type Address from '@perspect3vism/ad4m/Address'
import type Agent from '@perspect3vism/ad4m/Agent'
import type Language from '@perspect3vism/ad4m/Language'
import type LanguageContext from '@perspect3vism/ad4m-language-context/LanguageContext'
import type { Interaction } from '@perspect3vism/ad4m/Language'
import type HolochainLanguageDelegate from '@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate'
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

