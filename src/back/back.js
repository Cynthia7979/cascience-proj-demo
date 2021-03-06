const fs = require('fs');
const spawn = require('child_process').spawn;
const path = require('path');
const process = require('process');

// Connect to model
const model = spawn('obj-detect_demo_2020-2021.exe', [path.join(process.cwd(), 'module.pt')]);
var loaded = false;

console.log("CWD: "+process.cwd());
console.log("Module path: "+path.join(process.cwd(), 'module.pt'))

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

// Basic model IO
model.stderr.on('data', (data) => {console.log("Error from model: "+data.toString())})
model.stdout.on('data', (raw) => {
    let { data } = raw.toJSON();
    data = JSON.parse(ab2str(data));  // Convert Buffer to JSON
    console.log('basicIO listening:', data);
    console.log('type:'+data.type);
    if (data.type == 'event') {
        console.log('It is an event');
        if (data.data == 'loaded') {
            loaded = true;
            console.log('Loaded set to true');
        }
    } else console.log("Not an event");
});
model.on('exit', (code) => {
    console.log(`model exited with code ${code}`);
    process.exit();
});

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
            case 'tensor':
                console.log('Received array tensor data');
                fs.writeFile('./mockstdin.dat', JSON.stringify(data.data), (err) => {if (err) throw err});
                model.stdin.write(JSON.stringify(data.data));
                model.stdin.write('\n');
                break;
            case 'tensorBuffer':
                const toWrite = data.data.replace('\n\g', '');
                model.stdin.write(toWrite);
                // currentBuffer.push(data.data);
                // await socket.emit('data', {type: 'event', data: 'received'});
                break;
            case 'event':
                switch (data.data) {
                    case 'transfer start':
                        model.stdin.write('{"type": "tensor", "data": [');
                        break;
                    case 'transfer complete':
                        // model.stdin.write(currentBuffer.join());
                        model.stdin.write(']}\n');
                        await socket.emit('data', {type: 'event', data: 'received'});
                        currentBuffer = [];
                        break;
                    default: break;
                }
                break;
            default: break;
        }
    });
    socket.on('disconnect', (reason) => {
        model.stdout.removeAllListeners();
        console.log('Disconnected due to '+reason);
    })

    // Build model IO logic
    model.stdout.on('data', (raw) => {
        socket.emit('data', { type: 'forward', data: raw });  // Forward package for debugging
        let { data } = raw.toJSON();
        data = JSON.parse(ab2str(data));  // Convert Buffer to JSON
        console.log('Model-Socket IO listening:'+JSON.stringify(data));
        console.log(`type=${data.type}, data=${(data.data)}`)

        switch (data.type) {
            case 'tensor':
                socket.emit('data', {
                    type: 'pred', 
                    // data: ['Rock', 'Paper', 'Scissors'][data.data.indexOf(1)]
                    data: data.data
                });
                break;
            case 'event':
                if (data.data == 'loaded') {
                    socket.emit('data', { type: 'event', data: 'loaded'});
                    loaded = true;
                }
            default: break;
        }
    })
});


