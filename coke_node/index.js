var express = require('express');
var bodyParser = require("body-parser");
var app = express();

//Calling google Api's

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var calendar = google.calendar('v3');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
//var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';
var TOKEN_PATH ='calendar-nodejs-quickstart.json';

//End of Google Calender Usage

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.get('/', function(request, response) {
  response.render('pages/index');
});

//cricket function
app.post('/cricket', function (req, res) {
  var http = require("http");
  //last game
  var options1 = {
    "method": "GET",
    "hostname": "s3.amazonaws.com",
    "port": null,
    "path": "/cricket-api-response-staging/api_response_staging.json",
    "headers": {
    "cache-control": "no-cache"
    }
  };

  //news
  var options2 = {
    "method": "GET",
    "hostname": "api.cricket.com.au",
    "port": null,
    "path": "/news?limit=1",
    "headers": {
      "cache-control": "no-cache"
    }
  };

  //next game
  var options3 = {
    "method": "GET",
    "hostname": "s3.amazonaws.com",
    "port": null,
    "path": "/cricket-api-response-staging/api_response_staging.json",
    "headers": {
    "cache-control": "no-cache"
    }
  };


  var action=req.body.result.action;
  var option;
  console.log("action is " + action);


  switch (action){
    case "news":
      option = options2
      break;
    case "score":
      option = options1
      break;
    case "next":
      option = options3
      break;
    case "audio":
      option = options3
      // playAudio();
      // option = option4
      break;
    case "event":
    console.log("Calling calender logic event");
    getOAuthForCalender();
    break;  
    default:
      option = options3
      break;
  }

  var internalreq = http.request(option, function (internalres) {
    var chunks = [];

    internalres.on("data", function (chunk) {
      chunks.push(chunk);
    });

    internalres.on("end", function () {

      var body = Buffer.concat(chunks);  
      var bodyObj = JSON.parse(body.toString());
      res.setHeader('Content-Type', 'application/json');
      var resultText;
    
      if(action === "audio"){
      var msg = `
        <speak>
          No worries. Let me check for you
          <audio src="https://stark-fortress-30078.herokuapp.com/stylesheets/test2.mp3">Cat playing with string</audio>
        </speak>
        `;

        var reply = {
          speech: msg,
          data:{
            google:{
              "expect_user_response": true,
              "is_ssml": true
            }
          }
        };

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify( reply));
      }else{
        if(action==="news"){
          resultText = getNews(bodyObj);
          res.send(JSON.stringify({ 'speech': resultText, 'displayText': resultText}));
        }else  if(action==="score"){
          resultText = getScore(bodyObj);
          res.send(JSON.stringify({ 'speech': resultText, 'displayText': resultText}));
        }else if (action === "next"){
          resultText = getNextMatch(bodyObj);
          var speak = '<speak>'+ resultText +'<break time="2s"> Would you like to set a reminder?</speak>';
          res.send(JSON.stringify({ 'speech': speak, 'displayText': resultText}));
        }
        
        
        
        console.log(JSON.stringify({ 'speech': resultText, 'displayText': resultText}));
      }

      });
    });

    internalreq.end();
})

//Get news function
function getNews(bodyObj){
  var result = bodyObj.newsArticles[0].summaryText;
  return result;
}

//Get Score function
function getScore(bodyObj){
  var match = bodyObj.matchList.matches[0];
  var result = match.homeTeam.name + " versus" + " " + match.awayTeam.name + " at " + match.venue.name + " as part of " + match.series.shortName  + ",  "+ match.matchSummaryText;
  return result; 
}

//Get next Match
function getNextMatch(bodyObj){
  var listMatch = bodyObj.matchList.matches;
  var result;
  
  for (var key in listMatch) {
    if (listMatch.hasOwnProperty(key)) {
    
      if(listMatch[key].status === "UPCOMING")
      var singleEvent = listMatch[key];
      console.log(singleEvent);
      result =  "The next match is " + listMatch[key].homeTeam.name + " versus" + " " + listMatch[key].awayTeam.name +". The match starts on " +  listMatch[key].localStartDate + " at "+ listMatch[key].localStartTime+ ". ";
      return result;
    }
  }
}


// function playAudio(){
  
// }

function getOAuthForCalender(){
  
  //Start of Google OAuth for Calender events
  // Load client secrets from a local file.
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), addEvents);
  });
}

function addEvents(auth){
  console.log("Calling Calender addEvents ");
var event = {
  'summary': 'Cricket Australia Ashes First Test',
  'location': '800 Docklands, Melborune, VIC 3000',
  'description': 'A cricket rivalry between Australia and England',
  'start': {
    'dateTime': '2017-09-30T09:00:00-07:00',
    'timeZone': 'Australia/Melbourne',
  },
  'end': {
    'dateTime': '2017-09-30T17:00:00-07:00',
    'timeZone': 'Australia/Melbourne',
  },
  
  'reminders': {
    'useDefault': false,
    'overrides': [
      {'method': 'email', 'minutes': 24 * 60},
      {'method': 'popup', 'minutes': 10},
    ],
  },
};

calendar.events.insert({
  auth: auth,
  calendarId: 'primary',
  resource: event,
}, function(err, event) {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
  console.log('Event created: %s', event.htmlLink);
  //Trying print list of events
listEvents(auth);
});



}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
//Example for printing the list of events from the calenders
function listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
}

//End of google calender functions


//end of cricket function
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
