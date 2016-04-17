"use strict";

var _ = require('lodash');
var expect = require('expect.js');
var crypto = require('crypto');
var express = require('express');
var request = require('supertest');
var sinon = require('sinon');
var kill9 = require('..');
var killedExitCode=false;
var bodyParser = require('body-parser');
var Promises = require('promise-plus');

['post', 'get'].forEach(function(VERB){ ['', '/prefixed'].forEach(function(prefix){ 
    describe('kill-9 prefix:'+prefix+' '+VERB, function(){
        function createPostForm(exVar) {
            var obj = {
                masterpass: 'secret',
                params: 'default'
            };
            if(exVar) {
                if(exVar.value !== undefined) {
                    obj[exVar.name] = exVar.value;
                } else {
                    delete obj[exVar.name];
                }
            }
            return obj;
        }
        function send(res, server, object){
            var params = res.text.match(/name="params" value='({[^}]*})'/)[1];
            if(object.params==='default'){
                object.params=params;
            }
            var actionLocation = res.text.match(/action="([^"]*)"/)[1];
            var method = res.text.match(/method="([^"]*)"/)[1];
            if(method==='post'){
                return request(server)
                    .post(actionLocation)
                    .type('form')
                    .send(object);
            }else{
                return request(server)
                    .get(prefix+'/kill-9?'+_.map(object,function(value,key){ return key+'='+value; }).join('&'));
            }
        }
        describe('basic operations', function(){
            var server;
            var server_get = function server_get(s){ server = s };
            before(function (done) {
                killedExitCode = false;
                createServer({
                    exitCode:15,
                    messageKilled:"yeah'killed",
                    "master-pass":'secret',
                    process:{pid:444, exit:function(code){ killedExitCode = code; }}
                }).then(server_get).then(done,done);
            });
            it('should kill if pid match', function(done){
                request(server)
                .get(prefix+'/kill-9?pid=444')
                .expect('Content-Type', 'text/html; charset=utf-8')
                .end(function(err, res){
                    if(err) { return done(err); }
                    var actionLocation = res.text.match(/action="([^"]*)"/)[1];
                    var method = res.text.match(/method="([^"]*)"/)[1];
                    expect(actionLocation).to.eql(prefix+'/kill-9');
                    expect(method).to.eql(VERB);
                    send(res, server, {params:'default', masterpass:'secret'})
                    .expect('Content-Type', 'text/plain; charset=utf-8')
                    .expect(200, "yeah'killed")
                    .end(function(err, res){
                        if (err) { return done(err); }
                        if(killedExitCode!=15 || res.status!=200){
                            console.log("NOT EXPECTED",res.text,res.status,killedExitCode);
                        }
                        expect(killedExitCode).to.eql(15);
                        done();
                    });
                });
            });
            it('should not kill if pid not match', function(done){
                request(server)
                .get(prefix+'/kill-9?pid=99')
                .expect('Content-Type', 'text/plain; charset=utf-8')
                .expect(404, 'kill -9 unknown', done);
            });
            it('should pass if statement not present', function(done){
                request(server)
                .get('/other')
                .expect(404, /Cannot GET .other/, done);
            });    
            it('should log to console.log', function(done){
                var messages={
                    "kill-9 installed. true":0,
                    "pid=444":0
                };
                sinon.stub(console,'log',function(){});
                createServer({log:true, process:{pid:444}, "master-pass":'secret'}).then(server_get).then(function(){
                    expect(console.log.args).to.eql([
                        [ 'kill-9 installed: true v'+require('../package.json').version ],
                        [ 'pid=undefined' ]
                    ]);
                }).then(function(){
                    console.log.restore();
                }).then(done,done);
            });
            [
                {name:'masterpass', err:'tainted vars'},
                {name:'params', err:'tainted content', value:'asdfasdflñj-asdf'},
                {name:'masterpass', err:'authentication error', value:'not a secret'}
            ].forEach(function(wrongVar) {
                it('should fail with wrong form variable "'+wrongVar.name+'" with value '+wrongVar.value, function(done){
                    request(server)
                    .get(prefix+'/kill-9?pid=444')
                    .end(function(err, res){
                        if(err) { return done(err); }
                        send(res, server, createPostForm(wrongVar))
                        .expect(404, "kill -9 "+wrongVar.err)
                        .end(function(err, res){
                            if (err) { return done(err); }
                            done();
                        });
                    });
                });
            })
        })
        describe('exceptional operations', function(){
            it('must ensure location for redirects', function(){
                expect(function(){ kill9({statusKilled:301}) }).to.throwException(/options.location required/);
            });
            it('must ensure location for bad redirects', function(){
                expect(function(){ kill9({statusBad:301}) }).to.throwException(/options.locationBad required/);
            });
            it('must ensure redirects if option location present', function(){
                expect(function(){ kill9({location:"other_site.kom"}) }).to.throwException(/options.location is only for redirect/);
            });
            it('must ensure redirects if option location present', function(){
                expect(function(){ kill9({locationBad:"other_site.kom"}) }).to.throwException(/options.locationBad is only for redirect/);
            });
            it('must fail if no master-pass is provided', function(){
                expect(function(){ kill9({}) }).to.throwException(/options.master-pass is required/);
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
                        "master-pass":'secret'
                    });
                };
            });
            it('should redirect killed', function(done){
                var reference={};
                var server;
                createRedirectServer(reference).then(function(server){ 
                    request(server)
                    .get(prefix+'/kill-9?pid=555')
                    .end(function(err, res){
                        if(err) { return done(err); }
                        var params = res.text.match(/name="params" value='({[^}]*})'/)[1];
                        send(res, server, createPostForm(params))
                        .expect('Location', 'other_site.kom/?killed=1')
                        .expect(300)
                        .end(function(err, res){
                              if (err) { return done(err); }
                              expect(reference.code).to.eql(999);
                              done();
                        });
                    });
                }).catch(done);;
            });
            it('should redirect bad kills', function(done){
                var reference={code:'untouched'};
                var server;
                createRedirectServer(reference).then(function(server){ 
                    request(server)
                    .get(prefix+'/kill-9?pid=777')
                    .expect('Location', 'other_site.kom/?killed=0')
                    .expect(303)
                    .end(function(err, res){
                        if (err) return done(err);
                        expect(reference.code).to.eql('untouched');
                        done();
                    });
                }).catch(done);
            });
        });
        describe('timeout situations', function(){
            var createTimeoutServer;
            before(function () {
                createTimeoutServer = function(reference){
                    kill9.defaults.exitCode=999;
                    return createServer({
                        process:{pid:888, exit:function(code){ reference.code = code; }},
                        "master-pass":'secret',
                        statusBad:403,
                        confirmTimeout:reference.confirmTimeout
                    });
                };
            });
            it('should not kill if timeout', function(done){
                var reference={code:'untouched', confirmTimeout:100};
                var server;
                createTimeoutServer(reference).then(function(server){ 
                    request(server)
                    .get(prefix+'/kill-9?pid=888')
                    .expect('Content-Type', 'text/html; charset=utf-8')
                    .end(function(err, res){
                        if(err) { return done(err); }
                        Promises.sleep(110).then(function(){
                            send(res, server, {params:'default', masterpass:'secret'})
                            .expect(403)
                            .end(function(err, res){
                                if (err) { return done(err); }
                                expect(killedExitCode).to.eql(15);
                                done();
                            });
                        }).catch(done);
                    });
                });
            });
        });
    }); 
    function createServer(opts) {
        return Promises.make(function(resolve, reject){
            try{
                var app = express();
                if(VERB==='post'){
                    app.use(bodyParser.urlencoded({extended:true})); 
                }
                if(prefix){
                    app.use(prefix, kill9(opts));
                }else{
                    app.use(kill9(opts));
                }
                var server = app.listen(INTERNAL_PORT++,function(){
                    resolve(server);
                });
            }catch(err){
                reject(err)
            }
        });
    }
}); });

var INTERNAL_PORT = 54925;
