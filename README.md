Field Analysis System 现场分析系统
"交互服务端"与"计算服务端"分离的高速嵌入式http服务框架

镜像资源：
1. model.tar
2. nginx.tar
3. mongo.tar

执行过程
1. 配置执行脚本
    ```
    > vim gen.py
    ```

2. 生成执行脚本
    ```
    > python gen.py
    ```

3. load镜像(如已有，可跳过)
    ```
    > docker load < model.tar
    > docker load < nginx.tar
    > docker load < mongo.tar
    ```

4. 启动服务
    ```
    > docker-compose up
    ```

5. 准备公安md5库
    ```
    > cd db
    > sh mongoimport.sh
    ```

    
    docker run -d --network=host --restart=always -p 3333:3333 -v $(pwd)/files:/workspace/server/public/files fas