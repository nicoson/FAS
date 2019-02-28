# 算法文件
https://cf.qiniu.io/pages/viewpage.action?pageId=10361393

# serving 镜像
ava-serving-production-pipeline-so:534
ava-eval-terror-wangan-mix:20181206v2--201812111134-v534-dev

# 启动镜像
nvidia-docker run -it -v $(pwd)/inference-file/eval.py:/workspace/serving/python/evals/eval.py -v $(pwd)/inference-file/serving-eval.conf:/workspace/serving/serving-eval.conf -v $(pwd)/models:/workspace/serving/models/online-model/used -v $(pwd)/log:/workspace/serving/run/auditlog -e USE_DEVICE=GPU -e RUN_MODE=standalone -p 8888:8000 reg.qiniu.com/avaprd/ava-eval-terror-wangan-mix:20181206v2--201812111134-v534-dev bash

# 调用测试
curl -v -X POST -H "Content-Type:application/json" http://100.100.62.134:8888/v1 -d '{ "data":{ "uri":"https://assets.academy.com/mgen/71/20039771.jpg"}}'