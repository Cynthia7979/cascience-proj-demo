import React from "react";
import {Button,Row, Col, Select, message, Result}  from "antd";
 
const { Option } = Select;
//调用高拍仪使用webapi
export default class WebCamWebAPI extends React.Component{
 
    constructor(props) {
        super(props);
        this.state = {
            defalutSelectedDevice : '',
            mediaDeviceList : [],
            deviceId : "",
            mediaStream : null,
            deviceActive : false,
            fileTypes : [],
            fileTypeSeq : 0,
            addFinish : null,
            tips : ""
        };
    }
 
    componentDidMount(){
        this.setDeviceList();
        this.requestFileTypes();
    }
    //获取证件类型
    requestFileTypes = () => {
            const {fileTypes} = this.props;
            if(typeof (fileTypes) === 'undefined' || fileTypes.length === 0){
                return;
            }
            console.log(fileTypes);
            //是够已经添加
            let addFinishObj = {};
            if(fileTypes.length > 0){
                for (let i in fileTypes){
                    addFinishObj[fileTypes[i].TYPE_CODE] =  0
                }
                console.log(addFinishObj);
            }
            this.setState({
                fileTypes : fileTypes,
                addFinish : addFinishObj
            });
    };
    //连接相机
    connectDevice = (deviceId) => {
        //先关闭当前正在运行摄像头
        if(null != this.state.mediaStream){
            this.onCloseDevice();
        }
        //打开新选择摄像头
        if (navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
            //调用用户媒体设备, 访问摄像头
            this.getUserMedia({video : {width: 224, height: 224,deviceId : {exact : deviceId}}}, this.success, this.error);
        } else {
            message.info('不支持访问媒体');
        }
    };

    //获取设备列表并设置到设备列表
    setDeviceList =async () => {
        let deviceArray =await navigator.mediaDevices.enumerateDevices();
        if(deviceArray.length > 0){
            let mediaDeviceList = [];
            for (let i in deviceArray){
                if(deviceArray[i].kind === 'videoinput'){
                    let obj ={
                        "value": deviceArray[i].deviceId,
                        "label": deviceArray[i].label
                    };
                    mediaDeviceList.push(obj);
                }
            }
            //判断是否有可用的视频输入设备
            if(mediaDeviceList.length > 0){
                this.setState({
                    mediaDeviceList,
                    defalutSelectedDevice : mediaDeviceList[0].value,
                    deviceId :  mediaDeviceList[0].value
                });
                this.connectDevice();
            }else {
                this.setState({
                    tips : "没有可用照片采集设备或者浏览器不支持此功能，请保证设备可正常使用(此方式不支持IE浏览器)"
                });
            }
        }else {
            message.info("没有可用设备或设备不可用！");
        }
    };

    //访问用户媒体设备的兼容方法
    getUserMedia = (constraints, success, error) => {
        if (navigator.mediaDevices.getUserMedia) {
            //最新的标准API
            navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
        } else if (navigator.webkitGetUserMedia) {
            //webkit核心浏览器
            navigator.webkitGetUserMedia(constraints,success, error)
        } else if (navigator.mozGetUserMedia) {
            //firfox浏览器
            navigator.mozGetUserMedia(constraints, success, error);
        } else if (navigator.getUserMedia) {
            //旧版API
            navigator.getUserMedia(constraints, success, error);
        }
    };

    //成功回调
    success = (stream) => {
        let video = document.getElementById('video');
        //将视频流设置为video元素的源
        this.setState({mediaStream : stream, deviceActive : true});
        //video.src = CompatibleURL.createObjectURL(stream);
        video.srcObject = stream;
        video.play();
 
    };
    //失败回调
    error = (error) => {
        console.log(`访问设备失败${error.name}, ${error.message}`);
    };

    //验证canvas画布是否为空函数
     isCanvasBlank = (canvas) => {
        var blank = document.createElement('canvas');//系统获取一个空canvas对象
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();//比较值相等则为空
    };
 
    render() {
        return (<div>{this.state.tips === "" ? <div style={{backgroundColor: "#FFF", padding: '20px'}}>
            <Row>
                <Col span={12} key={1}>
                    <video id="video" width="400" height="320" controls>
                    </video>
                    <Row style={{marginTop: "36px"}}>
                        <div>
                            设备列表 : <Select style={{width: '180px'}}
                                           value={this.state.defalutSelectedDevice}
                                           onChange={(value) => {
                                               this.setState({
                                                   defalutSelectedDevice: value,
                                               });
                                               this.connectDevice(value);
                                           }}
                                           notFoundContent="没有可用的设备"
                        >
                            {this.state.mediaDeviceList.length > 0 ? this.state.mediaDeviceList.map((item, index) => {
                                return (<Option key={index} value={item.value}>{item.label}</Option>);
                            }) : null}
                        </Select>
                        </div>
                    </Row>
                </Col>
            </Row>
        </div> : <Result status="warning" title={this.state.tips}
                         extra={<Button type="danger" style={{float: "right", marginLeft: '36px'}} onClick={() => {
                             //关闭窗口
                             if (typeof (this.props.onClose) != 'undefined') {
                                 this.props.onClose();
                             }
                         }}>关闭</Button>}/>}</div>);
    }
}
