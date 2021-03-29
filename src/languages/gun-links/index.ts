import type Address from '../../ad4m/Address'
import type Agent from '../../ad4m/Agent'
import type Language from '../../ad4m/Language'
import type LanguageContext from '../../ad4m/LanguageContext'
import type { Interaction } from '../../ad4m/Language'
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