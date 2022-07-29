import type Address from '@perspect3vism/ad4m/Address'
import type Agent from '@perspect3vism/ad4m/Agent'
import type Language from '@perspect3vism/ad4m/Language'
import type LanguageContext from '@perspect3vism/ad4m-language-context/LanguageContext'
import type { Interaction } from '@perspect3vism/ad4m/Language'
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

