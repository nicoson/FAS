# ./node_modules/uglify-js-es6/bin/uglifyjs ./dev/javascript/*.js -c -m -o ./dev/javascript/*.js

cp -r ./dev/ ../nodeserver/public/
cp ./dev/index.html ../nodeserver/views/index.ejs
cp -rf ./imgs/ ../nodeserver/public/imgs/