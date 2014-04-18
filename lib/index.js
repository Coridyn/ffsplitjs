var _util = require('util');
var _path = require('path');
var spawn = require('child_process').spawn;
var async = require('async');
var inquirer = require('inquirer');
var Detector = require('./detector');
var Recorder = require('./recorder');

// Detect silence and pipe to NULL stream.
// ffmpeg -f dshow -i audio="Microphone (2- USB Audio CODEC )" -af silencedetect=noise=0.1 -f null -

// Start streaming from the input device to STDOUT.
// ffmpeg -f dshow -i audio="Microphone (2- USB Audio CODEC )" -f wav -

// Encode mp3 from STDIN.
// ffmpeg -i - -acodec libmp3lame -ac 2 -b:a 128k -ar 44100 test.mp3
var ffHome = process.env.FFMPEG_HOME + '\\bin\\';

var ffListDevices = ['-list_devices', 'true', '-f', 'dshow', '-i', 'dummy'];

/**
 * Start listening on the device.
 * 
 * Detect silence
 * 
 */
var detector = new Detector();

var basePath = 'temp';
var filename = 'temp';
var recorder = new Recorder(basePath, filename, detector);

var ui = new inquirer.ui.BottomBar();
var prompt = null;

var isDone = false;
async.doWhilst(function(next){
	prompt = inquirer.prompt([{
		type: 'expand',
		name: 'command',
		message: 'Enter command:',
		choices: [
			{
				key: 's',
				name: 'Start',
				value: 's'
			},{
				key: 'q',
				name: 'Quit',
				value: 'q'
			}
		]
	}], function(result){
		switch (result.command){
			case 's':
				// Start the silence detection.
				detector.start();
				break;
			
			case 'q':
				// Terminate the child.
				// Kill all child processes.
				detector.stop();
				// recorder.stop();		// Is this needed with the dectector 'end' event?
				
				isDone = true;
				break;
		}
		
		setImmediate(next);
	});
}, function(){
	return isDone == false;
}, function(){
	// Do any final processing?
	// List files that have been written?
	
});

function render(content){
	// Print the 'bottom' bar at the top.
	ui.updateBottomBar(content);
	
	// Re-render the question.
	if (prompt && prompt.currentPrompt){
		prompt.currentPrompt.render();
	}
}


// This is how we stop the file writter.
//stdin.end();


