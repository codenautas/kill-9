
var assert = require('assert');
var http = require('http');
var request = require('supertest');
var kill9 = require('..');
var killedExitCode=false;

describe('kill9()', function(){
  function createPostForm(exclude) {
      var obj = {
        'masterpass':'secret',
        'submit':'Ok',
        'params':JSON.stringify(kill9.postParams),
        'confirmTimeout':(new Date().getTime()+60*1000).toString()
     };
     if(exclude) {
        exclude.forEach(function(prop) { delete obj[prop]; });
     }
     return obj;
  }
  describe('basic operations', function(){
    var server;
    before(function () {
      killedExitCode = false;
      server = createServer({
        exitCode:15,
        messageKilled:"yeah'killed",
        masterPass:'secret',
        process:{pid:444, exit:function(code){ killedExitCode = code; }}
      });
    });
    
    it('should kill if pid match', function(done){
      request(server)
      .get('/kill-9?pid=444')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function(err, res){
          if(err) { return done(err); }
          request(server)
          .post('/kill-9')
          .send(createPostForm())
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .expect(200, "yeah'killed")
          .end(function(err, res){
                if (err) { return done(err); }
                assert.equal(killedExitCode,15);
                done();
          });
      });
    });

    it('should not kill if pid not match', function(done){
      request(server)
      .get('/kill-9?pid=99')
      .expect('Content-Type', 'text/plain; charset=utf-8')
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
      createServer({log:true, process:{pid:444}, masterPass:'secret'});
      console.log=save_log;
      assert.deepEqual(messages,{
        "kill-9 installed. true":1,
        "pid=444":1
      });
    });
    
    ['masterpass'].forEach(function(wrongVar) {
        it('should fail if form variable "'+wrongVar+'" missing', function(done){
          request(server)
          .get('/kill-9?pid=444')
          .end(function(err, res){
              if(err) { return done(err); }
              request(server)
              .post('/kill-9')
              .send(createPostForm([wrongVar]))
              .expect(404, "kill -9 tainted vars")
              .end(function(err, res){
                    if (err) { return done(err); }
                    done();
              });
          });
        });
    });
  })

  describe('exceptional operations', function(){
    it('must ensure location for redirects', function(){
      assert.throws(function(){ kill9({statusKilled:301}) }, /options.location required/);
    });
    it('must ensure location for bad redirects', function(){
      assert.throws(function(){ kill9({statusBad:301}) }, /options.locationBad required/);
    });
    it('must ensure redirects if option location present', function(){
      assert.throws(function(){ kill9({location:"other_site.kom"}) }, /options.location is only for redirect/);
    });
    it('must ensure redirects if option location present', function(){
      assert.throws(function(){ kill9({locationBad:"other_site.kom"}) }, /options.locationBad is only for redirect/);
    });
    it('must fail if no masterPass is provided', function(){
      assert.throws(function(){ kill9({}) }, /options.materPass is required/);
    });
  });
  
  describe('redirect operations', function(){
    var createRedirectServer;
    before(function () {
        createRedirectServer = function(reference){
            kill9.defaults.exitCode=999;
            return createServer({
                process:{pid:555, exit:function(code){ reference.code = code; }},
                statusKilled:300,
                location:"other_site.kom/?killed=1",
                statusBad:303,
                locationBad:"other_site.kom/?killed=0",
                masterPass:'secret'
            });
        };
    });

    it('should redirect killed', function(done){
      var reference={};
      request(createRedirectServer(reference))
      .get('/kill-9?pid=555')
      .end(function(err, res){
          if(err) { return done(err); }
          request(createRedirectServer(reference))
          .post('/kill-9')
          .send(createPostForm())
          .expect('Location', 'other_site.kom/?killed=1')
          .expect(300)
          .end(function(err, res){
                if (err) { return done(err); }
                assert.equal(reference.code,999);
                done();
          });
      });
    });
    it('should redirect bad kills', function(done){
      var reference={code:'untouched'};
      request(createRedirectServer(reference))
      .get('/kill-9?pid=777')
      .expect('Location', 'other_site.kom/?killed=0')
      .expect(303)
      .end(function(err, res){
        if (err) return done(err);
        assert.equal(reference.code,'untouched');
        done();
      });
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
