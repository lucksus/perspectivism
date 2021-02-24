import LinkRepoController from './LinkRepoController';
import { PerspectivismDb } from './db';
import { v4 as uuidv4 } from 'uuid';
import faker from 'faker';
import temp from 'temp';
function createLink() {
    return {
        source: faker.internet.url(),
        target: faker.internet.url(),
        predicate: faker.internet.url(),
    };
}
const agent = { did: 'did:local-test-agent' };
const languageController = {
    getLinksAdapter: () => null
};
describe('LinkRepoController', () => {
    let linkRepoController;
    let perspective;
    let allLinks;
    beforeEach(() => {
        let db = new PerspectivismDb(temp.track().mkdirSync());
        linkRepoController = new LinkRepoController({ db, languageController, agent });
        perspective = { uuid: uuidv4() };
        allLinks = [];
    });
    it('wraps links in expressions on addLink', () => {
        const link = createLink();
        const expression = linkRepoController.addLink(perspective, link);
        expect(expression.author).toEqual(agent);
        expect(expression.data).toEqual(link);
    });
    describe('after adding some links', () => {
        beforeEach(() => {
            for (let i = 0; i < 5; i++) {
                const link = createLink();
                if (i % 2 == 0) {
                    link.source = 'root';
                }
                allLinks.push(link);
                linkRepoController.addLink(perspective, link);
            }
        });
        it('can get all links', async () => {
            const result = await linkRepoController.getLinks(perspective, {});
            expect(result.length).toEqual(5);
            for (let i = 0; i < 5; i++) {
                expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ data: allLinks[i] })]));
            }
        });
        it('can get links by source', async () => {
            const result = await linkRepoController.getLinks(perspective, { source: 'root' });
            expect(result.length).toEqual(3);
        });
    });
});
//# sourceMappingURL=LinkRepoController.test.js.map