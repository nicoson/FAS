docker run -d --network=host --restart=always --name=fas --log-opt max-size=20m --log-opt max-file=5 -p 3333:3333 -v $(pwd):/workspace/server fas