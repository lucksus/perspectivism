const { ipcRenderer } = require('electron')

module.exports =  {
    getRootLinks: (perspective) => ipcRenderer.invoke('links-getRoot', perspective),
    addRootLink: (perspective, link) => ipcRenderer.invoke('links-addRoot', perspective, link),
    getLinksFrom: (perspective, source) => ipcRenderer.invoke('links-getFrom', perspective, source),
    getLinksTo: (perspective, target) => ipcRenderer.invoke('links-getTo', perspective, target),
    addLink: (perspective, link) => ipcRenderer.invoke('links-add', perspective, link),
    removeLink: (perspective, link) => ipcRenderer.invoke('links-remove', perspective, link),
    syncWithSharingAdapter: (perspective) => ipcRenderer.invoke('links-sync', perspective),
}