import React from 'react';
import { message, Spin } from 'antd';
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
        console.log('ComponentDidMount');
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
                            this.getFrame();
                        }, 10000);
                    }
                    break;
                default:
                    break;
            }
        });
        socket.on('connect_error', () => { message.error('ERROR!') })

    }

    async getFrame() {
        console.log('Getting frame');
        const video = document.getElementById("video");
        var canvas = document.createElement("canvas");
        canvas.width = 1440;
        canvas.height = 960;  // Video dimensions. See camera.js
        canvas.getContext('2d')
            .drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
            const tensor = tf.browser.fromPixels(canvas);
            const arrayTensor = await tensor.data();
            await this.sendFrame(arrayTensor, 1024);
            await this.state.socket.emit('data', { type: 'event', data: 'transfer complete' });
            console.log('Send complete');
            // console.log("Tensor:"+arrayTensor);
        } catch (e) {  // Width 0 error
            console.log(e);
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

    async sendFrame(frame, bufferSize) {
        const stringTensor = frame.toString();
        var startIndex, endIndex;
        console.log(stringTensor);
        await this.state.socket.emit('data', { type: 'event', data: 'transfer start'});
        for (let i=0; i < stringTensor.length; i+=bufferSize) {
            startIndex = i;
            endIndex = i + bufferSize;
            if (endIndex > stringTensor.length) endIndex = stringTensor.length;
            await this.state.socket.emit('data', { type: 'tensorBuffer', data: stringTensor.slice(startIndex, endIndex)});
        }
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
                    <WebCamWebAPI/>
                    <h1>Prediction: {this.state.prediction}</h1>
                </>
            );
        }
    }
}

export default App;
