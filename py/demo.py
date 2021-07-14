import numpy as np
import torch
import torchvision.transforms as transforms
from VGG16 import VGG16
from PIL import Image
from cv2 import *

FONT = FONT_HERSHEY_SIMPLEX
BLACK = (0  , 0  , 0  )
WHITE = (255, 255, 255)
cam_width = 1280
cam_height = 720

def main():
    print('Starting')
    capture = VideoCapture(0)
    capture.set(3, cam_width)    # set width
    capture.set(4, cam_height)  # set height

    # init module
    module = torch.load('module.pkl', map_location=torch.device('cuda'))
    module.eval()

    while True:
        return_value, frame = capture.read()
        # frame = resize(frame, (1280, 720))
        print(frame.shape)
        if waitKey(1) & 0xFF == ord('q'):  # 对不起 我孤陋寡闻.jpg
            break
        output, prediction = predict(preprocessImage(readImage(frame)).to(torch.device('cuda')), module)
        frame = flip(frame, 1)
        rectangle(frame,
                  (int((cam_width - 224 * 2) / 2), int((cam_height - 224 * 2) / 2)),
                  (int((cam_width - 224 * 2) / 2 + 224 * 2), int((cam_height - 224 * 2) / 2 + 224 * 2)),
                  (0x01,0x3A,0xDF), thickness=20)
        putText(frame, prediction,
                (30, 30),
                FONT, 1, color=BLACK, thickness=2, lineType=LINE_AA)
        imshow('demo', frame)


def readImage(frame):
    # frame = np.delete(frame, -1, axis=2)
    frame = cvtColor(frame, COLOR_BGR2RGBA)     # Higher accuracy with this
    img = Image.fromarray(frame).convert('RGB')
    print(img.size[0] / 2)
    img = img.resize((int(img.size[0] / 2), int(img.size[1] / 2)))
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
    tensor = torch.unsqueeze(img, dim=0)
    print(tensor.shape)
    with torch.no_grad():
        _, outputs = module(tensor)
        _, predicted = torch.max(outputs.data, 1)
    print('predicted:', labels[predicted])
    if outputs[0][0] < 0.75 and outputs[0][1] < 0.75 and outputs[0][2] < 0.75:
        return outputs.data, 'Unknown'
    return outputs.data, labels[predicted]


if __name__ == '__main__':
    main()
