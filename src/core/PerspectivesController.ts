import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import * as PubSub from './PubSub'

export default class PerspectivesController {
    #perspectives = null
    #rootConfigPath
    #pubsub

    constructor(rootConfigPath) {
        this.#rootConfigPath = rootConfigPath
        this.#pubsub = PubSub.get()
        const FILENAME = 'perspectives.json'
        const FILEPATH = path.join(rootConfigPath, FILENAME)
        if(fs.existsSync(FILEPATH)) {
            this.#perspectives = JSON.parse(fs.readFileSync(FILEPATH).toString())
        } else {
            this.#perspectives = {}
        }
    }

    private save() {
        const FILENAME = 'perspectives.json'
        const FILEPATH = path.join(this.#rootConfigPath, FILENAME)
        fs.writeFileSync(FILEPATH, JSON.stringify(this.#perspectives))
    }

    get() {
        return this.#perspectives
    }

    add(perspective) {
        if(!perspective.uuid) {
            perspective.uuid = uuidv4()
        }
        this.#perspectives[perspective.uuid] = perspective
        this.save()
        this.#pubsub.publish(PubSub.PERSPECTIVE_ADDED_TOPIC, { perspective })
        return perspective
    }

    remove(uuid) {
        delete this.#perspectives[uuid]
        this.save()
        this.#pubsub.publish(PubSub.PERSPECTIVE_REMOVED_TOPIC, { uuid })
    }

    update(perspective) {
        const uuid = perspective.uuid
        this.#perspectives[uuid] = perspective
        this.save()
        this.#pubsub.publish(PubSub.PERSPECTIVE_UPDATED_TOPIC, { perspective })
    }
}

export function init(rootConfigPath) {
    return new PerspectivesController(rootConfigPath)
}