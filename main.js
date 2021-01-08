require = require("esm")(module/*, options*/)
module.exports = require("./main.js")
const { app, BrowserWindow, ipcMain } = require('electron')
const express = require('express')
const PerspectivismCore = require('./src/main-thread/PerspectivismCore')
const core = PerspectivismCore.create()

app.whenReady().then(() => {  
  core.initServices()
  core.startGraphQLServer()
  const splash = createSplash()
  core.waitForAgent().then(() => {
    core.initControllers()
    createWindow()
    splash.close()
  })
})

function createSplash () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/public/splash.html`)

  // Open the DevTools.
  //win.webContents.openDevTools()

  return win
}

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
  const expressApp = express()
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