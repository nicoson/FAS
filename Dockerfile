FROM xiaohui/node

RUN apt-get update && apt-get install -y vim wget curl tzdata
RUN mkdir /workspace
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata

COPY ./nodeserver /workspace/server/
EXPOSE 80 3000

WORKDIR /workspace/server
CMD ["npm start"]