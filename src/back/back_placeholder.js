const fs = require('fs');

var loaded = true;

console.log("CWD: "+process.cwd());

// Build HTTP server
var http = require('http');
var httpServer = http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html', 
        "Access-Control-Allow-Origin": "http://localhost:3000"});
  });
const io = require("socket.io")(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });
httpServer.listen(1616);

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

// Connection with frontend
io.on('connection', async (socket) => {
    console.log('Connection received.');
    await socket.emit('data', { type: 'event', data: 'connected' }); // Tell client it is connected
    if (loaded) { await socket.emit('data', { type: 'event', data: 'loaded' }) }

    // Backend-Frontend IO
    var currentBuffer = [];
    socket.on('data', async (data) => {  // Receive tensor data from client
        // console.log('Data received from client:'+JSON.stringify(data));
        switch (data.type) {
            case 'tensorBuffer':
                // currentBuffer.push(data.data);
                // socket.emit('data', {type: 'event', data: 'received'});
                fs.appendFile('mockstdin.dat', data.data, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });
                break;
            case 'event':
                switch (data.data) {
                    case 'transfer start':
                        fs.appendFile('mockstdin.dat', '{"type": "tensor", "data": "[', function (err) {
                            if (err) throw err;
                            console.log('Saved!');
                        });
                        break;
                    case 'transfer complete':
                        // console.log('Send to model:'+currentBuffer.join());
                        fs.appendFile('mockstdin.dat', ']"}\n', function (err) {
                            if (err) throw err;
                            console.log('Saved!');
                        });
                        await socket.emit('data', {type: 'event', data: 'received'});
                        await socket.emit('data', {type: 'pred', data: 'Rock'})
                        currentBuffer = [];
                        break;
                    default: break;
                }
                break;
            default: break;
        }
    });
    socket.on('disconnect', (reason) => {
        console.log('Disconnected due to '+reason);
    })
});


