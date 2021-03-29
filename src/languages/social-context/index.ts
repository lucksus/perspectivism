import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import type HolochainLanguageDelegate from '../../core/storage-services/Holochain/HolochainLanguageDelegate'
import { JuntoSocialContextLinkAdapter } from './linksAdapter'
import { JuntoSettingsUI } from './settingsUI'
import { DNA, DNA_NICK } from './dna'

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "social-context"

export default function create(context: LanguageContext): Language {
    const Holochain = context.Holochain as HolochainLanguageDelegate
    Holochain.registerDNAs([{file: DNA, nick: DNA_NICK}])

    const linksAdapter = new JuntoSocialContextLinkAdapter(context)
    const settingsUI = new JuntoSettingsUI()

    return {
        name,
        linksAdapter,
        settingsUI,
        interactions,
    } as Language
}

