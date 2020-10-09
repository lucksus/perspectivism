import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
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

