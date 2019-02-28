curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/beheaded-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/beheaded-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/bloodiness-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/bloodiness-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/bomb-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/bomb-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/fight-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/fight-2.jpeg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/guns-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/guns-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/isis flag-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/isis flag-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/isis flag-3.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/islamic flag-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/islamic flag-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/knives-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/knives-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/march-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/march-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/march-3.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/tibetan flag-1.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'
curl http://100.100.62.149:3000/upload -F "file=@/Users/xiaohuini/Projects/Qiniu/CSTEST/terror/tibetan flag-2.jpg" -F 'metadata={"ip":"192.168.1.1","port":"3306"}'

curl http://100.100.62.149:3000/trigger



const mockinput = require('./mockInput');
let m = new mockinput();
m.getData().then(data => m.insertData(data)).then(e=>console.log(e));