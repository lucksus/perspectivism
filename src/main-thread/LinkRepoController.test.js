import LinkRepoController from './LinkRepoController';
const Gun = require('./Gun');
import { v4 as uuidv4 } from 'uuid';
import faker from 'faker';
import 'typescript';
function createLink() {
    return {
        source: faker.internet.url(),
        target: faker.internet.url(),
        predicate: faker.internet.url(),
    };
}
const gun = Gun.init('.');
const agent = { did: 'did:local-test-agent' };
const languageController = {
    getLinksAdapter: () => null
};
describe('LinkRepoController', () => {
    const linkRepoController = new LinkRepoController({ gun, languageController, agent });
    let perspective;
    beforeAll(async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
    });
    beforeEach(() => {
        perspective = { uuid: uuidv4() };
    });
    it('wraps links in expressions on addLink', () => {
        const link = createLink();
        const expression = linkRepoController.addLink(perspective, link);
        expect(expression.author).toEqual(agent);
        expect(expression.data).toEqual(link);
    });
    it('can add and get all links', () => {
        //linkRepoController.addLink(perspective, )
    });
});
//# sourceMappingURL=LinkRepoController.test.js.map