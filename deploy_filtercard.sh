nvidia-docker run \
-e NVIDIA_DRIVER_CAPABILITIES=video,compute,utility \
-e NVIDIA_VISIBLE_DEVICES=0  \
--name filter_card_xxxx \
-d \
-v /home/qnai/ava_workspace/cfg/filter_card_2/mix.conf:/workspace/serving/mix.conf \
-v /home/qnai/ava_workspace/cfg/filter_card_2/ava_licence:/workspace/serving/ava_licence \
-v /home/qnai/ava_workspace/cfg/filter_card_2/serving-eval.conf:/workspace/serving/serving-eval.conf \
reg.supremind.info/dockerhub/videomind/filter_card:20200603-mix-direct-response