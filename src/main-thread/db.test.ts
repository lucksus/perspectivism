import { PerspectivismDb } from './db'
import Memory from 'lowdb/adapters/Memory'
import { v4 as uuidv4 } from 'uuid'

describe('PerspectivismDb', () => {
    let db
    let pUUID

    beforeEach(() => {
        db = new PerspectivismDb(new Memory())
        pUUID = uuidv4()
    })

    it('can store and retrieve objects by name', () => {
        const obj = { test: 'object' }
        const name = 'linkName'

        db.storeLink(pUUID, obj, name)
        const result = db.getLink(pUUID, name)

        expect(result).toEqual(obj)
    })

    it('can getAllLinks', () => {
        const obj1 = { test: 'object1' }
        const name1 = 'linkName1'
        db.storeLink(pUUID, obj1, name1)

        const obj2 = { test: 'object2' }
        const name2 = 'linkName2'
        db.storeLink(pUUID, obj2, name2)

        const allLinks = db.getAllLinks(pUUID)

        expect(allLinks).toEqual([
            {
                link: obj1,
                name: name1,
            },
            {
                link: obj2,
                name: name2,
            }
        ])
    })

    it('can getLinksBySource', () => {
        const obj1 = { test: 'object1' }
        const name1 = 'linkName1'
        db.storeLink(pUUID, obj1, name1)

        const obj2 = { test: 'object2' }
        const name2 = 'linkName2'
        db.storeLink(pUUID, obj2, name2)

        db.attachSource(pUUID, name1, name2)

        const result = db.getLinksBySource(pUUID, name1)

        expect(result).toEqual([{
            link: obj2,
            name: name2
        }])
    })

    it('can getLinksByTarget', () => {
        const obj1 = { test: 'object1' }
        const name1 = 'linkName1'
        db.storeLink(pUUID, obj1, name1)

        const obj2 = { test: 'object2' }
        const name2 = 'linkName2'
        db.storeLink(pUUID, obj2, name2)

        db.attachTarget(pUUID, name1, name2)

        const result = db.getLinksByTarget(pUUID, name1)

        expect(result).toEqual([{
            link: obj2,
            name: name2
        }])
    })
})