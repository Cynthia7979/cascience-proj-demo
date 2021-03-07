const spawn = require('child_process').spawn;
const process = require('process');

// Connect to model
const model = spawn('obj-detect_demo_2020-2021.exe', ['./module.pt']);
var loaded = false;

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

// // Basic model IO
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
io.on('connection', (socket) => {
    console.log('Connection received.');
    socket.emit('data', { type: 'event', data: 'connected' }); // Tell client it is connected
    if (loaded) { socket.emit('data', { type: 'event', data: 'loaded' }) }

    // Backend-Frontend IO
    socket.on('data', (data) => {  // Receive tensor data from client
        console.log('Data received from client:'+JSON.stringify(data));
        switch (data.type) {
            case 'tensor':
                model.stdin.write(data.data);
                socket.emit('data', {type: 'event', data: 'received'});
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


