const express	= require('express');
const router	= express.Router();
const log4js	= require('log4js');
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

let COUNT		= 0;
let DROPRATIO	= 1; // set to be 1 to avoid error counting before count loaded
ah.getStatistic('count').then(res => {
	COUNT = res;
	DROPRATIO = 0.3;
	console.log("Count: ", COUNT);
})

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
logger.info('start server ...')



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


//	home page api
// ===============
router.post('/home/setratio', function(req, res, next) {
	console.log('ratio: ', req.body.dropratio);
	DROPRATIO = req.body.dropratio;
	res.send('settle done');
});

router.get('/home/jobstatistic', function(req, res, next) {
	res.send({
		code: 200,
		data: {
			total: COUNT,
			img: dh_img.getStatistics(),
			video: dh_video.getStatistics()
		}
	})
});

//	trigger audit process
router.get('/trigger', function(req, res, next) {
	dh_img.auditStart();
	dh_video.auditStart();
	res.send({
		code: 200,
		msg: 'audit task triggered'
	});
});

router.get('/stopper', function(req, res, next) {
	dh_img.auditStop();
	dh_video.auditStop();
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
			count: COUNT
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
	if(Math.random() < (1 - DROPRATIO)){
		COUNT++;
		sh.storeProcess(req.body, 'image');
		if(COUNT%100 == 0) {
			ah.updateStatistic('count', COUNT);
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
	if(Math.random() < (1 - DROPRATIO)) {
		sh.storeProcess(req.body, 'video');
		COUNT++;
		if(COUNT%100 == 0) {
			ah.updateStatistic('count', COUNT);
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
