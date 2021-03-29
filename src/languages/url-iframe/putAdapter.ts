import type Address from '../../ad4m/Address'
import type { ReadOnlyLanguage } from '../../ad4m/Language'

export class UrlPutAdapter implements ReadOnlyLanguage {
    async addressOf(data: object): Promise<Address> {
        // making sure it's a well formatted URL
        // @ts-ignore
        const url = new URL(data.url)
        const address = url.toString().split('://')[1]

        // @ts-ignore
        return address as Address
    }
}