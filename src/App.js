import React from 'react';
import { Button, message, Spin } from 'antd';
import WebCamWebAPI from './camera';
import socketIOClient from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import './App.css';


class App extends React.Component {
    state = {
        socket: socketIOClient("http://localhost:1616"),
        data: '',
        prediction: 'null',
        loaded: false,
    }

    componentDidMount() {
        const { socket } = this.state;
        socket.on('data', (data) => {
            console.log(data);
            switch (data.type) {
                case 'pred':
                    this.setState({prediction: data.data});
                    break;
                case 'event':
                    if (data.data === 'loaded') {  // Model loaded
                        this.setState({ loaded: true });
                        setInterval(() => {
                            this.sendFrame();
                        }, 5000);
                    }
                    break;
                default:
                    break;
            }
        });
        socket.on('connect_error', () => { message.error('ERROR!') })

    }

    sendFrame() {
        console.log('Getting frame');
        const video = document.getElementById("video");
        var canvas = document.createElement("canvas");
        canvas.width = 1440;
        canvas.height = 960;  // Video dimensions. See camera.js
        canvas.getContext('2d')
            .drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
            const tensor = tf.browser.fromPixels(canvas);
            this.state.socket.emit('data', { type: 'tensor', data: tensor });
        } catch (e) {  // Width 0 error
            return;
        }
        // var img = document.createElement("img");
        // img.src = canvas.toDataURL('image/png');
        // console.log(img);
        // return(
        //     <div>
        //         <img id="frame" src={canvas.toDataURL('image/png')} alt=''/>
        //     </div>
        // )
    }

    async sendRequest() {
        await this.state.socket.emit('event', {hello: 'world'});
        console.log('sent!');
    }

    render() {
        const { loaded } = this.state;
        console.log(this.state.data);
        if (!loaded) {
            return (
                <>
                    <Spin
                        size="large"
                        wrapperClassName='load-spin'
                    />
                </>
            )
        } else {
            return (
                <>
                    <br/>
                    <Button onClick={async () => this.sendRequest()}>
                        测试socket
                    </Button>
                    {this.state.data.type}
                    <WebCamWebAPI/>
                    <h1>Prediction: {this.state.prediction}</h1>
                    {this.state.image}
                </>
            );
        }
    }
}

export default App;
