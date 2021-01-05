import React from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

// class DragUpload extends React.Component {
  
// }

function processRequest({ onSuccess, data, filename, file}) {
  console.log(onSuccess, data, filename, file);
}

function beforeUpload(file) {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传JPG或PNG格式的文件！');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小必须小于2MB！');
  }
  return isJpgOrPng && isLt2M;
}

function loadImage(callback) {
  const { file, onSuccess } = callback;
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.addEventListener('load', () => {
    const imageData = reader.result;
    this.setState({
      imageData,
      imageName: file.name,
      loading: false,
    });
    onSuccess();
    console.log(this.state)
  });
}

export const DragUpload = () => {
  return (
    <Dragger
      multiple={false}
      customRequest={processRequest}
      beforeUpload={beforeUpload}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag file to this area to upload</p>
      <p className="ant-upload-hint">
        Support for a single or bulk upload. Strictly prohibit from uploading company data or other
        band files
      </p>
  </Dragger>
  );
}