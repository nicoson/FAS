FROM node:10.13-alpine

RUN apk add vim wget curl
RUN mkdir /workspace

COPY ./nodeserver /workspace/server/
EXPOSE 80 3000

WORKDIR /workspace/server
CMD ["npm", "start"]