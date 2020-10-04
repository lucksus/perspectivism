const { ipcRenderer } = require('electron')

module.exports =  {
    getInstalledLanguages:  ()              => ipcRenderer.invoke('languages-getInstalled'),
    getLanguagesWithExpressionUI:  ()       => ipcRenderer.invoke('languages-getLanguagesWithExpressionUI'),
    getLanguagesWithLinksAdapter:  ()       => ipcRenderer.invoke('languages-getLanguagesWithLinksAdapter'),
    getConstructorIcon:     (lang)          => ipcRenderer.invoke('languages-getConstructorIcon', lang),
    createPublicExpression: (lang, content) => ipcRenderer.invoke('languages-createPublicExpression', lang, content),
    getIcon:                (lang)          => ipcRenderer.invoke('languages-getIcon', lang),
    getSettingsIcon:        (lang)          => ipcRenderer.invoke('languages-getSettingsIcon', lang),
    getExpression:          (expr)          => ipcRenderer.invoke('languages-getExpression', expr),
    interact:               (expr, call)    => ipcRenderer.invoke('languages-interact', expr, call),
    getSettings:            (lang)          => ipcRenderer.invoke('languages-getSettings', lang),
    putSettings:            (lang, settings)=> ipcRenderer.invoke('languages-putSettings', lang, settings),
}