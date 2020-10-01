import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter, ReadOnlyLanguage } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import { UrlPutAdapter } from './putAdapter'

export default class Adapter implements ExpressionAdapter {
    putAdapter: ReadOnlyLanguage

    constructor(context: LanguageContext) {
        this.putAdapter = new UrlPutAdapter()
    }

    async get(address: Address): Promise<void | Expression> {
        const data = { url: address }

        const url = new URL(address)

        const expression = {
            author: new Agent(url.hostname),
            timestamp: 'unknown',
            data,
        };

        return expression

    }
}