Field Analysis System 现场分析系统
"交互服务端"与"计算服务端"分离的高速嵌入式http服务框架

# 版本介绍
目前代码中支持了两套后台服务模式：
1. 上海WA专业暴恐版
2. 三鉴一体机通用版


# 编译流程
1. 前端工程编译
    ```
    fas/client> npm run build-wash  // 编译上海WA专业暴恐版
    // fas/client > npm run build-gen  // 编译三鉴一体机版
    ```

2. 前端代码部署
    ```
    fas/client> sh deploy.sh
    ```

3. 前后端代码打包镜像
    ```
    fas> make build
    ```


# 部署
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
    model/config/config_*.js
    ```

4. 启动镜像服务
    ```
    > docker run -d --network=host --restart=always --name=fas -p 3333:3333 -v $(pwd)/nodeserver:/workspace/server fas
    ```
