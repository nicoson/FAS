# 启动 mongodb
docker run --name fas-mongo -v ~/nixiaohui/data/db:/data/db -p 37017:27017 -d mongo

# 启动 推理服务器
nvidia-docker run -d -p 8888:8000 --restart=always -e USE_DEVICE=GPU -e RUN_MODE=standalone -v /home/qnai/nixiaohui/FAS/inference-file/eval.py:/workspace/serving/python/evals/eval.py -v /home/qnai/nixiaohui/FAS/inference-file/serving-eval.conf:/workspace/serving/serving-eval.conf -v /home/qnai/nixiaohui/FAS/models:/workspace/serving/models/online-model/used -v /home/qnai/nixiaohui/FAS/log:/workspace/serving/run/auditlog reg.qiniu.com/avaprd/ava-eval-terror-wangan-mix:20181206v2--201812111134-v534-dev sh -c "cd /workspace/serving && INTEGRATE=lib exec ./serving-eval -f serving-eval.conf"

# 启动 http 服务
>npm install
>npm start