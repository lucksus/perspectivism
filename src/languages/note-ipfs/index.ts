import type Address from '@perspect3vism/ad4m/Address'
import type Agent from '@perspect3vism/ad4m/Agent'
import type Language from '@perspect3vism/ad4m/Language'
import type LanguageContext from '@perspect3vism/ad4m-language-context/LanguageContext'
import type { Interaction } from '@perspect3vism/ad4m/Language'
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

export const name: string = "note-ipfs"