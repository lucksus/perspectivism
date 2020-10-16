const { ipcRenderer } = require('electron')

module.exports =  {
    getLinks: (perspective, query ) => ipcRenderer.invoke('links-get', perspective, query),
    getLinksFrom: (perspective, source) => ipcRenderer.invoke('links-getFrom', perspective, source),
    getLinksTo: (perspective, target) => ipcRenderer.invoke('links-getTo', perspective, target),
    addLink: (perspective, link) => ipcRenderer.invoke('links-add', perspective, link),
    removeLink: (perspective, link) => ipcRenderer.invoke('links-remove', perspective, link),
    syncWithSharingAdapter: (perspective) => ipcRenderer.invoke('links-sync', perspective),
    updateLink: (perspective, oldLink, newLink) => ipcRenderer.invoke('links-update', perspective, oldLink, newLink),
}