
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
  })
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
