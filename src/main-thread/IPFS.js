const IPFS = require('ipfs')
const { app, BrowserWindow, ipcMain } = require('electron')

export async function init () {
    const node = await IPFS.create()
    const version = await node.version()

    console.log('Version:', version.version)

    ipcMain.handle('ipfs-write', async (event, path, object) => {
        const fileAdded = await node.add({
            path,
            content: JSON.stringify(object)
        })

        console.log('Added file:', fileAdded.path, fileAdded.cid)

        return fileAdded.cid
    })

    ipcMain.handle('ipfs-read', async (event, cid) => {
        const chunks = []
        for await (const chunk of node.cat(cid)) {
            chunks.push(chunk)
        }

        const fileString = uint8ArrayConcat(chunks).toString();
        console.log('Read file contents:', uint8ArrayConcat(chunks).toString())
        const parsed = JSON.parse(fileString)
        console.log('Parsed object:', parsed)
        return parsed
    })

    return node
}