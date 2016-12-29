
'use strict'
const http = require('http')
const httpProxy = require('http-proxy')
const url = require('url')
const util = require('util')
const schedule = require('node-schedule')
const express = require('express')
const ejs = require('ejs')
const promise = require('promise')
var AV = require('leanengine');

var app = express();

//个人编写爬虫函数
const reptileFun=require('./reptile-module')
var estateStack={}

// 扩展数组功能 检测元素是否在数组内
Array.prototype.inArray = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

// 加载云引擎中间件
app.use(AV.express());

const onRequest = (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*', 'charset': 'utf-8'})
    let url_param=url.parse(req.url, true).query;

    // recieve keyword from the client side and use it to make requests
    //58
    if (url_param.query && url_param.query=='58') {
        reptileFun.get58(url_param).then(function(data){
          console.log(data);
          res.write(JSON.stringify(data));
          res.end();
        })
    }
    if (url_param.query && url_param.query=='xz') {
        reptileFun.getxz(url_param).then(function(data){
          res.write(JSON.stringify(data));
          res.end();
        })
    }
}



// 首次获取58，西子房源数据
{
  reptileFun.reptile().then(function(data){
    estateStack=data;
    console.log(data);
    console.log('首次获取58，西子房源数据成功');
  })
};

//每个15分钟爬虫取数据比对是否更新
{
  var rule = new schedule.RecurrenceRule();
  // rule.minute = [0, 15, 45];
  rule.second=[0, 15 ,45];
  var j = schedule.scheduleJob(rule, function(){
    // 爬虫定时取数据
    reptileFun.reptile().then(function(data){
      let comparDat=data;
      let comparHash={};
      if (!!estateStack) {
        //比对数据是否更新
        for(let key in comparDat){
          let len=comparDat[key].length;
          while (len--){
            let cur=comparDat[key][len];
            if (!estateStack.inAarry(cur)) {
              comparHash[key]=true;
              console.log(comparDat[key][len]+'新数据');
              console.log(estateStack[key][len]);
            }
          }
        }
        for(let site in comparHash){
          let curSite=comparHash[site];
          if (curSite) {
            //更新数据则提醒，并推送数据
            estateStack[site]=comparDat[site];
          }
        }
      }

    })//
  });//sechecdule
}



app.use(express.static('./dist'));
// views is directory for all template files
app.set('views', './dist');
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/api', function(req, res) {
  console.log('api')
  onRequest(req, res);
})

// error handlers
app.use(function(err, req, res, next) { // jshint ignore:line
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if(statusCode === 500) {
    console.error(err.stack || err);
  }
  if(req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {}
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});


module.exports = app;
