import socket
import torch
import torchvision.transforms as transforms
from VGG16 import VGG16
from PIL import Image
import numpy as np
import json
import socket
import torch
import torchvision.transforms as transforms
from VGG16 import VGG16
from PIL import Image
import numpy as np
import json

labels = ['Paper', 'Rock', 'Scissor']
path = ''
def readImage(data):
    data = np.reshape(data, (224,224))
    img = Image.fromarray(data)
#     img = Image.open(str(path)).convert('RGB')
    return img
def preprocessImage(img):
    show_process = transforms.Compose([
        transforms.CenterCrop(224)
    ])
    show_process(img).show()
    preprocess = transforms.Compose([
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),  # 标准化
    ])
    tensor = preprocess(img)
    return tensor

def predict(img) -> (torch.tensor, str):
    tensor = preprocessImage(img)
    tensor = torch.unsqueeze(tensor, dim=0)
    with torch.no_grad():
        _, outputs = module(tensor)
        _, predicted = torch.max(outputs.data, 1)
    print('predicted:', labels[predicted])
    return outputs.data, labels[predicted]

flag = 0
buffer = np.zeros((0))
# communication
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind(('127.0.0.1', 12345))
    s.listen(1)

    # init module
    module = torch.load('module.pkl', map_location=torch.device('cpu'))
    module.eval()
    
    c, addr = s.accept()    
    c.send(json.dumps({'type':'event', 'data':'loaded'}).encode('gbk'))
    with c:
        print(addr, "connected.")
        while True:
            # preprocess
            raw_data = bytes.decode(c.recv(0))
            if not raw_data: break
            # remove \n
            if raw_data[-1] == '\n':
                raw_data = raw_data[0:-1]
            data = json.loads(raw_data)
            # exit signal
            if not raw_data or raw_data == 'exit':
                break
            # tranfer signals
            if data['type'] == 'event':
                if data['data'] == 'transfer start':
                    flag = 1
                elif data['data'] == 'transfer end':
                    flag = 0
                    output, prediction = predict(readImage(buffer))
                    c.sendall(str.encode(prediction) + b'\n')
            # receiving
            if data['type'] == 'tensorBuffer' and flag:
                buffer.append(np.array(data['data']))

print('Connection closed.')
