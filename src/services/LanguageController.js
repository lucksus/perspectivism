const { ipcRenderer } = require('electron')

module.exports =  {
    getInstalledLanguages:  ()              => ipcRenderer.invoke('languages-getInstalled'),
    getContructorIcon:      (lang)          => ipcRenderer.invoke('languages-getConstructorIcon', lang),
    getIcon:                (expr)          => ipcRenderer.invoke('languages-getIcon', expr),
    getExpression:          (expr)          => ipcRenderer.invoke('languages-getExpression', expr),
    interact:               (expr, call)    => ipcRenderer.invoke('languages-interact', expr, call),
}