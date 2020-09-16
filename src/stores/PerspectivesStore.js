const { writable } = require('svelte/store')
const { ipcRenderer } = require('electron')

async function createPerspectiveStore() {
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
        add: (name, perspective) => {
            update((perspectives) => {
                perspectives[name] = perspective
                return perspectives
            })
            save()
        },
        remove: (name) => {
            update((perspectives) => {
                delete perspectives[name]
                return perspectives
            })
            save()
        }
    };
}

