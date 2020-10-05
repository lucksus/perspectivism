import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import { GunLinksAdapter } from './linksAdapter'
import { GunSettingsUI } from './settingsUI'

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export default function create(context: LanguageContext): Language {
    const linksAdapter = new GunLinksAdapter(context)
    const settingsUI = new GunSettingsUI()

    return {
        name: 'gun-links',
        linksAdapter,
        settingsUI,
        interactions,
    } as Language
}

export const name: string = "gun-links"