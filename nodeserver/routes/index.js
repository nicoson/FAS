const express	= require('express');
const router	= express.Router();
const log4js	= require('log4js');
const fetch     = require('node-fetch');
const config	= require('../model/config');
const storeHelper	= require('../model/storeHelper');
const deliverHelper = require('../model/deliverHelper');
const appHelper = require('../model/appHelper');
let sh			= new storeHelper();
let ah			= new appHelper();
let dh_img		= new deliverHelper(50, 500, 'image');
let dh_video	= new deliverHelper(5, 20, 'video');

// const multer	= require('multer');
// const upload	= multer({ dest: config.UPLOAD_PATH });

let IMGCOUNT		= 0;
let VIDCOUNT		= 0;
let IMGDROPRATIO	= 1; // set to be 1 to avoid error counting before count loaded
let VIDDROPRATIO	= 1; // set to be 1 to avoid error counting before count loaded
ah.getStatistic('count').then(res => {
	IMGCOUNT = res.imgCount;
	VIDCOUNT = res.vidCount;
	IMGDROPRATIO = 0.4;
	VIDDROPRATIO = 0.4;
	console.log("Count: ", res);
});

log4js.configure({
	appenders: { info: { type: 'file', filename: 'index.log' } },
	categories: { 
		default: { 
			appenders: ['info'], 
			level: 'info' 
		}
	}
});
const logger = log4js.getLogger('esp');
logger.info('start server ...');



/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});


router.get('/spider', function(req, res, next) {
	res.render('spider', { title: 'Express' });
});



/* ====================== *\
	  client side api 
\* ====================== */


//	dashboard api
// ===============
router.get('/home/getratio', function(req, res, next) {
	res.send({
		imgdropratio: IMGDROPRATIO,
		viddropratio: VIDDROPRATIO
	});
});

router.post('/home/setratio', function(req, res, next) {
	console.log('set image drop ratio: ', req.body.imgdropratio);
	console.log('set video drop ratio: ', req.body.viddropratio);
	IMGDROPRATIO = req.body.imgdropratio;
	VIDDROPRATIO = req.body.viddropratio;
	res.send('settle done');
});

router.get('/home/jobstatistic', function(req, res, next) {
	res.send({
		code: 200,
		data: {
			total: {
				IMGCOUNT: IMGCOUNT,
				VIDCOUNT: VIDCOUNT
			},
			img: dh_img.getStatistics(),
			video: dh_video.getStatistics()
		}
	})
});

//	trigger audit process
router.get('/trigger', function(req, res, next) {
	dh_img.auditStart();
	// dh_video.auditStart();
	res.send({
		code: 200,
		msg: 'audit task triggered'
	});
});

router.get('/stopper', function(req, res, next) {
	dh_img.auditStop();
	// dh_video.auditStop();
	res.send({
		code: 200,
		msg: 'audit task stopped'
	});
});

router.get('/systemstatus', function(req, res, next) {
	ah.getSystemStatus().then(data => {
		res.send({
			code: 200,
			data: data,
			count: {
				IMGCOUNT: IMGCOUNT,
				VIDCOUNT: VIDCOUNT
			}
		});
	}).catch(err => {res.send({code:500, err: err})});
});



//	audit page api
// ================
router.get('/getillegalclass', function(req, res, next) {
	res.send({
		classItem: config.CLASSIFY,
		detectItem: config.DETECTION
	});
});

router.post('/rawdata', function(req, res, next) {
	// console.log(`......method: ${req.method}`);
	let timer = new Date().getTime();
	ah.getRawData(req).then(data => {
		console.log("=================>   outer layer query costs: ", new Date().getTime()-timer);
		res.send(data);
	});
});

router.post('/submitauditdata', function(req, res, next) {
	// console.log(req.body.data);
	ah.updateDataIntoTable('illegal', req.body.data).then(data => {
		// console.log('data: ',data);
		res.send({
			code: 200,
			msg: 'done'
		});
	}).catch(err => {res.send({code:500, err: err})});
});

router.post('/getillegaldata', function(req, res, next) {
	let conditions = {
		$and: [
			{create: {$gt: new Date(req.body.startDate)}},
			{create: {$lt: new Date(new Date(req.body.endDate).getTime()+86400000)}},
			{manualreview: true},
			{type: req.body.type}
		]
	}

	if(req.body.detectOption.length > 0) {
		conditions['$and'].push({'rets.classes': {$in: req.body.detectOption}});
	}

	if(req.body.classifyOption.length > 0) {
		conditions['$and'].push({'rets.classes': {$in: req.body.classifyOption}});
	}
	
	console.log('conditions: ', JSON.stringify(conditions));
	ah.getDataFromDB(conditions, req.body.pagesize, req.body.pagesize*(req.body.page)).then(data => {
		res.send({
			code: 200,
			data: data.res,
			num: data.num
		});
	}).catch(err => {res.send({code:500, err: err})});
});

router.post('/getfilemeta', function(req, res, next) {
	let conditions = {
		md5: req.body.md5
	}
	console.log('conditions: ', JSON.stringify(conditions));
	ah.getDataFromFileMeta(conditions).then(data => {
		console.log(data);
		res.send({
			code: 200,
			data: data
		});
	}).catch(err => {res.send({code:500, err: err})});
});




/* ====================== *\
      server side api 
\* ====================== */
//	upload file to queue table
//	only accept base64 file
router.post('/v1/pic', function(req, res, next) {
	// console.log(req.body);

	// // for wa_sh
	// let options = {
	// 	method: 'POST',
	// 	headers: {'Content-Type': 'application/json', 'Connection': 'keep-alive'},
	// 	body: JSON.stringify(req.body)
	// }
	// fetch('http://15.15.61.51:3333/v1/pic', options).then(e=>console.log(e));

	if(Math.random() < (1 - IMGDROPRATIO)){
		IMGCOUNT++;
		sh.storeProcess(req.body, 'image');
		if(IMGCOUNT%100 == 0) {
			ah.updateStatistic('count', {imgCount:IMGCOUNT, vidCount:VIDCOUNT});
		}
		res.send({
			code: 200,
			msg: 'task accepted'
		});
		// console.log('=======>   task accepted');
	} else {
		res.send({
			code: 200,
			msg: 'task abandoned'
		});
		console.log('------->   task abandoned');
	}
});

//	only accept base64 file
router.post('/v1/video', function(req, res, next) {
	if(Math.random() < (1 - VIDDROPRATIO)) {
		sh.storeProcess(req.body, 'video');
		VIDCOUNT++;
		if(VIDCOUNT%5 == 0) {
			ah.updateStatistic('count', {imgCount:IMGCOUNT, vidCount:VIDCOUNT});
		}
		res.send({
			code: 200,
			msg: 'task accepted'
		});
	} else {
		res.send({
			code: 200,
			msg: 'task abandoned'
		});
	}
});


module.exports = router;
