// Create the configuration
var config = {
	channels: ["#w3cig_breakout"],
	server: "irc.freenode.net",
	botName: "Mnemosyne"
};

// Get the lib
var irc = require("irc");

// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels,
    realName: 'nodeJS IRC client',
    autoRejoin: true,
    autoConnect: true,
    floodProtection: false
});

//create arrays and flags
ATTENDEES = [];
ACTION_POINTS = [];
MEETINGOPEN = false;
TAKEMINUTES = false;

// Listen for any message, say to him/her in the room
bot.addListener("message", function(from, to, text, message) {

	//file parameters
	var fileName = "";
	var fs = require('fs');
	var mnemosyneCommand = false;

	//split string into array
	var commandArray = text.split(/:*\s/);
	//match on command
	if(commandArray[0].match(/mnemosyne/gi)){

		mnemosyneCommand = true;

		if(commandArray[1]){
			switch(commandArray[1]){
				case "om":
				case "openmeeting":			
					if(commandArray[2]){
						commandArray.splice(0,2);
						filename = openMeeting(bot, to, fs, commandArray);
					}
					else{
						bot.say(to, "I cannot open a meeting without a meeting name");
					}
					break;
				case "oom":
				case "openoldmeeting":	
					break;
				case "cm":
				case "closemeeting":
					if(MEETINGOPEN){
						closeMeeting(bot, to, fs, filename);
					}
					else{
						bot.say(to, "Cannot close a meeting that is not open! Open meeting with 'om'");
					}

					break;
				case "sa":
				case "setattendees":
					if(commandArray[2] && MEETINGOPEN){
						commandArray.splice(0,2);
						ATTENDEES = ATTENDEES.concat(setAttendees(bot, to, fs, filename, commandArray));
					}
					else{
						bot.say(to, "You are either missing names or the meeting is not open. Open a meeting with 'om' or add names as a parameter to 'sa'");
					}

					break;
				case "ga":
				case "getattendees":
					if(MEETINGOPEN){
						getAttendees(bot, to);
					}
					else{
						bot.say(to, "The meeting isn't open, so no attendees will have been recorded. Open meeting with 'om'");
					}
					break;
				case "tm":
				case "takeminutes":
					if(MEETINGOPEN){
						TAKEMINUTES = true;
					}
					else{
						bot.say(to, "You need to open the meeting before recording minutes. Open meeting with 'om'");
					}
					break;
				case "ap":
				case "actionpoint":
					if(commandArray[2] && MEETINGOPEN){
						ACTION_POINTS = ACTION_POINTS.concat(setActionPoint(bot, from, to, fs, filename, commandArray));
					}
					else{
						bot.say(to, "You are either missing a parameter or the meeting is not open. Open meeting with 'om'");
					}
					break;
				case "gap":
				case "getactionpoint":
					if(MEETINGOPEN){
						getActionPoint(bot, to);
					}
					else{
						bot.say(to, "The meeting isn't open, so no action points will have been recorded. Open meeting with 'om'");
					}
					break;
				case "q?":
				case "queue?":
					console.log("queue");
					break;
				case "q-":
				case "queue-":
					console.log("queue");
					break;
				case "q+":
				case "queue+":
					console.log("queue");
					break;
				case "q!":
				case "queue!":
					console.log("queue");
					break;
				case "origin?":
					bot.say(to, "Thanks for asking " + from +  "! Mnemosyne, the source of the word mnemonic, was the personification of memory in Greek mythology. The titaness was the daughter of Gaia and Uranus and the mother of the nine Muses by Zeus. You can read more at http://en.wikipedia.org/wiki/Mnemosyne");
					break;
				case "man":
					manual();
					break;
				default:
					bot.say(to, "I am sorry, I didn't understand '" + commandArray[1] + "'");
			}
		}
		else{
			bot.say(to, "did you want something?");
		}	
	}

	//take minutes if meeting is open and we have correct details
	if(TAKEMINUTES && fs && filename && !mnemosyneCommand){
		recordMinutes(bot, from, text, fs, filename);
	}

});

//open meeting
function openMeeting(bot, to, fs, commandArray){
	var meetingName = commandArray.reduce(function(prev, cur){
		return prev + " " + cur;
	});

	meetingName = meetingName.toUpperCase();

	var filename = getDateTime() + "_Meeting_" + meetingName + ".txt";
	fs.open(filename, "a+", function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	    	MEETINGOPEN = true;
			TAKEMINUTES = true;
	        bot.say(to, "Meeting '" + meetingName + "' has started, minutes are being taken");
	    }
	});

	var meetingMetaData = "Meeting Name: " + meetingName + "\nTime: " + getDateTime() + "\n\n";
	fs.appendFile(filename, meetingMetaData, function (err) {
		if(err) {
	        console.log(err);
	    }
	});
	return filename; 
}

//close meeting
function closeMeeting(bot, to, fs, filename){
	MEETINGOPEN = false;
	TAKEMINUTES = false;

	var closeMeetingText = "\nATTENDEES:\n";

	//list all attendees
	closeMeetingText = closeMeetingText + ATTENDEES.reduce(function(prev, cur){
		return prev + "\n" + cur.trim();
	});

	closeMeetingText = closeMeetingText + "\n\nACTION POINTS:\n";

	//list all actions
	closeMeetingText = closeMeetingText + ACTION_POINTS.reduce(function(prev, cur){
		return prev + "\n" + cur;
	});

	closeMeetingText = closeMeetingText + "\n\nMeeting has closed.\n\n";

	bot.say(to, "Meeting has closed. You're still here? It's over! Go home!");
	
	fs.appendFile(filename, closeMeetingText, function (err) {
		if(err) {
	        console.log(err);
	    }
	});
}

// record attendees
function setAttendees(bot, to, fs, filename, commandArray){
	var names = commandArray.reduce(function(prev, cur){
		return prev + " " + cur;
	});

	//add to file with timestamp
	var newAttendees = "\nATTENDEES ADDED: " + getDateTime() + ":\n" + names + "\n\n";
	fs.appendFile(filename, newAttendees, function (err) {
		if(err) {
	        console.log(err);
	    }
	});
	var names = names.split(/,/);
	return names;
}

//get attendees
function getAttendees(bot, to){
	var names = ATTENDEES.reduce(function(prev, cur){
		return prev + ", " + cur;
	});
	bot.say(to, "ATTENDEES: " + names);
}

//record action point
function setActionPoint(bot, from, to, fs, filename, commandArray){
	commandArray.splice(0,2);
	var action = commandArray.reduce(function(prev, cur){
		return prev + " " + cur;
	});

	action = "ACTION POINT: " + action;

	fs.appendFile(filename, "\n" + action + "\n\n", function (err) {
		if(err) {
	        console.log(err);
	    }
	    else{
	    	bot.say(to, "Recorded action point.");
	    }
	});

	return action;
}

//get action points
function getActionPoint(bot, to){
	var actions = ACTION_POINTS.reduce(function(prev, cur){
		return prev + ", " + cur;
	});
	bot.say(to, actions);
}

//take minutes
function recordMinutes(bot, from, text, fs, filename){
	var someoneSaid = from + ": " + text + "\n";

	fs.appendFile(filename, someoneSaid, function (err) {
		if(err) {
	        console.log(err);
	    }
	});
}

//queue


//links

//manual
function manual(command){


}


function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + "-" + hour + "-" + min;

}