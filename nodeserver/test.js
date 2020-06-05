
const fs    = require('fs');
const path  = require('path');
const fetch = require('node-fetch');

let filePath = path.resolve('./public/files/terror.mp4');
let videoData = fs.readFileSync(filePath);
videoData = new Buffer(videoData).toString('base64');

filePath = path.resolve('./public/files/normal.mp4');
let videoDataNormal = fs.readFileSync(filePath);
videoDataNormal = new Buffer(videoDataNormal).toString('base64');


filePath = path.resolve('./public/files/guns.jpg');
let imgDataTerror = fs.readFileSync(filePath);
imgDataTerror = new Buffer(imgDataTerror).toString('base64');

filePath = path.resolve('./public/files/politician.jpg');
let imgDataPolitician = fs.readFileSync(filePath);
imgDataPolitician = new Buffer(imgDataPolitician).toString('base64');

filePath = path.resolve('./public/files/pulp.jpeg');
let imgDataPulp = fs.readFileSync(filePath);
imgDataPulp = new Buffer(imgDataPulp).toString('base64');

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

let imgOptionsPulp = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: imgDataPulp}, params: {id: 321}})
}

let imgOptionsTerror = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: imgDataTerror}, params: {id: 321}})
}

let imgOptionsPolitician = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: imgDataPolitician}, params: {id: 231}})
}

let imgNormalOptions = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
    body: JSON.stringify({data: {uri: imgDataNormal}, params: {id: 321}})
}


for(let i=0; i<100; i++) {
    // fetch('http://localhost:3000/v1/video', videoOptions).then(e => console.log('video job posted ...'));
    // fetch('http://localhost:3000/v1/video', videoNormalOptions).then(e => console.log('video job posted ...'));
    fetch('http://localhost:3000/v1/pic', imgOptionsPulp).then(e => console.log('image job posted ...'));
    fetch('http://localhost:3000/v1/pic', imgOptionsTerror).then(e => console.log('image job posted ...'));
    fetch('http://localhost:3000/v1/pic', imgOptionsPolitician).then(e => console.log('image job posted ...'));
    fetch('http://localhost:3000/v1/pic', imgNormalOptions).then(e => console.log('image job posted ...'));
}
