# coding:utf-8
from flask import Flask, render_template
from flask import request
from flask_cors import CORS
import json
import time
import os
import commands
import uuid
import requests

UPLOAD_FOLDER = os.getcwd() + '/files'

app = Flask(__name__, static_folder='', static_url_path='')
CORS(app)

@app.route('/')
def hello_world():
    return render_template('index.html')

@app.route('/callback', methods=['POST'])
def callback():
    print('data: ', request.data)
    print('request: ')
    print(json.dumps(request))
    return 'done'

@app.route('/uploadfile', methods=['POST'])
def uploadfile():
    file = request.files['video']
    print(file.filename)
    if file.filename.find('.mp4') > 0:
        # filename = secure_filename(file.filename)
        filename = str(int(time.time()*1000)) + '.mp4'
        print('save dir: ', UPLOAD_FOLDER)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        # genImg(file.filename)
        print('video file save done')
        res = {
            "filename": filename,
            "url": "/files/" + filename
        }
        print("video upload result: ")
        print(res)
        return json.dumps(res)
    print('failed, none approved file type')
    return '你上传了不允许的文件类型'


@app.route('/uploadbase64', methods=['POST'])
def uploadbase64():
    b64 = json.loads(request.data)


@app.route('/inference', methods=['POST'])
def inference():
    FLAG = True
    if FLAG:
        data = json.loads(request.data)
        filename = '/workspace/data/' + str(uuid.uuid1())
        code, res = commands.getstatusoutput('wget -O '+ filename + ' ' + data["data"]["uri"].encode('utf8'))
        req={
            'data': {
                'uri': data["data"]["uri"].encode('utf8'),
                'body': None
            }
        }
        print(req)
        # url = data["data"]["uri"]
        res = requests.post('http://nginx:8000/v1/eval', headers={"content-type":"application/json"}, data = json.dumps(req))
        
        resjson = json.loads(res.text)
        if len(res["result"]["detections"]) == 0:
            code, res2 = commands.getstatusoutput('rm -rf '+ filename)

        return res.text
    else:
        return json.dumps({"header": {}, "message": "system busy, please try again later", "code": 503, "result": {}})

@app.route('/v1/test')
def test():
    reqs = [{
        'data': {
            'uri': "/workspace/serving/file_datas/images/a.jpg",
            'body': None
        }
    }]
    
    return json.dumps({"a":1})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)