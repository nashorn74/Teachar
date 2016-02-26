/**
 * New node file
 */
var Db = require('mongodb').Db;
var Connection = require ('mongodb').Connection ;
var Server = require ('mongodb').Server;
var BSON = require ('mongodb').BSON;
var ObjectID = require ('mongodb').ObjectID;

MongoDBProvider = function (host, port) {
    this.db = new Db('test', new Server(host, port, {auto_reconnect: true}), {safe:false});
    this.db.open(function(error){
      if (!error){
	console.log ("We are connected");
      }else {
	console.log (error);
      }
    });
}

//---------------------관리자 패스워드 관련-----------------------------

MongoDBProvider.prototype.getIdCollection= function(callback){
    this.db.collection('ids', function(error, id_collection) {
			   if (error) callback(error);
			   else callback(null, id_collection);
		
		       });
};

MongoDBProvider.prototype.getAdminId = function(callback) {
    this.getIdCollection(function (error, id_collection) {
    	if (error ) callback(error);
    	else {
    	    id_collection.find().toArray(function(error, results){
	    		if (error) callback(error);
	    		else callback(null, results);
    		});
    	}
    });
};

MongoDBProvider.prototype.setAdminId = function (id, callback) {
	  this.getIdCollection(function (error, id_collection)  {
	    if (error) callback (error);
	    else {
	      id_collection.insert(id, function() {
	    	  callback(null, id);
	      });
	    }
	  });
};

//--------------------- 주소 정보 관련 -----------------------------

MongoDBProvider.prototype.getCityCollection= function(callback){
    this.db.collection('cities', function(error, id_collection) {
			   if (error) callback(error);
			   else callback(null, id_collection);
		
		       });
};

MongoDBProvider.prototype.findCityAreaList = function(city, callback) {
	this.getCityCollection(function(error, city_collection) {
		if (error) callback(error);
		else {
			city_collection.find(city).toArray(function(error, results) {
				if (error) callback(error);
	    		else callback(null, results);
			});
		}
	});
};

//--------------------- 무료수업 관련 ------------------------------

MongoDBProvider.prototype.getFreeClassCollection= function(callback){
    this.db.collection('free_classes', function(error, id_collection) {
			   if (error) callback(error);
			   else callback(null, id_collection);
		
		       });
};

MongoDBProvider.prototype.findAllFreeClass = function (callback) {
    this.getFreeClassCollection(function (error, freeclass_collection) {
	if (error ) callback(error);
	else {
		freeclass_collection.find().sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};

MongoDBProvider.prototype.findFreeClass = function (where,options,callback) {
    this.getFreeClassCollection(function (error, freeclass_collection) {
	if (error ) callback(error);
	else {
		freeclass_collection.find(where,options).sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};

MongoDBProvider.prototype.saveFreeClass = function (articles, callback) {
	  this.getFreeClassCollection(function (error, freeclass_collection)  {
	    if (error) callback (error);
	    else {
	      if ( typeof (articles.length)== "undefined")
	    	  articles = [articles];

	      for (var i=0;i <articles.length;i++) {
			article = articles[i];
			article.created_at = new Date();
	      }

	      freeclass_collection.insert(articles, function() {
	    	  callback(null, articles);
	      });
	    }
	  });
	};
	
MongoDBProvider.prototype.deleteFreeClass = function(id, callback) {
	  this.getFreeClassCollection(function (error, freeclass_collection) {
	    if(error)
	      callback(error);
	    else {
	    	freeclass_collection.remove({_id: ObjectID.createFromHexString(id)}, function(error, result) {
		if (error)
		  callback (error);
		else
		  callback(null, result);
		});
	    }
	  });
	};
	
//--------------------- 선생님 신청 관련 ----------------------------
	
MongoDBProvider.prototype.getReqTeacherCollection= function(callback){
    this.db.collection('req_teachers', function(error, id_collection) {
			   if (error) callback(error);
			   else callback(null, id_collection);
		
		       });
};

MongoDBProvider.prototype.findAllReqTeacher = function (callback) {
    this.getReqTeacherCollection(function (error, reqteacher_collection) {
	if (error ) callback(error);
	else {
		reqteacher_collection.find().sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};

MongoDBProvider.prototype.findReqTeacher = function (where,options,callback) {
    this.getReqTeacherCollection(function (error, reqteacher_collection) {
	if (error ) callback(error);
	else {
		reqteacher_collection.find(where,options).sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};
	
MongoDBProvider.prototype.saveTeacherInfo = function (articles, callback) {
	  this.getReqTeacherCollection(function (error, reqteacher_collection)  {
	    if (error) callback (error);
	    else {
	      if ( typeof (articles.length)== "undefined")
	    	  articles = [articles];

	      for (var i=0;i <articles.length;i++) {
			article = articles[i];
			article.created_at = new Date();
	      }

	      reqteacher_collection.insert(articles, function() {
	    	  callback(null, articles);
	      });
	    }
	  });
	};
	
MongoDBProvider.prototype.deleteTeacherInfo = function(id, callback) {
	this.getReqTeacherCollection(function (error, reqteacher_collection) {
		if(error) {
			callback(error);
		}else {
			reqteacher_collection.remove({_id: ObjectID.createFromHexString(id)}, function(error, result) {
				if (error) { callback (error); }
				else { callback(null, result); }
			});
		}
	});
};

//--------------------- 새소식 관리 관련-----------------------------

MongoDBProvider.prototype.getNewsCollection= function(callback){
    this.db.collection('articles', function(error, article_collection) {
			   if (error) callback(error);
			   else callback(null, article_collection);
		
		       });
};

MongoDBProvider.prototype.findAllNews = function (callback) {
    this.getNewsCollection(function (error, article_collection) {
	if (error ) callback(error);
	else {
	    article_collection.find().sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};

MongoDBProvider.prototype.saveNews = function (articles, callback) {
  this.getNewsCollection(function (error, article_collection)  {
    if (error) callback (error);
    else {
      if ( typeof (articles.length)== "undefined")
    	  articles = [articles];

      for (var i=0;i <articles.length;i++) {
		article = articles[i];
		article.created_at = new Date();
      }

      article_collection.insert(articles, function() {
    	  callback(null, articles);
      });
    }
  });
};

MongoDBProvider.prototype.deleteNews = function(id, callback) {
  this.getNewsCollection(function (error, article_collection) {
    if(error)
      callback(error);
    else {
      article_collection.remove({_id: ObjectID.createFromHexString(id)}, function(error, result) {
	if (error)
	  callback (error);
	else
	  callback(null, result);
	});
    }
  });
};

//--------------------- 이용후기 관리 관련-----------------------------

MongoDBProvider.prototype.getBoardCollection= function(callback){
    this.db.collection('boards', function(error, board_collection) {
	   if (error) callback(error);
	   else callback(null, board_collection);
    });
};

MongoDBProvider.prototype.findAllBoard = function (callback) {
    this.getBoardCollection(function (error, board_collection) {
		if (error ) callback(error);
		else {
			board_collection.find().sort({created_at:-1}).toArray(function(error, results){
			if (error) callback(error);
				else callback(null, results);
			});
	    }
	});
};

MongoDBProvider.prototype.findBoard = function (where,options,callback) {
    this.getBoardCollection(function (error, board_collection) {
	if (error ) callback(error);
	else {
		board_collection.find(where,options).sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};

MongoDBProvider.prototype.saveBoard = function (articles, callback) {
  this.getBoardCollection(function (error, board_collection)  {
    if (error) callback (error);
    else {
      if ( typeof (articles.length)== "undefined")
    	  articles = [articles];

      for (var i=0;i <articles.length;i++) {
		var article = articles[i];
		article.created_at = new Date();
		article.comments = [];
      }

      board_collection.insert(articles, function() {
    	  callback(null, articles);
      });
    }
  });
};

MongoDBProvider.prototype.updateBoard = function(id,json,callback) {
	  this.getBoardCollection(function (error, board_collection) {
	    if(error)
	      callback(error);
	    else {
	    	board_collection.update({_id: ObjectID.createFromHexString(id)}, json,function(error, result) {
		if (error)
		  callback (error);
		else
		  callback(null, result);
		});
	    }
	  });
	};

MongoDBProvider.prototype.deleteBoard = function(id, callback) {
	  this.getBoardCollection(function (error, board_collection) {
	    if(error)
	      callback(error);
	    else {
	    	board_collection.remove({_id: ObjectID.createFromHexString(id)}, function(error, result) {
		if (error)
		  callback (error);
		else
		  callback(null, result);
		});
	    }
	  });
	};
	
//--------------------- Q&A 관리 관련-----------------------------

MongoDBProvider.prototype.getQnaCollection= function(callback){
    this.db.collection('qnas', function(error, qna_collection) {
	   if (error) callback(error);
	   else callback(null, qna_collection);
    });
};

MongoDBProvider.prototype.findAllQna = function (callback) {
    this.getQnaCollection(function (error, qna_collection) {
	if (error ) callback(error);
	else {
		qna_collection.find().sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};

MongoDBProvider.prototype.findQna = function (where,options,callback) {
    this.getQnaCollection(function (error, qna_collection) {
	if (error ) callback(error);
	else {
		qna_collection.find(where,options).sort({created_at:-1}).toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};

MongoDBProvider.prototype.saveQna = function (articles, callback) {
  this.getQnaCollection(function (error, qna_collection)  {
    if (error) callback (error);
    else {
      if ( typeof (articles.length)== "undefined")
    	  articles = [articles];

      for (var i=0;i <articles.length;i++) {
		var article = articles[i];
		article.created_at = new Date();
		article.comments = [];
      }

      qna_collection.insert(articles, function() {
    	  callback(null, articles);
      });
    }
  });
};

MongoDBProvider.prototype.updateQna = function(id,json,callback) {
	  this.getQnaCollection(function (error, qna_collection) {
	    if(error)
	      callback(error);
	    else {
	    	qna_collection.update({_id: ObjectID.createFromHexString(id)}, json,function(error, result) {
		if (error)
		  callback (error);
		else
		  callback(null, result);
		});
	    }
	  });
	};

MongoDBProvider.prototype.deleteQna = function(id, callback) {
	  this.getQnaCollection(function (error, qna_collection) {
	    if(error)
	      callback(error);
	    else {
	    	qna_collection.remove({_id: ObjectID.createFromHexString(id)}, function(error, result) {
		if (error)
		  callback (error);
		else
		  callback(null, result);
		});
	    }
	  });
	};

//--------------------- 기타 ----------------------------

MongoDBProvider.prototype.getCollection= function(callback){
    this.db.collection('articles', function(error, article_collection) {
			   if (error) callback(error);
			   else callback(null, article_collection);
		
		       });
};

MongoDBProvider.prototype.findAll = function (callback) {
    this.getCollection(function (error, article_collection) {
	if (error ) callback(error);
	else {
	    article_collection.find().toArray(function(error, results){
		if (error) callback(error);
		else callback(null, results);
		});
	    }
	});
};
		

MongoDBProvider.prototype.findById = function(id, callback) {
  this.getCollection(function (error, article_collection) {
    if(error)
      callback(error);
    else {
      article_collection.findOne({_id: ObjectID.createFromHexString(id)}, function(error, result) {
	if (error)
	  callback (error);
	else
	  callback(null, result);
	});
    }
  });
};


MongoDBProvider.prototype.addCommentToArticle = function (articleId, comment, callback){
  this.getCollection(function(error, article_collection) {
    if (error) {
    	console.log("addCommentToArticle #1:"+error);
    	callback (error) ;
    }
    else {
      article_collection.update({
	_id: ObjectID.createFromHexString(articleId)},
	{"$push": {comments: comment}},
	function (error, article){
	if (error )
	{
		console.log("addCommentToArticle #2:"+error);
		callback(error);
	}
	else callback (null , article);});
    }
  });
}

MongoDBProvider.prototype.save = function (articles, callback) {
  this.getCollection(function (error, article_collection)  {
    if (error) callback (error);
    else {
      if ( typeof (articles.length)== "undefined")
	articles = [articles];

      for (var i=0;i <articles.length;i++) {
	article = articles[i];
	article.created_at = new Date();
	
	if (article.comments == undefined)
	  article.comments = [];
	
	for (var j=0; j < article.comments.length ; j++) {
	  article.comments[j].created_at = new Date();
	}
      }

      article_collection.insert(articles, function() {
	callback(null, articles);
      });
    }
  });
};

exports.MongoDBProvider = MongoDBProvider;