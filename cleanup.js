const Moment = require('moment-timezone');
const fs = require('fs');

function noOp() {};

exports.Cleanup = function Cleanup(callback) {
  callback = callback || noOp;
  process.on('cleanup',callback);

  process.on('exit', function () {
    process.emit('cleanup');
  });

  process.on('SIGINT', function () {
    console.log('Ctrl-C...');
    process.exit(2);
  });

  process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    var time = Moment().tz('Australia/Perth').format('MMMM Do YYYY, h_mm_ss a') ;
    fs.writeFileSync(__dirname + "/crash " + time + ".txt", e.stack);
    console.log("Exception Stored To Crash File!");
    process.exit(99);
  });
};
