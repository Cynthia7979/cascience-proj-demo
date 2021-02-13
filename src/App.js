import React from 'react';
import {Button} from 'antd';
import socketIOClient from 'socket.io-client';
import './App.css';


class App extends React.Component {
    state = {
        child: null,
        socket: socketIOClient("http://localhost:1616"),
        data: null
    }

    componentDidMount() {
        // this.state.child.stdout.on('data', function (data) {
        //     console.log(data.toString());
        // });
        // this.state.child.stdin.write('Msg from Node.js');
        const { socket } = this.state;
        socket.on('data', (data) => { // listen to news event raised by the server
            console.log(data);
            this.setState({data: data});
        });
        socket.on('connect_error', () => {console.log('ERROR!')})
    }

    async sendRequest() {
        await this.state.socket.emit('event', {hello: 'world'});
        console.log('sent!');
    }

    render() {
        console.log(this.state.data);
        return (
            <div>
                <br/>

                <Button onClick={async () => this.sendRequest()}>
                    Click Me
                </Button>
            </div>
        );
    }
}

export default App;
