var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var getport = require('getport');
var spawn = require('child_process').spawn;
var parseTorrent = require('parse-torrent');
var path = require('path');
var request = require('request');
var Agent = require('socks5-http-client/lib/Agent');
var axios = require('axios');
var _ = require('lodash');

var processes = {}; // Peerflix processes
var users = 0;

app.all('/stream', (req, res) => {
 axios.get('http://hxcnetwork.com/api/proxies')
  .then(function (response) {
    // handle success
    console.log(response);
    var proxies = response.data.proxies;
    var selected = proxies[_.random(0, proxies.length - 1)];
    proxy = `${selected.type}://${selected.address}:${selected.port}`;

     var options = {
      url: "http://127.0.0.1:2000",
        agentClass: Agent,
        agentOptions: {
            socksHost: selected.address,
            socksPort: selected.port
        }
     }
    console.log('Proxying stream:')
    console.log(options)
    request(options).pipe(res); 
  });
})

server.listen(3000, function () {
  console.log('app listening on port 3000!');
});

app.use(express.static('app/public'));

function printProcesses() {
  console.log("------------------RUNNING PROCESSES------------------");
  for(var p in processes) {
    console.log(processes[p].name + " | Port:" + processes[p].port + " | Spectators: " + processes[p].spectators);
  }
  console.log("-----------------------------------------------------");
}

io.on('connection', function (socket) {
  users++;
  console.log("Connected users : " + users);

  socket.on('disconnect', function() {
    users--;
    console.log("Connected users : " + users);

    if(socket.playing != undefined) {
      processes[socket.playing].spectators--;
      if(processes[socket.playing].spectators === 0) {
        processes[socket.playing].child.kill();
        delete processes[socket.playing];
      }
    }
    printProcesses();
  });

  socket.on('cancelTorrent', function () {
    if(!socket.playing) return;
    processes[socket.playing].spectators--;
    if(processes[socket.playing].spectators === 0) {
      processes[socket.playing].child.kill();
      delete processes[socket.playing];
    }
    socket.playing = null;
    printProcesses();
  });

  socket.on('getTorrent', function (data) {
    var torrent = data.torrent

    // There is already a stream running, kill it
    if(socket.playing && process[socket.playing] != torrent) {
      processes[socket.playing].spectators--;
      if(processes[socket.playing].spectators === 0) {
        processes[socket.playing].child.kill();
        delete processes[socket.playing];
      }
      socket.playing = null;
    }

    // A process already exists for this torrent
    if(processes[torrent]) {
       port = processes[torrent].port;
       processes[torrent].spectators++;
       socket.playing = torrent;
       socket.emit('port', port);
       printProcesses();
       return;
    }

    // Create a new process
    getport(function (err, port) {
      if (err) console.log(err);

      var process = {};
      var child = spawn('./peerflix', [torrent, '--port='+ port, '--tmp=./tmp', '--remove'], {});
      process.child = child;
      process.port = port;
      process.spectators = 0;

      processes[torrent] = process;
      processes[torrent].spectators++;

      parseTorrent.remote(torrent, function (err, parsedTorrent) {
        if (err) throw err
        processes[torrent].name = parsedTorrent.name;
        printProcesses();
      })

      socket.playing = torrent;

      setTimeout(() => {
        socket.emit('port', port);
      }, 1000);

      child.stdout.on('data', function(data) {
        //console.log('stdout: ' + data);
      });
      child.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
      });
      child.on('close', function (code, signal) {
        console.log('child closed');
      });
    });
  });
});
