import type Address from '../../ad4m/Address'
import type Agent from '../../ad4m/Agent'
import type Language from '../../ad4m/Language'
import type LanguageContext from '../../ad4m/LanguageContext'
import type { Interaction } from '../../ad4m/Language'
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

