import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

export default class PerspectivesController {
    #perspectives = null
    #rootConfigPath

    constructor(rootConfigPath) {
        this.#rootConfigPath = rootConfigPath
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
        return perspective
    }

    remove(uuid) {
        delete this.#perspectives[uuid]
        this.save()
    }

    update(perspective) {
        const uuid = perspective.uuid
        this.#perspectives[uuid] = perspective
        this.save()
    }
}

export function init(rootConfigPath) {
    return new PerspectivesController(rootConfigPath)
}