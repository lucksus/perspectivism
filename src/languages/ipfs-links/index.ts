import type Address from '../../ad4m/Address'
import type Agent from '../../ad4m/Agent'
import type Language from '../../ad4m/Language'
import type LanguageContext from '../../ad4m/LanguageContext'
import type { Interaction } from '../../ad4m/Language'
import { IpfsLinksAdapter } from './linksAdapter'
import { GunSettingsUI } from './settingsUI'

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "ipfs-links"

export default function create(context: LanguageContext): Language {
    const linksAdapter = new IpfsLinksAdapter(context)
    const settingsUI = new GunSettingsUI()

    return {
        name,
        linksAdapter,
        settingsUI,
        interactions,
    } as Language
}

