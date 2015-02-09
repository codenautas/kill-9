
var assert = require('assert');
var http = require('http');
var request = require('supertest');
var kill9 = require('..');

var killedExitCode=false;

describe('kill9()', function(){
  describe('basic operations', function(){
    var server;
    before(function () {
      killedExitCode = false;
      server = createServer({
        exitCode:15,
        messageKilled:"yeah'killed",
        process:{pid:444, exit:function(code){ killedExitCode = code; /* throw new Error('kill tested'); */ }}
      });
    });

    it('should kill if pid match', function(done){
      request(server)
      .get('/kill-9?pid=444')
      .expect(200, "yeah'killed", function(){
        assert.equal(killedExitCode,15);
        done();
      });
    });

    it('should not kill if pid not match', function(done){
      request(server)
      .get('/kill-9?pid=99')
      .expect(404, 'kill -9 unknown', done);
    });

    it('should pass if statement not present', function(done){
      request(server)
      .get('/other')
      .expect(404, 'sorry!', done);
    });
    
    it('should log to console.log', function(){
      var save_log=console.log;
      var messages={
        "kill-9 installed. true":0,
        "pid=444":0
      };
      var log_mock=function(message){
        if(message in messages){
            messages[message]++;
        }
      };
      console.log=log_mock;
      createServer({log:true, process:{pid:444}});
      console.log=save_log;
      assert.deepEqual(messages,{
        "kill-9 installed. true":1,
        "pid=444":1
      });
    });
  })

  describe('exceptional operations', function(){
    it('must ensure locate for redirects', function(){
      assert.throws(function(){ kill9({statusKilled:301}) }, /options.locate required/);
    });
    it('must ensure locate for bad redirects', function(){
      assert.throws(function(){ kill9({statusBad:301}) }, /options.locate required/);
    });
    it('must ensure redirects if option locate present', function(){
      assert.throws(function(){ kill9({locate:"other_site.kom"}) }, /options.locate is only for redirect/);
    });
  });
});

function createServer(opts, fn) {
  var _serve = kill9(opts);
  return http.createServer(function (req, res) {
    fn && fn(req, res);
    _serve(req, res, function (err) {
      res.statusCode = err ? (err.status || 500) : 404;
      res.end(err ? err.stack : 'sorry!');
    });
  });
}
