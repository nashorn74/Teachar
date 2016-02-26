
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 80);//맥에서 실행시킬때는 sudo node app.js로!
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

//반드시 app.use(app.router); 보다 앞에 명시되어야 한다!!! 
app.use(express.cookieParser());
app.use(express.session({secret:"wewillrockyou"}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var crypto = require('crypto');
var socketio = require('socket.io');
var server = null;
var io = null;

var MongoDBProvider = require('./provider-mongodb').MongoDBProvider;
var mongoDBProvider = new MongoDBProvider('localhost', 27017);

//app.get('/', routes.index);
app.get('/', function(req,res){
	res.redirect('/index.html');
});
app.get('/admin',function(req,res){
	mongoDBProvider.getAdminId( function(error,ids){
		//console.log(ids);
		if (ids.length == 0){//Admin 계정 미등록
			res.redirect('/admin/new_password');
		} else {
			res.redirect('/admin/login');
		}
	});
});
var async = require('async');
app.get('/admin/main',function(req,res){
	//var user_id = app.get('user_id');
	var user_id = req.session.user_id;
	//console.log(user_id);
	if (user_id == 'administrator') {
		//db.boards.find({$where:'return this.created_at.getMonth()+1 == 11'});
		var curDate = new Date();
		var options = {};
		var boardCount = 0;
		var qnaCount = 0;
		var requestCount = 0;
		var reqTeacherCount = 0;
		async.waterfall(
		[
		 	function task1(callback) {
		 		console.log("task1");
		 		mongoDBProvider.findBoard(
					{$where:'return (this.created_at.getYear() == '+curDate.getYear()+
						' && this.created_at.getMonth() == '+curDate.getMonth()+
						' && this.created_at.getDay() == '+curDate.getDay()+')'},options,
					function(error,docs){
							boardCount = docs.length;
							console.log("boardCount:"+boardCount);
							callback(null, "one");
					});
		 		
		 	},
		 	function task2(arg,callback) {
		 		console.log("task2");
		 		mongoDBProvider.findQna(
	 				{$where:'return (this.created_at.getYear() == '+curDate.getYear()+
	 					' && this.created_at.getMonth() == '+curDate.getMonth()+
	 					' && this.created_at.getDay() == '+curDate.getDay()+')'},options,
	 				function(error,docs){
	 						qnaCount = docs.length;
	 						console.log("qnaCount:"+qnaCount);
	 						callback(null, "two");
	 				});
		 		
		 	},
		 	function task3(arg,callback) {
		 		console.log("task3");
		 		mongoDBProvider.findFreeClass(
	 				{$where:'return (this.created_at.getYear() == '+curDate.getYear()+
	 					' && this.created_at.getMonth() == '+curDate.getMonth()+
	 					' && this.created_at.getDay() == '+curDate.getDay()+')'},options,
	 				function(error,docs){
	 						requestCount = docs.length;
	 						console.log("requestCount:"+requestCount);
	 						callback(null, "three");
	 				});
		 		
		 	},
		 	function task4(arg,callback) {
		 		console.log("task4");
		 		mongoDBProvider.findReqTeacher(
	 				{$where:'return (this.created_at.getYear() == '+curDate.getYear()+
	 					' && this.created_at.getMonth() == '+curDate.getMonth()+
	 					' && this.created_at.getDay() == '+curDate.getDay()+')'},options,
	 				function(error,docs){
	 						reqTeacherCount = docs.length;
	 						console.log("reqTeacherCount:"+reqTeacherCount);
	 						callback(null, "three");
	 				});
		 		
		 	},
		 	function task5(arg,callback) {
		 		console.log("task5");
		 		console.log(boardCount+"/"+qnaCount);
		 		res.render('index', { title: '관리자 페이지', request_count:requestCount,
		 			reqteacher_count:reqTeacherCount,board_count:boardCount,  qna_count:qnaCount});
		 		callback(null, "five");
		 	}
		], function(err, result) {	
			
		});
		
		
	} else {
		res.redirect('/admin');
	}
});
app.get('/admin/login',function(req,res){
	res.render('admin_login', { title: '관리자 페이지' });
});
app.post('/admin/login', function(req, res) {
	var original_password = '';
	mongoDBProvider.getAdminId( function(error,ids){
		//console.log(ids);
		if (ids.length > 0){
			original_password = ids[0].password;
			var hash = crypto.createHash('sha256').update(req.param('password')).digest('base64');
			if (original_password == hash) {
				//app.set('user_id', 'administrator');
				req.session.user_id = 'administrator';
				res.redirect('/admin/main');
			} else {
				res.redirect('/admin/login');
			}
		}
	});
});
app.post('/admin/logout', function(req, res) {
	req.session.user_id = undefined;
	//app.set('user_id', undefined);
	res.redirect('/admin/login');
});
app.get('/admin/new_password',function(req,res){
	res.render('new_admin_password', { title: '관리자 페이지' });
});
app.post('/admin/new_password', function(req, res) {
	if (req.param('password1') == req.param('password2') &&
			req.param('password1').length > 4) {
		var hash = crypto.createHash('sha256').update(req.param('password1')).digest('base64');
		//console.log(hash);
		mongoDBProvider.setAdminId({
			id: 'admin',
			password: hash },
			function (error, docs) {
				res.redirect('/admin');
		});
	}
});
app.get('/admin/manage/news',function(req,res){
	mongoDBProvider.findAllNews( function(error,docs){
		res.render('admin_news_list', { title: '관리자 페이지 : 새소식 관리',articles:docs });
	});
});
app.get('/admin/manage/news/new',function(req,res){
	var dateNow = new Date();
    var dd = dateNow.getDate();
    var monthSingleDigit = dateNow.getMonth() + 1,
        mm = monthSingleDigit < 10 ? '0' + monthSingleDigit : monthSingleDigit;
    var yy = dateNow.getFullYear().toString();//.substr(2);
	
	res.render('admin_news_new', { title: '관리자 페이지 : 새소식 추가',date:yy+'/'+mm+'/'+dd });
});
app.post('/admin/manage/news/new',function(req,res){
	mongoDBProvider.saveNews({
		title: req.param('title'),
		body: req.param('body') },
		function (error, docs) {
			res.redirect('/admin/manage/news');
	});
});
app.post('/admin/manage/news/delete',function(req,res){
	console.log(req.param('id'));
	mongoDBProvider.deleteNews(req.param('id'), function(error, article){
		res.redirect('/admin/manage/news');
	});
});
app.get('/admin/manage/request',function(req,res){
	mongoDBProvider.findAllFreeClass( function(error,docs){
		for (var i = 0; i < docs.length; i++) {
			var document = docs[i];
			document.name = decodeURIComponent(document.name);
			document.email = decodeURIComponent(document.email);
			document.school = decodeURIComponent(document.school);
			document.year = decodeURIComponent(document.year);
			document.phone = decodeURIComponent(document.phone);
			document.calltime = decodeURIComponent(document.calltime);
			document.calltimetext = decodeURIComponent(document.calltimetext);
			document.city = decodeURIComponent(document.city);
			document.area = decodeURIComponent(document.area);
			document.address = decodeURIComponent(document.address);
			document.classes = decodeURIComponent(document.classes);
			document.message = decodeURIComponent(document.message);
		}
		res.render('admin_freeclass_list', { title: '관리자 페이지 : 상담신청 관리',articles:docs });
	});
});
app.get('/admin/manage/req_teacher',function(req,res){
	mongoDBProvider.findAllReqTeacher( function(error,docs){
		for (var i = 0; i < docs.length; i++) {
			var document = docs[i];
			document.name = decodeURIComponent(document.name);
			document.email = decodeURIComponent(document.email);
			document.phone = decodeURIComponent(document.phone);
			document.school = decodeURIComponent(document.school);
			document.major = decodeURIComponent(document.major);
			document.city1 = decodeURIComponent(document.city1);
			document.area1 = decodeURIComponent(document.area1);
			document.city2 = decodeURIComponent(document.city2);
			document.area2 = decodeURIComponent(document.area2);
			document.city3 = decodeURIComponent(document.city3);
			document.area3 = decodeURIComponent(document.area3);
			document.classes = decodeURIComponent(document.classes);
			document.message = decodeURIComponent(document.message);
		}
		res.render('admin_reqteacher_list', { title: '관리자 페이지 : 선생님신청 관리',articles:docs });
	});
});
app.get('/admin/manage/bbs',function(req,res){
	mongoDBProvider.findAllBoard( function(error,docs){
		for (var i = 0; i < docs.length; i++) {
			var document = docs[i];
			document.name = decodeURIComponent(document.name);
			document.homepage = decodeURIComponent(document.homepage);
			document.title = decodeURIComponent(document.title);
			document.message = decodeURIComponent(document.message);
			document.link1 = decodeURIComponent(document.link1);
			document.link2 = decodeURIComponent(document.link2);
		}
		res.render('admin_bbs_list', { title: '관리자 페이지 : 이용후기 관리',articles:docs });
	});
});
app.post('/admin/manage/bbs/write',function(req,res){
	var hash = crypto.createHash('sha256').update(req.param('password')).digest('base64');
	var nameStr = encodeURIComponent(req.param('name'));
	var homepageStr = encodeURIComponent(req.param('homepage'));
	var titleStr = encodeURIComponent(req.param('title'));
	var messageStr = encodeURIComponent(req.param('message'));
	var link1Str = encodeURIComponent(req.param('link1'));
	var link2Str = encodeURIComponent(req.param('link2'));
	var json = {name:nameStr,password:hash,email:req.param('email'),homepage:homepageStr,
			type:req.param('type'),title:titleStr,message:messageStr,link1:link1Str,link2:link2Str,review_count:0};
	//console.log(JSON.stringify(json));
	mongoDBProvider.saveBoard(json,
		function (error, docs) {
		//res.redirect('/index-1-4.html');
		res.redirect('/sub202.html');
	});
});
app.post('/admin/manage/bbs/delete',function(req,res){
	mongoDBProvider.deleteBoard(req.param('id'), function(error, article){
		res.redirect('/admin/manage/bbs');
	});
});
app.get('/admin/manage/qna',function(req,res){
	mongoDBProvider.findAllQna( function(error,docs){
		for (var i = 0; i < docs.length; i++) {
			var document = docs[i];
			document.name = decodeURIComponent(document.name);
			document.homepage = decodeURIComponent(document.homepage);
			document.title = decodeURIComponent(document.title);
			document.message = decodeURIComponent(document.message);
			document.link1 = decodeURIComponent(document.link1);
			document.link2 = decodeURIComponent(document.link2);
		}
		res.render('admin_qna_list', { title: '관리자 페이지 : Q&A 관리',articles:docs });
	});
});
app.post('/admin/manage/qna/write',function(req,res){
	var hash = crypto.createHash('sha256').update(req.param('password')).digest('base64');
	var nameStr = encodeURIComponent(req.param('name'));
	var homepageStr = encodeURIComponent(req.param('homepage'));
	var titleStr = encodeURIComponent(req.param('title'));
	var messageStr = encodeURIComponent(req.param('message'));
	var link1Str = encodeURIComponent(req.param('link1'));
	var link2Str = encodeURIComponent(req.param('link2'));
	var json = {name:nameStr,password:hash,email:req.param('email'),homepage:homepageStr,
			title:titleStr,message:messageStr,link1:link1Str,link2:link2Str,review_count:0};
	//console.log(JSON.stringify(json));
	mongoDBProvider.saveQna(json,
		function (error, docs) {
		//res.redirect('/index-2-3.html');
		res.redirect('/sub201.html');
	});
});
app.post('/admin/manage/qna/delete',function(req,res){
	mongoDBProvider.deleteQna(req.param('id'), function(error, article){
		res.redirect('/admin/manage/qna');
	});
});
app.post('/admin/manage/freeclass/send',function(req,res){
	var nameStr = encodeURIComponent(req.param('name'));
	var emailStr = encodeURIComponent(req.param('email'));
	var schoolStr = encodeURIComponent(req.param('school1'));
	var schoolYearStr = encodeURIComponent(req.param('school2'));
	var phoneStr = encodeURIComponent(req.param('phone'));
	var callTimeStr = encodeURIComponent(req.param('call_time'));
	var callTimeTextStr = encodeURIComponent(req.param('call_time_text'));
	var cityStr = encodeURIComponent(req.param('address1'));
	var areaStr = encodeURIComponent(req.param('address2'));
	var addressStr = encodeURIComponent(req.param('address'));
	var messageStr = encodeURIComponent(req.param('message'));
	var class1Str = req.param('class1');
	var class2Str = req.param('class2');
	var class3Str = req.param('class3');
	var class4Str = req.param('class4');
	var class5Str = req.param('class5');
	var class6Str = req.param('class6');
	var class6TextStr = req.param('class6text');
	var classList = [];
	if (class1Str == 'TRUE') classList.push(encodeURIComponent("국어"));
	if (class2Str == 'TRUE') classList.push(encodeURIComponent("영어"));
	if (class3Str == 'TRUE') classList.push(encodeURIComponent("수학"));
	if (class4Str == 'TRUE') classList.push(encodeURIComponent("과학"));
	if (class5Str == 'TRUE') classList.push(encodeURIComponent("사회"));
	if (class6Str == 'TRUE') classList.push(encodeURIComponent("기타:"+class6TextStr));
	var json = {name:nameStr,email:emailStr,school:schoolStr,year:schoolYearStr,
			phone:phoneStr,calltime:callTimeStr,calltimetext:callTimeTextStr,
			city:cityStr,area:areaStr,address:addressStr,message:messageStr,
			classes:classList};
	console.log(JSON.stringify(json));
	mongoDBProvider.saveFreeClass(json,
			function (error, docs) {
			res.redirect('/index.html');
		});
});
app.post('/admin/manage/freeclass/delete',function(req,res){
	mongoDBProvider.deleteFreeClass(req.param('id'), function(error, article){
		res.redirect('/admin/manage/request');
	});
});
app.post('/admin/manage/req_teacher/send',function(req,res){
	var nameStr = encodeURIComponent(req.param('name'));//이름
	var emailStr = encodeURIComponent(req.param('email'));//이메일
	var phoneStr = encodeURIComponent(req.param('phone'));//연락처
	var genderStr = req.param('gender');//성별
	var typeStr = req.param('type');//유형
	var schoolStr = encodeURIComponent(req.param('school'));//학교정보
	var schoolMajorStr = encodeURIComponent(req.param('schoolmajor'));//전공정보
	var city1Str = encodeURIComponent(req.param('address1'));//관심지역1
	var area1Str = encodeURIComponent(req.param('address2'));
	var city2Str = encodeURIComponent(req.param('address3'));//관심지역2
	var area2Str = encodeURIComponent(req.param('address4'));
	var city3Str = encodeURIComponent(req.param('address5'));//관심지역3
	var area3Str = encodeURIComponent(req.param('address6'));
	var eduYearStr = req.param('eduyear');//경력
	var messageStr = encodeURIComponent(req.param('message'));//남기실말씀
	var class1Str = req.param('class1');
	var class2Str = req.param('class2');
	var class3Str = req.param('class3');
	var class4Str = req.param('class4');
	var class5Str = req.param('class5');
	var class6Str = req.param('class6');
	var class6TextStr = req.param('class6text');
	var classList = [];
	if (class1Str == 'TRUE') classList.push(encodeURIComponent("국어"));
	if (class2Str == 'TRUE') classList.push(encodeURIComponent("영어"));
	if (class3Str == 'TRUE') classList.push(encodeURIComponent("수학"));
	if (class4Str == 'TRUE') classList.push(encodeURIComponent("과학"));
	if (class5Str == 'TRUE') classList.push(encodeURIComponent("사회"));
	if (class6Str == 'TRUE') classList.push(encodeURIComponent("기타:"+class6TextStr));
	var json = {name:nameStr,email:emailStr,phone:phoneStr,
			gender:genderStr,type:typeStr,school:schoolStr,major:schoolMajorStr,
			city1:city1Str,area1:area1Str,city2:city2Str,area2:area2Str,
			city3:city3Str,area3:area3Str,eduyear:eduYearStr,
			message:messageStr,classes:classList
			};
	console.log(JSON.stringify(json));
	mongoDBProvider.saveTeacherInfo(json,
			function (error, docs) {
			res.redirect('/index.html');
		});
});
app.post('/admin/manage/req_teacher/delete',function(req,res){
	mongoDBProvider.deleteTeacherInfo(req.param('id'), function(error, article){
		res.redirect('/admin/manage/req_teacher');
	});
});
app.get('/users', user.list);

function sendBoardArticle(socket,msg){
	var json = {_id: ObjectID.createFromHexString(msg._id)};
	var options = {};
	mongoDBProvider.findBoard(json,options, function(error,docs){
		for (var i = 0; i < docs.length; i++) {//연,월,일 쪼개서 보내기
			var obj = docs[i];
			var dateNow = obj.created_at;
			var dd = dateNow.getDate();
			var monthSingleDigit = dateNow.getMonth() + 1,
			mm = monthSingleDigit < 10 ? '0' + monthSingleDigit : monthSingleDigit;
			var yy = dateNow.getFullYear().toString();//.substr(2);
			obj.yy = yy;
			obj.mm = mm;
			obj.dd = dd;
			var hh = dateNow.getHours();
			var mm2 = dateNow.getMinutes();
			obj.hh = hh;
			obj.mm2 = mm2;
			obj.name = decodeURIComponent(obj.name);
			obj.original_title = decodeURIComponent(obj.title);
			obj.title = '['+obj.type+'] '+decodeURIComponent(obj.title);
			obj.message = decodeURIComponent(obj.message);
			obj.original_message = obj.message;
			obj.message = obj.message.replace(/\n/g,"<BR>");
			if (obj.review_count == undefined)
				obj.review_count = '0';
			if (obj.comments == undefined)
				obj.comments = [];
			for (var j = 0; j < obj.comments.length; j++) {
				var arrObj = obj.comments[j];
				var commentDateNow = arrObj.created_at;
				var cdd = commentDateNow.getDate();
				var cmonthSingleDigit = commentDateNow.getMonth() + 1,
				cmm = cmonthSingleDigit < 10 ? '0' + cmonthSingleDigit : cmonthSingleDigit;
				var cyy = commentDateNow.getFullYear().toString();//.substr(2);
				var chh = commentDateNow.getHours();
				var cmm2 = commentDateNow.getMinutes();
				arrObj.yy = cyy;
				arrObj.mm = cmm;
				arrObj.dd = cdd;
				arrObj.hh = chh;
				arrObj.mm2 = cmm2;
				arrObj.name = decodeURIComponent(arrObj.name);
				if (arrObj.hidden == 'true') {
					arrObj.comment = '<font color=red>* 비밀글입니다.</font>';
				} else {
					arrObj.comment = decodeURIComponent(arrObj.comment);
				}
			}
		}
		socket.emit('socket_evt_get_bbs_article', JSON.stringify(docs));
	});
}

function sendQnaArticle(socket,msg){
	var json = {_id: ObjectID.createFromHexString(msg._id)};
	var options = {};
	mongoDBProvider.findQna(json,options, function(error,docs){
		for (var i = 0; i < docs.length; i++) {//연,월,일 쪼개서 보내기
			var obj = docs[i];
			var dateNow = obj.created_at;
			var dd = dateNow.getDate();
			var monthSingleDigit = dateNow.getMonth() + 1,
			mm = monthSingleDigit < 10 ? '0' + monthSingleDigit : monthSingleDigit;
			var yy = dateNow.getFullYear().toString();//.substr(2);
			obj.yy = yy;
			obj.mm = mm;
			obj.dd = dd;
			var hh = dateNow.getHours();
			var mm2 = dateNow.getMinutes();
			obj.hh = hh;
			obj.mm2 = mm2;
			obj.name = decodeURIComponent(obj.name);
			obj.original_title = decodeURIComponent(obj.title);
			obj.title = decodeURIComponent(obj.title);
			obj.message = decodeURIComponent(obj.message);
			obj.original_message = obj.message;
			obj.message = obj.message.replace(/\n/g,"<BR>");
			if (obj.review_count == undefined)
				obj.review_count = '0';
			if (obj.comments == undefined)
				obj.comments = [];
			for (var j = 0; j < obj.comments.length; j++) {
				var arrObj = obj.comments[j];
				var commentDateNow = arrObj.created_at;
				var cdd = commentDateNow.getDate();
				var cmonthSingleDigit = commentDateNow.getMonth() + 1,
				cmm = cmonthSingleDigit < 10 ? '0' + cmonthSingleDigit : cmonthSingleDigit;
				var cyy = commentDateNow.getFullYear().toString();//.substr(2);
				var chh = commentDateNow.getHours();
				var cmm2 = commentDateNow.getMinutes();
				arrObj.yy = cyy;
				arrObj.mm = cmm;
				arrObj.dd = cdd;
				arrObj.hh = chh;
				arrObj.mm2 = cmm2;
				arrObj.name = decodeURIComponent(arrObj.name);
				if (arrObj.hidden == 'true') {
					arrObj.comment = '<font color=red>* 비밀글입니다.</font>';
				} else {
					arrObj.comment = decodeURIComponent(arrObj.comment);
				}
			}
		}
		socket.emit('socket_evt_get_qna_article', JSON.stringify(docs));
	});
}

server = http.createServer(app);
var ObjectID = require ('mongodb').ObjectID;
io = socketio.listen(server);
io.sockets.on('connection', function(socket) {
	
	console.log('connection');
	socket.on('get_city_info', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('get_city_info----------------!!'+msg.ip+"/"+msg.num);
		mongoDBProvider.findCityAreaList({city:msg.city}, function(error,docs) {
			if (msg.num == undefined) {
				console.log('JSON.stringify(docs):'+JSON.stringify(docs));
				socket.emit('socket_evt_city_info', JSON.stringify(docs));
			} else {
				console.log('JSON.stringify(docs):'+'{num:'+msg.num+',results:'+JSON.stringify(docs)+'}');
				socket.emit('socket_evt_city_info', '{"num":"'+msg.num+'","results":'+JSON.stringify(docs)+'}');
			}
		});
	});
	socket.on('get_news', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('get_news----------------!!'+msg.ip);
		
		mongoDBProvider.findAllNews( function(error,docs){
			for (var i = 0; i < docs.length; i++) {//연,월,일 쪼개서 보내기
				var obj = docs[i];
				var dateNow = obj.created_at;
			    var dd = dateNow.getDate();
			    var monthSingleDigit = dateNow.getMonth() + 1,
			        mm = monthSingleDigit < 10 ? '0' + monthSingleDigit : monthSingleDigit;
			    var yy = dateNow.getFullYear().toString();//.substr(2);
			    obj.yy = yy;
			    obj.mm = mm;
			    obj.dd = dd;
			}
			socket.emit('socket_evt_get_news', JSON.stringify(docs));
		});
	});
	////////////////////////////////////////////////////////// 이용후기 게시판
	socket.on('get_bbs', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('get_bbs----------------!!'+msg.ip);
		//console.log(msg.keyword);
		var json;
		var pageNum = 0;
		if (msg.page != undefined) {
			pageNum = msg.page-1;
		}
		var listCount = 5;
		var options = {
			"skip" : pageNum*listCount,
			"limit" : listCount
		};
		var totalCount = 0;
		mongoDBProvider.findAllBoard( function(error,docs){
			totalCount = docs.length;
		});
		if (msg.keyword == undefined || msg.keyword == '{}') {
			if (msg.type == undefined || msg.type == '전체') {
				json = { };
			} else {
				json = { type:msg.type	};
			}
		} else {
			var keywordStr = encodeURIComponent(msg.keyword);
			if (msg.type == undefined || msg.type == '전체') {
				json = { title:{$regex:keywordStr}	};
			} else {
				json = { title:{$regex:keywordStr}, type:msg.type	};
			}
		}
		var pageCount = 0;
		mongoDBProvider.findBoard(json,{}, function(error,docs){
			pageCount = Math.floor(docs.length / listCount);
			if (docs.length % listCount > 0)
				pageCount++;
		});
		mongoDBProvider.findBoard(json,options, function(error,docs){
			for (var i = 0; i < docs.length; i++) {//연,월,일 쪼개서 보내기
			var obj = docs[i];
			var dateNow = obj.created_at;
			var dd = dateNow.getDate();
			var monthSingleDigit = dateNow.getMonth() + 1,
			    mm = monthSingleDigit < 10 ? '0' + monthSingleDigit : monthSingleDigit;
			var yy = dateNow.getFullYear().toString();//.substr(2);
			obj.yy = yy;
			obj.mm = mm;
			obj.dd = dd;
			obj.name = decodeURIComponent(obj.name);
			obj.title = '['+obj.type+'] '+decodeURIComponent(obj.title);
			if (obj.review_count == undefined)
				obj.review_count = '0';
			if (obj.comments == undefined)
				obj.comments = [];
			if (obj.comments.length > 0)
				obj.title = obj.title + ' ('+obj.comments.length+')';
			}
			socket.emit('socket_evt_get_bbs', '{"docs":'+JSON.stringify(docs)+',"total":'+totalCount+
			',"curPage":'+(pageNum+1)+',"totalPage":'+pageCount+'}');
		});
	});
	socket.on('get_bbs_article', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('get_bbs_article----------------!!'+msg.ip);
		mongoDBProvider.updateBoard(msg._id,{$inc:{"review_count":1}},function(){});//조회수 증가
		sendBoardArticle(socket,msg);
	});
	socket.on('delete_bbs_article', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('delete_bbs_article----------------!!'+msg.ip);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		var password = '';
		mongoDBProvider.findBoard({_id:ObjectID.createFromHexString(msg._id)},{}, function(error,docs){
			//console.log(docs);
			password = docs[0].password;
			//console.log(password+'\n'+hash);
			if (password == hash) {
				mongoDBProvider.deleteBoard(msg._id, function(){
					socket.emit('socket_evt_delete_bbs_article_success', {});
				});
			} else {
				socket.emit('socket_evt_delete_bbs_article_fail', {});
			}
		});
	});
	socket.on('modify_bbs_article', function(raw_msg) {
		//console.log(raw_msg);
		var msg = JSON.parse(raw_msg);
		console.log('modify_bbs_article----------------!!'+msg.ip);
		//var nameStr = encodeURIComponent(msg.name);
		//var titleStr = encodeURIComponent(msg.title);
		//var messageStr = encodeURIComponent(msg.message);
		mongoDBProvider.updateBoard(msg._id,
				{$set:{"name":msg.name,"title":msg.title,"message":msg.message}},
				function(){
					socket.emit('socket_evt_modify_bbs_article_success', {});
				});
	});
	socket.on('check_bbs_article_password', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('check_bbs_article_password----------------!!'+msg.ip);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		var password = '';
		mongoDBProvider.findBoard({_id:ObjectID.createFromHexString(msg._id)},{}, function(error,docs){
			//console.log(docs);
			password = docs[0].password;
			//console.log(password+'\n'+hash);
			if (password == hash) {
				socket.emit('socket_evt_check_bbs_article_password_success', {});
			} else {
				socket.emit('socket_evt_check_bbs_article_password_fail', {});
			}
		});
	});
	socket.on('set_bbs_comment', function(raw_msg) {
		//console.log(raw_msg);
		var msg = JSON.parse(raw_msg);
		console.log('set_bbs_comment----------------!!'+msg.ip);
		var nameStr = encodeURIComponent(msg.name);
		var commentStr = encodeURIComponent(msg.comment);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		mongoDBProvider.updateBoard(msg._id,
				{$push:{"comments":{"name":nameStr,"password":hash,"comment":commentStr,"hidden":msg.hidden,
					"created_at":new Date()}}},
				function(){
						sendBoardArticle(socket,msg);
					});
	});
	socket.on('delete_bbs_comment', function(raw_msg) {
		//console.log(raw_msg);
		var msg = JSON.parse(raw_msg);
		console.log('delete_bbs_comment----------------!!'+msg.ip);
		var nameStr = encodeURIComponent(msg.name);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		mongoDBProvider.updateBoard(msg._id,
				{$pull:{"comments":{"name":nameStr,"password":hash}}},
				function(){
					sendBoardArticle(socket,msg);
				});
	});
	//////////////////////////////////////////////////////////질문과답변 게시판
	socket.on('get_qna', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('get_qna----------------!!'+msg.ip);
		//console.log(msg.keyword);
		var json;
		var pageNum = 0;
		if (msg.page != undefined) {
			pageNum = msg.page-1;
		}
		var listCount = 5;
		var options = {
			"skip" : pageNum*listCount,
			"limit" : listCount
		};
		var totalCount = 0;
		mongoDBProvider.findAllQna( function(error,docs){
			totalCount = docs.length;
		});
		if (msg.keyword == undefined || msg.keyword == '{}') {
			json = { };
		} else {
			var keywordStr = encodeURIComponent(msg.keyword);
			json = { title:{$regex:keywordStr}	};
		}
		var pageCount = 0;
		mongoDBProvider.findQna(json,{}, function(error,docs){
			pageCount = Math.floor(docs.length / listCount);
			if (docs.length % listCount > 0)
				pageCount++;
		});
		mongoDBProvider.findQna(json,options, function(error,docs){
			for (var i = 0; i < docs.length; i++) {//연,월,일 쪼개서 보내기
				var obj = docs[i];
				var dateNow = obj.created_at;
				var dd = dateNow.getDate();
				var monthSingleDigit = dateNow.getMonth() + 1,
				    mm = monthSingleDigit < 10 ? '0' + monthSingleDigit : monthSingleDigit;
				var yy = dateNow.getFullYear().toString();//.substr(2);
				obj.yy = yy;
				obj.mm = mm;
				obj.dd = dd;
				obj.name = decodeURIComponent(obj.name);
				obj.title = decodeURIComponent(obj.title);
				if (obj.review_count == undefined)
					obj.review_count = '0';
				if (obj.comments == undefined)
					obj.comments = [];
				if (obj.comments.length > 0)
					obj.title = obj.title + ' ('+obj.comments.length+')';
			}
			socket.emit('socket_evt_get_qna', '{"docs":'+JSON.stringify(docs)+',"total":'+totalCount+
			',"curPage":'+(pageNum+1)+',"totalPage":'+pageCount+'}');
		});
	});
	socket.on('get_qna_article', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('get_qna_article----------------!!'+msg.ip);
		mongoDBProvider.updateQna(msg._id,{$inc:{"review_count":1}},function(){});//조회수 증가
		sendQnaArticle(socket,msg);
	});
	socket.on('delete_qna_article', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('delete_qna_article----------------!!'+msg.ip);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		var password = '';
		mongoDBProvider.findQna({_id:ObjectID.createFromHexString(msg._id)},{}, function(error,docs){
			//console.log(docs);
			password = docs[0].password;
			//console.log(password+'\n'+hash);
			if (password == hash) {
				mongoDBProvider.deleteQna(msg._id, function(){
					socket.emit('socket_evt_delete_qna_article_success', {});
				});
			} else {
				socket.emit('socket_evt_delete_qna_article_fail', {});
			}
		});
	});
	socket.on('modify_qna_article', function(raw_msg) {
		//console.log(raw_msg);
		var msg = JSON.parse(raw_msg);
		console.log('modify_qna_article----------------!!'+msg.ip);
		//var nameStr = encodeURIComponent(msg.name);
		//var titleStr = encodeURIComponent(msg.title);
		//var messageStr = encodeURIComponent(msg.message);
		mongoDBProvider.updateQna(msg._id,
				{$set:{"name":msg.name,"title":msg.title,"message":msg.message}},
				function(){
					socket.emit('socket_evt_modify_qna_article_success', {});
				});
	});
	socket.on('check_qna_article_password', function(raw_msg) {
		var msg = JSON.parse(raw_msg);
		console.log('check_qna_article_password----------------!!'+msg.ip);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		var password = '';
		mongoDBProvider.findQna({_id:ObjectID.createFromHexString(msg._id)},{}, function(error,docs){
			//console.log(docs);
			password = docs[0].password;
			//console.log(password+'\n'+hash);
			if (password == hash) {
				socket.emit('socket_evt_check_qna_article_password_success', {});
			} else {
				socket.emit('socket_evt_check_qna_article_password_fail', {});
			}
		});
	});
	socket.on('set_qna_comment', function(raw_msg) {
		//console.log(raw_msg);
		var msg = JSON.parse(raw_msg);
		console.log('set_qna_comment----------------!!'+msg.ip);
		var nameStr = encodeURIComponent(msg.name);
		var commentStr = encodeURIComponent(msg.comment);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		mongoDBProvider.updateQna(msg._id,
				{$push:{"comments":{"name":nameStr,"password":hash,"comment":commentStr,"hidden":msg.hidden,
					"created_at":new Date()}}},
				function(){
						sendQnaArticle(socket,msg);
					});
	});
	socket.on('delete_qna_comment', function(raw_msg) {
		//console.log(raw_msg);
		var msg = JSON.parse(raw_msg);
		console.log('delete_qna_comment----------------!!'+msg.ip);
		var nameStr = encodeURIComponent(msg.name);
		var hash = crypto.createHash('sha256').update(msg.password).digest('base64');
		mongoDBProvider.updateQna(msg._id,
				{$pull:{"comments":{"name":nameStr,"password":hash}}},
				function(){
					sendQnaArticle(socket,msg);
				});
	});
});
io.sockets.on('close', function(socket) {

});

/*http.createServer(app)*/server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
