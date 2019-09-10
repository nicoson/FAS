build:
	rm -f fas.tar
	docker build -t fas .
	docker save fas > fas.tar
	
Deploy:
	scp fas.tar qnai@100.100.62.149:~/nixiaohui
	
	push to avatest
	docker tag fas reg.qiniu.com/avatest/fas:v1.0
	docker push reg.qiniu.com/avatest/fas:v1.0
