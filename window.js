const ElectronTitlebarWindows = require('electron-titlebar-windows');
const ipcRenderer = require('electron').ipcRenderer;



const webview = document.querySelector('webview')
webview.addEventListener('dom-ready', () => {
  webview.openDevTools()
})

const titlebar = new ElectronTitlebarWindows({
	draggable: true,
	backgroundColor:'#0d2231'
});

titlebar.appendTo(document.querySelector('#titlebar'));

titlebar.on('maximize', function() {
	ipcRenderer.send('window:maximize');
})

titlebar.on('minimize', function() {
	ipcRenderer.send('window:minimize');
})

titlebar.on('close', function() {
	ipcRenderer.send('window:close');
})
