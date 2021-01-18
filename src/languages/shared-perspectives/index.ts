import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import Adapter from './adapter'
import { ExpressionUI } from './expressionUI'

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "shared-perspectives"

export default function create(context: LanguageContext): Language {
    const expressionAdapter = new Adapter(context)
    const expressionUI = new ExpressionUI()

    return {
        name,
        expressionAdapter,
        expressionUI,
        interactions,
    } as Language
}

