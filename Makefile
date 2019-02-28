
Deploy:
	docker build -t wa-xh .
	
	# push to avatest
	docker tag wa-xh reg.qiniu.com/avatest/wa-xh:v1.2
	docker push reg.qiniu.com/avatest/wa-xh:v1.2
