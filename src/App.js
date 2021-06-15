import React from 'react';
import { message, Spin } from 'antd';
import WebCamWebAPI from './camera';
import socketIOClient from 'socket.io-client';
import * as tf from '@tensorflow/tfjs';
import './App.css';

function tensor2array_3d_helper(tensor){
    // transfer the 3d-tf.tensor to 3d-jsarray
    const _1darray = Array.from(tensor.dataSync());
    const [m,n_h,n_w] = [3, 224, 224];
    const _3darray = [];
    for(let i = 0; i < m; i++){
        let demo = new Array(n_h);
        for(let j = 0; j < n_h; j++){
            demo[j] = [];
            for(let k = 0; k < n_w; k++){
                demo[j][k] = _1darray[i*n_h*n_w + j*n_w + k];
            }
        }
        _3darray.push(demo);
    }
    return _3darray;
    // 返回一个四维数组
}
// ————————————————
// 版权声明：本文为CSDN博主「韩澈」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
// 原文链接：https://blog.csdn.net/qq_44354981/article/details/105018786

class App extends React.Component {
    state = {
        //socket: socketIOClient("http://localhost:1616"), // old code
        socket: socketIOClient("http://localhost:6666"),
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
                    this.setState({prediction: JSON.stringify(data)});
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
        canvas.width = 224;
        canvas.height = 224;  // Video dimensions. See camera.js
        canvas.getContext('2d')
            .drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
            const tensor = tf.browser.fromPixels(canvas);
            const arrayTensor = tensor2array_3d_helper(tensor);
            console.log('Shape:'+arrayTensor.length);
            console.log(arrayTensor);
            await this.state.socket.emit('data', { type: 'tensor', data: arrayTensor});
            console.log('Send complete');
        } catch (e) {  // Width 0 error as the result of not loading successfully
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
