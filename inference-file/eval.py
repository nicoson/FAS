# -*- coding: utf-8 -*-
import os
import sys
import time
import traceback
import numpy as np
import caffe
import cv2
import json
from caffe.proto import caffe_pb2
import google.protobuf.text_format as text_format
import hashlib
from evals.utils import create_net_handler, net_preprocess_handler, net_inference_handler, CTX, \
    monitor_rt_load, monitor_rt_forward, monitor_rt_post
from evals.utils.error import *
from evals.utils.image import load_image

# classify infe script
from evals.classify_infe import cls_create_net, cls_net_inference
# detect infe script
from evals.detect_infe import det_create_net, det_net_inference
from evals.util_infe import decodeReqsImage

"""
    mixup terror classify and terror predetect
"""


@create_net_handler
def create_net(configs):
    model_base = '/workspace/serving/models/online-model/used' # model path
    configs = {
        "model_files": {
            "det_deploy.prototxt": os.path.join(model_base,'det_deploy.prototxt'),
            "det_weight.caffemodel": os.path.join(model_base,'det_weight.caffemodel'),
            "det_labels.csv":os.path.join(model_base,'det_labels.csv'),
            "fine_deploy.prototxt":os.path.join(model_base,'fine_deploy.prototxt'),
            "fine_weight.caffemodel":os.path.join(model_base,'fine_weight.caffemodel'),
            "fine_labels.csv":os.path.join(model_base,'fine_labels.csv'),
        },
        "use_device": "GPU",
        'batch_size': 8 #chaneg batch size
    }
    CTX.logger.info("load configs: %s", configs)
    if 'use_device' in configs and configs['use_device'] == "CPU":
        caffe.set_mode_cpu()
    else:
        caffe.set_mode_gpu()
    mixup_model = dict()
    mixup_code = 0
    mixup_message = ""
    batch_size = 1
    if "batch_size" in configs:
        batch_size = configs['batch_size']
    # classify_infe create net
    cls_model, cls_code, cls_message = cls_create_net(configs)
    # detect_infe create net
    det_model, det_code, det_message = det_create_net(configs)
    if cls_code != 0 or det_code != 0:
        if cls_code != 0:
            mixup_code = cls_code
            mixup_message = cls_message
        elif det_code != 0:
            mixup_code = det_code
            mixup_message = det_message
    else:
        mixup_model['cls'] = cls_model
        mixup_model['det'] = det_model
        mixup_model['batch_size'] = batch_size
    return mixup_model, mixup_code, mixup_message


@net_preprocess_handler
def net_preprocess(model, req):
    CTX.logger.info("PreProcess...")
    return req, 0, ''


@net_inference_handler
def net_inference(model, reqs):
    # decode reqs
    CTX.logger.info("reqs length is : %d\n", len(reqs))
    try:
        if len(reqs) > model['batch_size']:
            raise ErrorOutOfBatchSize(model['batch_size'])
        imageInfoDict, imageIdMap, images = decodeReqsImage(reqs)
        """
            imageInfoDict : request send image data ,  decode info
            imageIdMap : request image id map to send to model inference image id (error image not send to model)
                         not used
            images : normal images that can send to model inference
        """
        # cls_net_inference
        cls_model = model['cls']
        cls_result, cls_result_code, cls_result_message = cls_net_inference(
            cls_model, images)
	# det_net_inference
        det_model = model['det']
        det_result, det_result_code, det_result_message = det_net_inference(
            det_model, images)
        if cls_result_code != 0 or det_result_code != 0:
            CTX.logger.error("inference error: %s", traceback.format_exc())
            errorMessage = "inference error: "+ traceback.format_exc()
            return [], 599, errorMessage
        # postProcess get output format
        reqs = postProcess(cls_result, det_result,
                           imageInfoDict)
    except ErrorBase as e:
        return [], e.code, str(e)
    except Exception as e:
        CTX.logger.error("inference error: %s", traceback.format_exc())
        return [], 599, str(e)
    return reqs, 0, ''


def postProcess(cls_result, det_result, imageInfoDict):
    assert len(cls_result) == len(det_result)
    # merge net infe output data and data preProcess result info to resps
    resps = []
    for original_image_id in range(len(imageInfoDict)):
        # original input image error
        if imageInfoDict[original_image_id]['flag'] == 1:
            resps.append({
                "code": imageInfoDict[original_image_id]['errorCode'],
                "message": imageInfoDict[original_image_id]['errorInfo'],
                "result": {}
            })
            continue
        inputNet_image_id = imageInfoDict[original_image_id]['normalImageIndex']
        result = dict()
        result['classify'] = cls_result[inputNet_image_id]
        result['detection'] = det_result[inputNet_image_id]
        resps.append({"code": 0, "message": "", "result": result})
    return resps