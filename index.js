const {app, BrowserWindow, ipcMain, session, protocol} = require('electron');
const {exec, fork} = require('child_process');
const axios = require('axios');
const _ = require('lodash');
const debug = require('electron-debug');
const request = require('request');
const Agent = require('socks5-http-client/lib/Agent');


debug();

var path = require('path');

const DEBUG = true;
var proxy = '';

app.on('ready', () => {
    console.log('app ready');
    var devServerProc = exec('node ./app/app.js');

// Make a request for a user with a given ID
/*
axios.get('http://hxcnetwork.com/api/proxies')
  .then(function (response) {
    // handle success
    console.log(response);
    var proxies = response.data.proxies;
    var selected = proxies[_.random(0, proxies.length - 1)];
    proxy = `${selected.type}://${selected.address}:${selected.port}`;

    //let config = {proxyRules: proxy};


protocol.interceptHttpProtocol("http", (req, callback) => {
  if (req.url === "http://127.0.0.1:2000") {
    var options = {
      url: "http://127.0.0.1:2000",
        agentClass: Agent,
        agentOptions: {
            socksHost: selected.address,
            socksPort: selected.port
        }
    }
    console.log('Proxying streaming');
    console.log(options)
    return callback(request(options).pipe(callback));
  } else {
    return callback({cancel: false, redirectUrl: false});
  }
});

  })

*/

  //exec('node ./app/server.js');
  console.log('creating window');
  let win = new BrowserWindow({
    name: 'App',
    frame: false,
    minWidth: 960,
    minHeight: 720,
    width: 1200,
    height: 720,
    webPreferences: {
      //preload:path.resolve(__dirname, 'window.js'),
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true,
      nativeWindowOpen: true,
      nodeIntegrationInWorker: true,
      plugins: true,
    },
  });
  win.maximize();
  win.loadURL(`file://${path.resolve('./loading.html')}`);
  win.on('closed', () => {
    win = null;
  });

  win.setMenu(null);

  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on('window:minimize', () => {
    win.minimize();
  });

  ipcMain.on('window:close', () => {
    win.close();
  });

  //console.log(devServerProc);
  devServerProc.stdout.on('data', data => {
    let res = data.toString();

    console.log('Resonse ' + res);

    if (res.includes('listening')) {
      setTimeout(() => {
        win.loadURL(`file://${path.resolve('./window.html')}`);
      }, 3000)
      //console.log('Sending render signal');
      //win.webContents.send('render', 'whoooooooh!');
      //ipcMain.emit('render');
      if (DEBUG) {
        //        win.webContents.openDevTools();
      }
    }
  });
  devServerProc.stdout.on('error', err => {
    console.error(err);
  });
  devServerProc.stdout.on('error', err => {
    console.error(err);
  });
  devServerProc.on('exit', err => {
    console.log('Server exited');
  });
});

app.on('before-quit', () => {
  console.log('killing server')
  devServerProc.kill('SIGINT');
  devServerProc = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (win === null) createWindow();
});
