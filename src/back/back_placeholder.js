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

io.on('connection', (socket) => {
    socket.emit('data', { type: 'event', data: 'connected' }); // Send data to client
    socket.emit('data', { type: 'event', data: 'loaded' })  // Simulate model load
    socket.on('data', (data) => {
        switch (data.type) {
            case 'tensor':
                console.log(data.data);
                socket.emit('data', { type: 'pred', data: 'Rock' });  // Simulate prediction
        }
    });
});

console.log('running');
