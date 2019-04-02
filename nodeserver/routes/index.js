const express	= require('express');
const router	= express.Router();
const log4js	= require('log4js');
const multer	= require('multer');
const config	= require('../model/config');
const storeHelper	= require('../model/storeHelper');
const deliverHelper = require('../model/deliverHelper');
const appHelper = require('../model/appHelper');
let sh			= new storeHelper();
let dh			= new deliverHelper();
let ah			= new appHelper();
const upload	= multer({ dest: config.UPLOAD_PATH });

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
router.get('/systemstatus', function(req, res, next) {
	ah.getSystemStatus().then(data => {
		res.send({
			code: 200,
			data: data
		});
	}).catch(err => {res.send({code:500, err: err})});
});

router.get('/getillegalclass', function(req, res, next) {
	res.send({
		classItem: config.CLASSIFY,
		detectItem: config.DETECTION
	});
});

// router.post('/rawdata', function(req, res, next) {
// 	let size = req.body.size;

// 	let conditions = {
// 		$and: [
// 			{review_result: {$exist: false}},
// 			{ops: {$exist: true}}
// 		]
// 	}
// 	if(req.body.classifyOption.length > 0) {
// 		let ops = [];
// 		req.body.classifyOption.map(op => {
// 			ops.push({"ops.classify.confidences.class": op});
// 		});
// 		conditions.$and.push({$or: ops});
// 	}
// 	if(req.body.detectOption.length > 0) {
// 		let ops = [];
// 		req.body.detectOption.map(op => {
// 			ops.push({"machineresult.detection.class": op});
// 		});
// 		conditions.$and.push({$or: ops});
// 	}
	
// 	console.log('conditions: ', JSON.stringify(conditions));
// 	ah.getDataFromFileInfo(conditions, size).then(data => {
// 		res.send({
// 			code: 200,
// 			data: data
// 		});
// 	}).catch(err => {res.send({code:500, err: err})});
// });


router.post('/rawdata', function(req, res, next) {
	let size = req.body.size;

	let conditions = {
		$and: [
			{review_result: {$exists: false}},
			{ops: {$exists: true}},
			{type: (req.body.mimeType == 'video') ? 2 : ((req.body.mimeType == 'image')? 1 : 3)}
		]
	}
	let classes = req.body.classifyOption.concat(req.body.detectOption);
	if(classes.length > 0) {
		let ops = [];
		classes.map(op => {
			ops.push({"ops.wangan_mix.labels.label": op});
		});
		conditions.$and.push({$or: ops});
	}
	
	console.log('conditions: ', JSON.stringify(conditions));

	ah.getDataFromDB(conditions, size).then(data => {
		res.send({
			code: 200,
			data: data.res,
			num: data.num
		});
	}).catch(err => {res.send({code:500, err: err})});
});

router.post('/submitauditdata', function(req, res, next) {
	// console.log(req.body.data);
	ah.updateDataIntoTable('results', req.body.data).then(data => {
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
			{audit_date: {$gt: new Date(req.body.startDate)}},
			{audit_date: {$lt: new Date(new Date(req.body.endDate).getTime()+86400000)}},
			{review_result: true}
		]
	}
	if(req.body.md5.length > 0) {
		conditions.$and.push({md5: req.body.md5});
	}
	let classes = req.body.classifyOption.concat(req.body.detectOption);
	if(classes.length > 0) {
		let ops = [];
		classes.map(op => {
			ops.push({"ops.wangan_mix.labels.label": op});
		});
		conditions.$and.push({$or: ops});
	}
	if(req.body.filetype == 'video') {
		conditions.$and.push({type: 2});
	} else if(req.body.filetype == 'image') {
		conditions.$and.push({type: 1});
	} else {
		conditions.$and.push({type: 3});
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
router.post('/v1/image', function(req, res, next) {
	// console.log(req.body);
	sh.storeProcess(req.body, 'image');
	res.send({
		code: 200,
		msg: 'task accepted'
	});
});

router.post('/v1/video', function(req, res, next) {
	// console.log(req.body);
	sh.storeProcess(req.body, 'video');
	res.send({
		code: 200,
		msg: 'task accepted'
	});
});

//	trigger audit process
router.get('/trigger', function(req, res, next) {
	dh.processBatchImg();
	dh.processBatchVideo();
	res.send({
		code: 200,
		msg: 'audit task triggered'
	});
});


module.exports = router;
