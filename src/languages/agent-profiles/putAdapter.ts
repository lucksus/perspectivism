import type Address from "../../acai/Address";
import type Agent from "../../acai/Agent";
import type { ReadOnlyLanguage } from "../../acai/Language";

export default class AgentPutAdapter implements ReadOnlyLanguage {
    async addressOf(agent: object): Promise<Address> {
        return (agent as Agent).did
    }
}