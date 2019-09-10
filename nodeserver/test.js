
const fs    = require('fs');
const path  = require('path');
const fetch = require('node-fetch');

let filePath = path.resolve('./public/files/terror.mp4');
let videoData = fs.readFileSync(filePath);
videoData = new Buffer(videoData).toString('base64');

filePath = path.resolve('./public/files/normal.mp4');
let videoDataNormal = fs.readFileSync(filePath);
videoDataNormal = new Buffer(videoDataNormal).toString('base64');


filePath = path.resolve('./public/files/terror.jpeg');
let imgData = fs.readFileSync(filePath);
imgData = new Buffer(imgData).toString('base64');

filePath = path.resolve('./public/files/normal.jpeg');
let imgDataNormal = fs.readFileSync(filePath);
imgDataNormal = new Buffer(imgDataNormal).toString('base64');

let videoOptions = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: videoData}, params: {id: 123}})
}

let videoNormalOptions = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: videoDataNormal}, params: {id: 123}})
}

let imgOptions = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: imgData}, params: {id: 321}})
}

let imgNormalOptions = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: imgDataNormal}, params: {id: 321}})
}


for(let i=0; i<10; i++) {
    fetch('http://localhost:3000/v1/video', videoOptions).then(e => console.log('video job posted ...'));
    fetch('http://localhost:3000/v1/video', videoNormalOptions).then(e => console.log('video job posted ...'));
    fetch('http://localhost:3000/v1/pic', imgOptions).then(e => console.log('image job posted ...'));
    fetch('http://localhost:3000/v1/pic', imgNormalOptions).then(e => console.log('image job posted ...'));
}
