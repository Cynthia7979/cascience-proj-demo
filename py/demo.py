import numpy as np
import torch
import torchvision.transforms as transforms
import tensorflow as tf
import json
from VGG16 import VGG16
from PIL import Image
from cv2 import *

import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

FONT = FONT_HERSHEY_SIMPLEX
BLACK = (0  , 0  , 0  )
WHITE = (255, 255, 255)


def main():
    print('Starting')
    capture = VideoCapture(1+CAP_DSHOW)

    # init module
    module = torch.load('module.pkl', map_location=torch.device('cpu'))
    module.eval()

    while True:
        return_value, frame = capture.read()
        frame = cvtColor(frame, COLOR_BGR2RGBA)
        # frame = resize(frame, (1280, 720))
        print(frame.shape)
        if waitKey(1) & 0xFF == ord('q'):  # 对不起 我孤陋寡闻.jpg
            break
        print(frame)
        output, prediction = predict(preprocessImage(readImage(frame)), module)
        putText(frame, prediction,
                0, 0,
                FONT, color=BLACK, thickness=2, lineType=LINE_AA)

        imshow('demo', frame)


def readImage(frame):
    img = Image.fromarray(frame)
    img = Image.resize(img)
    return img


def preprocessImage(img):
    # show_process = transforms.Compose([
    #     transforms.CenterCrop(224)
    # ])
    # show_process(img).show()
    preprocess = transforms.Compose([
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),  # 标准化
    ])
    tensor = preprocess(img)
    return tensor


def predict(img, module, labels=('Paper', 'Rock', 'Scissor')) -> (torch.tensor, str):
    tensor = preprocessImage(img)
    tensor = torch.unsqueeze(tensor, dim=0)
    with torch.no_grad():
        _, outputs = module(tensor)
        _, predicted = torch.max(outputs.data, 1)
    print('predicted:', labels[predicted])
    return outputs.data, labels[predicted]


if __name__ == '__main__':
    main()
