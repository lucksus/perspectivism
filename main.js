require = require("esm")(module/*, options*/)
module.exports = require("./main.js")
const { Crypto } = require("@peculiar/webcrypto");
global.crypto = new Crypto();
const { app, BrowserWindow } = require('electron')
const express = require('express')
const ad4m = require('@perspect3vism/ad4m-executor')

const fs = require('fs')
const path = require('path')
const getAppDataPath = require('appdata-path')

const worldLinkLanguageHash = 'QmchPr6NgxFUrrETHrd49DSRdfFMdn6A5sw2JSXhujy4gS'
let bootstrapFixtures = {
  worldPerspective: JSON.parse(fs.readFileSync('./bootstrap/world.perspective.json')),
  worldLinkLanguageHash,
  worldLinkLinguageBundle:  fs.readFileSync(path.join('./bootstrap/', worldLinkLanguageHash, 'bundle.js')),
  worldLinkLinguageMeta: JSON.parse(fs.readFileSync(path.join('./bootstrap/', worldLinkLanguageHash, 'meta.json'))),
}
const {ipcMain} = require('electron');
const { exit } = require("process");

let jwt
let spawnExecutor = false
console.log(process.argv)
if(process.argv.length > 3 && (process.argv[2] === "executor")) {
  spawnExecutor = true
}

ipcMain.on('executor-spawned', (event, arg) => {
  event.returnValue = spawnExecutor
})

let ad4mCore
app.whenReady().then(() => {
  let executorPort
  if (spawnExecutor) {
    executorPort = 4000
    ad4m
    .init({
      appDataPath: __dirname,
      resourcePath: __dirname,
      appDefaultLangPath: "./src/languages",
      networkBootstrapSeed: "./bootstrap/mainnetSeed.json",
      bootstrapFixtures: {
        languages: [],
        perspectives: [{
          address: '__world',
          expression: bootstrapFixtures.worldPerspective
        }]
      },
      appBuiltInLangs: [
        "social-context",
        "note-ipfs",
        "virtual-icons"
      ],
      mocks: false
    })
    .then((core) => {
      ad4mCore = core
  
      console.log(
        "\x1b[36m%s\x1b[0m",
        "Starting account creation splash screen"
      );
  
      const splash = createSplash()
      ipcMain.on('connection-request', (event, arg) => {
        event.returnValue = { executorPort, jwt: '' }
      })

      ad4mCore.waitForLanguages().then(async () => {
        createWindow()
        splash.close()
      });
    });
  }
  else {
    try {
      executorPort = fs.readFileSync(path.join(getAppDataPath(), '/ad4m/executor-port'), {encoding:'utf8', flag:'r'})
    }
    catch(err) {
      console.log('Unable to find executor port. Please make sure ad4m executor is running.')
      app.exit(0)
      process.exit(0)
    }
    try {
      jwt = fs.readFileSync(path.join(getAppDataPath(), '/perspect3ve/capability-token'), {encoding:'utf8', flag:'r'})
    }
    catch(e) {
      console.log('capability token not found')
      jwt = ''
    }
    //const win = createWindow()
    const splash = createSplash()
    ipcMain.on('connection-request', (event, arg) => {
      event.returnValue = { executorPort, jwt }
    })
    ipcMain.on('valid-jwt', (event, arg) => {
      // store jwt - overwrite existing if exists
      console.log('jwt', arg)
      jwt = arg 
      if (fs.existsSync(path.join(getAppDataPath(), '/perspect3ve'))===false) {
        fs.mkdirSync(path.join(getAppDataPath(), '/perspect3ve'),0777);
      }
      fs.writeFileSync(path.join(getAppDataPath(), '/perspect3ve/capability-token'), jwt)
      splash.close()
      setTimeout(() => {}, 200)
      createWindow()
    })
  }
})

function createSplash () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    },
    minimizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
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
      contextIsolation: false
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
app.on('window-all-closed', async () => {
  // await ad4mCore.exit()
  app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

serveUI()