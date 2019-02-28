#!/usr/bin/python3
import json
import os

config = {
    "cpu_core": 2,
    "cpu_instance": 2,
}

def genDockerComposeFile(config):
    output = ""
    output += "version: '2'\n\n"

    output += "networks:\n"
    output += "    esp-bridge:\n"
    output += "        driver: bridge\n\n"

    output += "volumes:\n"
    output += "    nvidia_driver_375.26:\n"
    output += "        external: true\n\n"

    output += "services:\n"
    output += "    nginx:\n"
    output += "        restart: always\n"
    output += "        image: nginx\n"
    output += "        volumes:\n"
    output += "            - /workfolder/nginx.conf:/etc/nginx/nginx.conf:ro\n"
    output += "        ports:\n"
    output += "            - 8888:8000\n"
    output += "        networks:\n"
    output += "            - esp-bridge\n\n"

    output += "    mongodb:\n"
    output += "        restart: always\n"
    output += "        image: mongo\n"
    output += "        volumes:\n"
    output += "            - /data/mongo/db:/data/db\n"
    output += "        ports:\n"
    output += "            - 27017:27017\n"
    output += "        networks:\n"
    output += "            - esp-bridge\n\n"

    output += "    pyserver:\n"
    output += "        restart: always\n"
    output += "        image: wa_http_server:20180912\n"
    output += "        command: python python/evals/server.py\n"
    output += "        volumes:\n"
    output += "            - /workfolder/pyserver/server.py:/workspace/serving/python/evals/server.py\n"
    output += "            - /workfolder/pyserver/templates:/workspace/serving/python/evals/templates\n"
    output += "        ports:\n"
    output += "            - 8080:8000\n"
    output += "        networks:\n"
    output += "            - esp-bridge\n\n"

    for i in range(config["cpu_core"]):
        for j in range(config["cpu_instance"]):
            id = i*config["cpu_instance"] + j
            
            output += "    server" + str(id) + ":\n"
            output += "        restart: always\n"
            output += "        image: wa_http_server:20180912\n"
            output += "        volume_driver: nvidia-docker\n"
            output += "        volumes:\n"
            output += "            - nvidia_driver_375.26:/usr/local/nvidia:ro\n"
            output += "            - /workfolder/docker-files/evals/eval.py:/workspace/serving/python/evals/eval.py\n"
            output += "            - /workfolder/docker-files/resnet.yaml:/workspace/serving/python/evals/resnet.yaml\n"
            output += "            - /workfolder/serving-eval.conf:/workspace/serving/serving-eval.conf\n"
            output += "            - /workfolder:workspace/serving/file_datas\n"
            output += "        devices:\n"
            output += "            - /dev/nvidiactl\n"
            output += "            - /dev/nvidia-uvm\n"
            output += "            - /dev/nvidia" + str(i) + "\n"
            output += "        environment:\n"
            output += "            USE_DEVICE: GPU\n"
            output += "            RUN_MODE: standalone\n"
            output += "        ports:\n"
            output += "            - " + str(10000 + id) + ":8000\n"
            output += "        networks:\n"
            output += "            - esp-bridge\n\n"

    # print(output)
    return output


def genNginxFile(config):
    output = ""
    output += "user www-data;\n"
    output += "worker_processes 4;\n"
    output += "pid /run/nginx.pid;\n\n"

    output += "events {\n"
    output += "    worker_connections 1024;\n"
    output += "}\n\n"

    output += "http {\n"
    output += "    client_max_body_size 100m;\n"
    output += "    access_log /var/log/nginx/access.log;\n"
    output += "    error_log /var/log/nginx/error.log;\n"

    output += "    upstream Detectservice {\n"

    for i in range(config["cpu_core"]):
        for j in range(config["cpu_instance"]):
            id = i*config["cpu_instance"] + j
            output += "        server server" + str(id) + ":8000;\n"

    output += "    }\n\n"

    output += "    server {\n"
    output += "        listen 8000;\n\n"

    output += "        proxy_connect_timeout 300;\n"
    output += "        proxy_send_timeout 300;\n"
    output += "        proxy_read_timeout 300;\n\n"

    output += "        location / {\n"
    output += "            proxy_pass http://Detectservice;\n"
    output += "        }\n"
    output += "    }\n"
    output += "}\n"

    # print(output)
    return output

if __name__ == '__main__':
    dockerfile = genDockerComposeFile(config)
    nginx = genNginxFile(config)

    fo = open('docker-compose.yml', "w")
    fo.write(dockerfile)

    fo = open('nginx.conf', "w")
    fo.write(nginx)