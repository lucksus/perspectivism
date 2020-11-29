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
})