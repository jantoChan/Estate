'use strict';

var app = require('./backend-server/crawler-server');

// LeanEngine 运行时会分配端口并赋值到该变量。
var PORT = parseInt(process.env.PORT || 8080);
var server = app.listen(PORT, function () {
  console.log('Hero is comming:', PORT);

  // 注册全局未捕获异常处理器
  process.on('uncaughtException', function(err) {
    console.error("Caught exception:", err.stack);
  });
  process.on('unhandledRejection', function(reason, p) {
    console.error("Unhandled Rejection at: Promise ", p, " reason: ", reason.stack);
  });
});
