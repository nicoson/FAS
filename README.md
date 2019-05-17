Field Analysis System 现场分析系统
"交互服务端"与"计算服务端"分离的高速嵌入式http服务框架

镜像资源：
1. fas.tar

执行过程
1. load镜像
    ```
    > docker load < fas.tar
    ```

2. 修改前端配置
    ```
    public/javascript/config.js
    ```

3. 修改后端配置
    ```
    model/config.js
    ```

4. 启动镜像服务
    docker run -d --network=host --restart=always -p 3333:3333 -v $(pwd)/server:/workspace/server fas