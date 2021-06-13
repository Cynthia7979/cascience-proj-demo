const fs = require('fs');
const spawn = require('child_process').spawn;
const path = require('path');
const process = require('process');

// Connect to model
const model = spawn('obj-detect_demo_2020-2021.exe', [path.join(process.cwd(), 'module.pt')]);
var loaded = true;

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

async function JSONtoArrayString(j) {
    // 三维数组拉成一维，空格分隔的数组
    // 如：[[[1,2,3], [4,5,6]], [[7,8,9], [10,11,12]]]
    // 将被转换为如下str：
    // "1 2 3 4 5 6 7 8 9 10 11 12 \n"
    var arrayString = '';
    for await (let twoDArray of j) {
        for await (let oneDArray of twoDArray) {
            arrayString += oneDArray.join(' ');
            arrayString += ' ';
        }
    }
    arrayString += '\n';
    return arrayString;
}

// Basic model IO
model.stderr.on('data', (data) => {console.log(data.toString())})
model.stdout.on('data', (raw) => {
    // try {
    //     let { data } = raw.toJSON();
    //     data = JSON.parse(ab2str(data));  // Convert Buffer to JSON
    //     console.log('basicIO listening:', data);
    //     console.log('type:'+data.type);
    //     if (data.type == 'event') {
    //         console.log('It is an event');
    //         if (data.data == 'loaded') {
    //             loaded = true;
    //             console.log('Loaded set to true');
    //         }
    //     } else console.log("Not an event");
    // } catch {
    //     console.log('debug message:'+abs2str(raw.toJSON()));
    // }
    console.log(raw);
    
});
model.on('exit', (code) => {
    console.log(`FATAL: model exited with code ${code}`);
    // process.exit();
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
                let arrayString = await JSONtoArrayString(data.data);
                model.stdin.write(arrayString);
                fs.writeFile('./mockstdin.dat', arrayString, (err) => {if (err) throw err});
                // model.stdin.write(JSON.stringify(data.data)+'\n');
                break;
            // History code ↓
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
    model.stdout.on('data', async (raw) => {
        try {
            socket.emit('data', { type: 'forward', data: raw });  // Forward package for debugging
            console.log('Model-Socket IO listening:'+ab2str(JSON.stringify(raw)));
            let data = ab2str(raw).split();
            console.log('data'+data);
            let number_data = [];
            for await (let i of data) {
                number_data.push(i * 1);
            }
            let pred = ['Rock', 'Paper', 'Scissors'][data.indexOf(Math.max(...number_data))];
            console.log('pred:'+pred);
            socket.emit('data', {
                type: 'pred', 
                data: pred
            });
        } catch {
            console.log('debug message:'+ab2str(raw.toJSON()));
        }

    })
});


