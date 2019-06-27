bower.json: dependence 3rd part files
.bowerrc: bower file install directory

.gitignore: ignore files from git


Initiate Project:
1. npm install
2. bower install

Build Project:
	Build Project via gulp:
		Dev: gulp --env dev
		Test: gulp test --env dev	//	run the qunit test and jshint
		Prod: gulp --env prod	//	minify js and css file

	Build Project via npm:
		refer to package.json

Developing Project:
	>npm run watch

How to use:
Pre Build
1. >npm install
2. >bower install

For Developping:
1. >npm run build
2. >npm run dev

For Deploy to Server:
1. >npm run dist
2. >sh deploy.sh

For Testing Locally:
1. start "startserver.cmd" in dev folder


## 版本构建说明：
### 内容审核一体机：
1. >cd client
2. >npm run build-gen
3. >npm run dev-gen
4. >sh deploy.sh
5. >cd ../nodeserver
6. >npm run dev-gen


### 上海网安暴恐服务：
1. >cd client
2. >npm run build-wash
3. >npm run dev-wash
4. >sh deploy.sh
5. >cd ../nodeserver
6. >npm run dev-wash


## 说明： 
2019/06/18: 版本升级到兼容多场景，目前已针对以下场景进行兼容： 
1. 鉴黄一体机 
2. 上海网安总队暴恐系统 

