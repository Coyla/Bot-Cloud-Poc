var restify = require('restify');
var watson = require('watson-developer-cloud');
var aimlHigh = require('aiml-high');
var config = require('./config.json');

var interpreter = new aimlHigh({name : 'acrobot'}, 'goodbye');
interpreter.loadFiles(['./aiml/acrobot.aiml']);

//setup server
let server = restify.createServer();
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

//setup watson service
let conversation = watson.conversation({
    username : config.watson.username,
    password : config.watson.password,
    url : config.watson.url,
    version : config.watson.version,
    version_date : config.watson.version_date
});

const debug = (message) => console.log('[debug]', message);
const sendMessageWatson = (message) => new Promise((resolve, reject) => {
    conversation.message({
        input : {"text" : message},
        workspace_id : config.watson.workspace
    }, (err, response) => {
        if (err) {
            reject(err);
        } else {
            resolve(response);
        }
    });
});

const fillTemplate = (template, data) => template.replace('[definition]', data);
const isIntentsEmpty = (intents) => {
    if(intents.length > 0){
        return false;
    }
    return true;
};
const isEntitiesEmpty = (entities) => {
    if(entities.length > 0 ){
        return false;
    }
    return true;
}
const getBotResponse = (response) => {
    debug(response);
    let botResponse = {
        message : ''
    };
    let defaultResponse = response.output.text[0];
    //not found message default
    if(isIntentsEmpty(response.intents)){
        if(isEntitiesEmpty(response.entities)){
            botResponse.message = defaultResponse;
        }
        else{
            if(isDefinitionTypeEntity(response.entities[0].entity)){
                interpreter.findAnswer(response.entities[0].value, (answer) => {
                    botResponse.message = fillTemplate(response.output.text[0],answer);
                });
            }
            else{
                botResponse.message = defaultResponse;
            }
        }
    }
    else{
        if(isDefinitionTypeDialog(response.intents[0].intent) && isDialogCompleted(response)){
            interpreter.findAnswer(response.entities[0].value, (answer) => {
                botResponse.message = fillTemplate(response.output.text[0],answer);
            });
        }
        else{
            botResponse. message = defaultResponse;
        }
    }
    return botResponse;
};
const isDialogCompleted = (response) => {
    return response.context.system.branch_exited_reason === "completed";
};

const isDefinitionTypeDialog = (intent) => {
    debug("intent : " + intent);
    if(intent === 'definition'){
        return true;
    }
    return false;
};
const isDefinitionTypeEntity = (entity) => {
    if(entity === 'acronym'){
        return true;
    }
    return false;
};

const desplayError = (e) => console.error(e);


server.post('/message',function(req,res,next){
    let clientMessage = req.body.message;
    sendMessageWatson(clientMessage)
      .then((response) => {
        let botResponse = getBotResponse(response);
        res.send(botResponse);
        return next();
      })
      .catch((error) => desplayError(error));
});

server.get('/message',function(req,res,next){
  let response = {
    'name' : 'bot cloud',
    'response' : 'poc response'
  }
  res.send(response);
  return next();

});
