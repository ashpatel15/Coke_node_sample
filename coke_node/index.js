"use strict";

var firebase = require('firebase');
const express = require("express");
const bodyParser = require("body-parser");
var HashMap = require('hashmap');

const restService = express();
var map = new HashMap();
map.set("Coke", 5.0);
map.set("Sprite", 6.0);
map.set("Powerade", 10.0);
map.set("fanta", 3.0);
map.set("coke Zero", 5.0);


restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);

restService.use(bodyParser.json());


//init Firebase;
var config = {
   
    apiKey: "AIzaSyAq2g6BV23YmGeqatI_WzcgaQjSU-UIBHY",
    authDomain: "coke-1caf8.firebaseapp.com",
    databaseURL: "https://coke-1caf8.firebaseio.com/",
    projectId: "coke-1caf8",
    storageBucket: "coke-1caf8.appspot.com",
    messagingSenderId: "173167574179"


  };
firebase.initializeApp(config);
var database = firebase.database();


restService.post("/cokebackend", function(req, res) {


  //get info from database once
  // return firebase.database().ref('/drink').once('value').then(function(snapshot) {
  // var drink = snapshot.val();
  // console.log(" the drink is = " + drink);
  // });


  if(typeof req !== 'undefined' ||req.body.result.actionIncomplete != null){
  
    var actionIncomplete = req.body.result.actionIncomplete;

    var intentName = req.body.result.metadata.intentName;

    if(actionIncomplete == false){

      switch(intentName){
        case "Buy_coke":
          console.log(" ");
          console.log(req.body.result);
          console.log(" ");
          console.log("price = " + map.get(req.body.result.parameters.Drinks));

          addItems(req.body.result.parameters.Drinks, req.body.result.parameters.number);
    
        break;



        case "clear_list":
          console.log("in clear list ");

          console.log(" ");
          console.log(req.body.result);
          console.log(" ");
          clearItems();
        break;

      }
     

     var speech = req.body.result.fulfillment.speech;
      
      return res.json({
        speech: speech,
        textToSpeech:speech,
        displayText: speech,
        source: "coke_node"
      });
      
    }
  }else{
    return res.json({
        speech: " test speech",
        displayText: " test speech",
        source: "coke_node"
      });
  }
});
    
  
function addItems(liquid, num){
  var rootRef = firebase.database().ref("Orders");
  

  var newRef = rootRef.push();
  
  newRef.set({
      drink: liquid,
      number: num,
      price: map.get(liquid)
    });
}

function clearItems(){
  var rootRef = firebase.database().ref("Orders").remove();
  
}

restService.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening");
});




