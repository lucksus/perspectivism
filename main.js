require = require("esm")(module/*, options*/)
module.exports = require("./main.js")
const { app, BrowserWindow, ipcMain } = require('electron')
const express = require('express')
const expressApp = express()

const Config = require('./src/main-thread/Config')
const Gun = require('./src/main-thread/Gun')
const IPFS = require('./src/main-thread/IPFS')
const PerspectivesController = require('./src/main-thread/PerspectivesController')
const LinkRepoController = require('./src/main-thread/LinkRepoController')
const LanguageController = require('./src/main-thread/LanguageController')
const GraphQL = require('./src/main-thread/GraphQL')

Config.init()
const gun = Gun.init(Config.dataPath)
IPFS.init().then((IPFS) => {
  const agent = { did: 'did:local-test-agent' }
  const context = { agent, IPFS }
  const perspectivesController = PerspectivesController.init(Config.rootConfigPath)
  const languageController = LanguageController.init(context)
  const linkRepoController = LinkRepoController.init({gun, languageController, agent})
  GraphQL.startServer(perspectivesController, languageController, linkRepoController).then(({ url, subscriptionsUrl }) => {
    console.log(`🚀  GraphQL Server ready at ${url}`)
    console.log(`🚀  GraphQL subscriptions ready at ${subscriptionsUrl}`)
  })

  console.log("Installed languages:", JSON.stringify(languageController.getInstalledLanguages()))

  app.whenReady().then(() => {
    const win = createWindow()
    languageController.addLinkObserver((added, removed, langRef) => {
      win.webContents.send("links-incoming", added, removed, langRef)
    })
  })
})

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/public/index.html`)

  // Open the DevTools.
  win.webContents.openDevTools()

  return win
}

function serveUI() {
  expressApp.use(express.static(`${__dirname}/public`))
  expressApp.listen(9090)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

serveUI()