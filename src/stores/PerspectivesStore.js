const { writable } = require('svelte/store')
const { ipcRenderer } = require('electron')
const { v4: uuidv4 } = require('uuid')

module.exports = async function createPerspectiveStore() {
    let perspectives = null

    async function load() {
        perspectives = await ipcRenderer.invoke('read-perspectives')
    }

    await load()

    async function save() {
        await ipcRenderer.invoke('write-perspectives', perspectives)
    }

    const { subscribe, update } = writable(perspectives);

    return {
        subscribe,
        add: (perspective) => {
            if(!perspective.uuid) {
                perspective.uuid = uuidv4()
            }
            update((perspectives) => {
                perspectives[perspective.uuid] = perspective
                return perspectives
            })
            save()
        },
        remove: (uuid) => {
            update((perspectives) => {
                delete perspectives[uuid]
                return perspectives
            })
            save()
        },
        update: (perspective) => {
            const uuid = perspective.uuid
            update((perspectives) => {
                perspectives[uuid] = perspective
                return perspectives
            })
            save()
        }
    };
}

