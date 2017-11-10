var restify = require('restify');
var watson = require("watson-developer-cloud");

//watson init
var conversation = new watson.ConversationV1({
  username: '792501a3-8520-43cc-81c8-faeac9d59501',
  password: 'YePK3AQBWnVd',
  version_date: '2017-05-26'
});


//server init
var server = restify.createServer();
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});



server.post('/message',function(req,res,next){
  var response = {
    'name' : 'bot cloud',
    'response' : 'poc response'
  }

  res.send(req.body);
  return next();

});


/**
//watson dialogs
var watson = require("watson-developer-cloud");

var conversation = new watson.ConversationV1({
  username: '792501a3-8520-43cc-81c8-faeac9d59501',
  password: 'YePK3AQBWnVd',
  version_date: '2017-05-26'
});


conversation.message({
  workspace_id: 'e6096793-15b5-43db-b7ef-1d69b4fb6158',
  input: {'text': 'Hello'}
},  function(err, response) {
  if (err){
    console.log('error:', err);
    console.log("test juan error");
}
  else{
    console.log(JSON.stringify(response, null, 2));
	console.log("test juan ");
}
});
*/