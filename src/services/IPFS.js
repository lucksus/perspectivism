const { ipcRenderer } = require('electron')

module.exports =  {
    add: (data) => ipcRenderer.invoke('ipfs-add', data),
    cat: (path) => ipcRenderer.invoke('ipfs-cat', path),
}