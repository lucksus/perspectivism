const { ipcRenderer } = require('electron')

module.exports =  {
    getInstalledLanguages:  ()              => ipcRenderer.invoke('languages-getInstalled'),
    getLanguagesWithExpressionUI:  ()       => ipcRenderer.invoke('languages-getLanguagesWithExpressionUI'),
    getLanguagesWithLinksAdapter:  ()       => ipcRenderer.invoke('languages-getLanguagesWithLinksAdapter'),
    getConstructorIcon:     (lang)          => ipcRenderer.invoke('languages-getConstructorIcon', lang),
    createPublicExpression: (lang, content) => ipcRenderer.invoke('languages-createPublicExpression', lang, content),
    getIcon:                (expr)          => ipcRenderer.invoke('languages-getIcon', expr),
    getExpression:          (expr)          => ipcRenderer.invoke('languages-getExpression', expr),
    interact:               (expr, call)    => ipcRenderer.invoke('languages-interact', expr, call),
}