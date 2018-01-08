var restify = require('restify');
var watson = require('watson-developer-cloud');
var aimlHigh = require('aiml-high');
var config = require('./config.json');

//setup aiml
let interpreter = new aimlHigh({name : 'acrobot'}, 'goodbye');
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

//session
let sessions = [
    {
        idSessionSkype : '123skype',
        senderDisplayName : 'Juan',
        idConversationWatson : '123watson'
    },
    {
        idSessionSkype : '1234skype',
        senderDisplayName : 'Coyla',
        idConversationWatson : '1234watson'
    }
];

const getSession = sessionId => {
    let filteredSessions = sessions.filter(session => session.idSessionSkype ===  sessionId);
    if(filteredSessions.length > 0){
        return filteredSessions[0];
    }
    return undefined;
};

const isUserExist = sessionId => getSession(sessionId) !== undefined;



const debug = (message) => console.log('[debug]', message);

const sendMessageWatson = (message) => {
    return new Promise((resolve, reject) => {
        conversation.message({
            input: {"text": message},
            workspace_id: config.watson.workspace
        }, (err, response) => err ? reject(err) : resolve(response));
    });
};

const fillTemplate = (template, data) => template.replace('[definition]', data);

const isIntentsEmpty = (intents) => {
    if(intents.length > 0){
        debug("isIntentsEmpty : false");
        return false;
    }
    return true;
};
const isEntitiesEmpty = (entities) => {
    if(entities.length > 0 ){
        debug("isEntitiesEmpty : false");
        return false;
    }
    return true;
};

const isMessageFounded = message => {
    if(isIntentsEmpty(message.intents) && isEntitiesEmpty(message.entities)){
        debug("isMessageFounded : false");
        return false;
    }
    return true;
};

const getBotResponse = response => {
    debug(response);
    let botResponse = {
        message : ''
    };
    let defaultResponse = response.output.text[0];
    if(isDialogCompleted(response) && isDefinitionTypeDialog(response.intents,
            response.entities) && isMessageFounded(response)){
        interpreter.findAnswer(response.entities[0].value, (answer) => {
            botResponse.message = fillTemplate(response.output.text[0],answer);
        });
     }
    else{
         botResponse.message = defaultResponse;
    }
    return botResponse;
};
const isDialogCompleted = response => {
    return response.context.system.branch_exited_reason === "completed";
};

const isEntityEqualsTo = (entities,entityName) =>{
    return entities.length > 0 && entities[0].entity === entityName;

};

const isIntentEqualsTo = (intents,intentName) => {
    return intents.length > 0 && intents[0].intent === intentName;
};


const isDefinitionTypeDialog = (intents,entities) => {
    debug("intent : " + intents);
    return !!(isEntityEqualsTo(entities, 'acronym') ||
        isIntentEqualsTo(intents, 'definition'));
};

const displayError = (e) => console.error(e);
const isConversationExist = session=> session.hasOwnProperty('idConversationWatson');

const handleWatsionConversation = (idConversationSkype, response) =>{
    let session = getSession(idConversationSkype);
    if(!isConversationExist(session)){
        session.idConversationWatson = response.context.conversation_id;
    }
};
//handle routes
server.post('/message',function(req,res,next){
    let clientMessage = req.body.message;
    let conversationId = req.body.conversationId;
    let senderDisplayName = req.body.senderDisplayName;
    if(!isUserExist(conversationId)){
        //ajoouter l'id dans la liste de sessions
        sessions.push({
            idSessionSkype : conversationId,
            senderDisplayName : '123watson'
        });
    }

    sendMessageWatson(clientMessage)
    .then(response => {
        let botResponse = getBotResponse(response);
        handleWatsionConversation(botResponse);
        //send message avec id
        res.send(botResponse);
        return next();
      })
    .catch((error) => displayError(error));
});

server.get('/message',function(req,res,next){
  let response = {
    'name' : 'bot cloud',
    'response' : 'poc response'
  };
  res.send(response);
  return next();
});

server.post('/training',function(req,res,next){
    let trainingData = req.body;
    debug(trainingData);
    let params = {
        workspace_id : config.watson.workspace,
        entity: 'acronym',
        value : ''
    };
    for(let i = 0; i < trainingData.length; i++){
        params.value = trainingData[i].acronym;
        conversation.createValue(params, (err,response) => {
            if(err) {
                displayError(err);
            } else {
                debug(JSON.stringify(response, null, 2))
            }
        });
    }
    res.send('ok');
    return next();
});

server.post('/aiml', (req,res,next) => {
    let trainingData = req.body;
    for(let i = 0; i < trainingData.length; i++){
        params.value = trainingData[i].acronym;
        conversation.createValue(params, (err,response) => {
            if(err) {
                displayError(err);
            } else {
                debug(JSON.stringify(response, null, 2))
            }
        });
    }
    res.send('ok');
    return next();

});