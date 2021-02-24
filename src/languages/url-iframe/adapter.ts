import type Address from '../../ad4m/Address'
import Agent from '../../ad4m/Agent'
import type Expression from '../../ad4m/Expression'
import type { ExpressionAdapter, ReadOnlyLanguage } from '../../ad4m/Language'
import type LanguageContext from '../../ad4m/LanguageContext'
import { UrlPutAdapter } from './putAdapter'

export default class Adapter implements ExpressionAdapter {
    putAdapter: ReadOnlyLanguage

    constructor(context: LanguageContext) {
        this.putAdapter = new UrlPutAdapter()
    }

    async get(address: Address): Promise<void | Expression> {
        let url
        try {
            url = new URL(address)
        } catch(e) {
            address = 'https:' + address
            url = new URL(address)
        }

        const data = { url: address }

        const expression = {
            author: new Agent(url.hostname),
            timestamp: 'unknown',
            data,
        };

        return expression

    }
}