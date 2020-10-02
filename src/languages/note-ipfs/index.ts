import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import Adapter from './adapter'
import { NoteExpressionUI } from './noteExpressionUI'

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export default function create(context: LanguageContext): Language {
    const expressionAdapter = new Adapter(context)
    const expressionUI = new NoteExpressionUI()

    return {
        name: 'note-ipfs',
        expressionAdapter,
        expressionUI,
        interactions,
    } as Language
}
