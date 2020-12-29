import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import ShortFormAdapter from './adapter'
import ShortFormAuthorAdapter from './authorAdapter'
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'
import { JuntoSettingsUI } from './SettingsUI'
import { ShortFormExpressionUI } from './shortFormExpressionUI'


function iconFor(expression: Address): string {
    return Icon
}

function constructorIcon(): string {
    return ConstructorIcon
}

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "junto-shortform"

export default function create(context: LanguageContext): Language {
    const expressionAdapter = new ShortFormAdapter(context)
    const authorAdaptor = new ShortFormAuthorAdapter(context)
    const settingsUI = new JuntoSettingsUI()
    const expressionUI = new ShortFormExpressionUI()

    return {
        name,
        expressionAdapter,
        authorAdaptor,
        iconFor,
        constructorIcon,
        interactions,
        settingsUI,
        expressionUI
    } as Language
}
