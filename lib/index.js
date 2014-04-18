var _fs = require('fs');
var _path = require('path');
var _util = require('util');
var async = require('async');
var inquirer = require('inquirer');
var Logme = require('logme').Logme;
var mkdirp = require('mkdirp');
var printf = require('printf');
var spawn = require('child_process').spawn;

var AudioBuffer = require('./audioBuffer');
var Detector = require('./detector');
var Recorder = require('./recorder');
var util = require('./util');

var _log = new Logme();
Detector.setLog(new Logme({level: 'info'}));
Recorder.setLog(new Logme({level: 'info'}));

// Default device.
var deviceName = 'Microphone (2- USB Audio CODEC )';

// Detect silence and pipe to NULL stream.
// ffmpeg -f dshow -i audio="Microphone (2- USB Audio CODEC )" -af silencedetect=noise=0.1 -f null -

// Start streaming from the input device to STDOUT.
// ffmpeg -f dshow -i audio="Microphone (2- USB Audio CODEC )" -f wav -

// Encode mp3 from STDIN.
// ffmpeg -i - -acodec libmp3lame -ac 2 -b:a 128k -ar 44100 test.mp3
var ffHome = process.env.FFMPEG_HOME + '\\bin\\';
var ffListDevices = ['-list_devices', 'true', '-f', 'dshow', '-i', 'dummy'];

/**
 * TODO: Information to get from the configuration file.
 * 
 *  - default output directory.
 *  - default device.
 *  - recording quality (default to 128k)
 *  - 
 */

var config = {
	// audioSource: util.getFileSource('data/test2.wav'),
	// recordSource: util.getStdInSource(),
	audioSource: util.getDShowSource(deviceName),
	recordSource: util.getDShowSource(deviceName),
	basePath: util.getNextDir('files'),
	filename: 'track'
};

// Make sure the directory exists.
mkdirp.sync(config.basePath);

/**
 * Start listening on the device.
 * 
 * Detect silence
 * 
 */
var detector = new Detector({
	audioSource: config.audioSource
});

var recorder = new Recorder({
	audioSource: config.recordSource,
	basePath: config.basePath,
	filename: config.filename
});

// var audioBuffer = new AudioBuffer(detector.start());
// detector.on('silenceStart', function(){
// 	// _log.debug('SILENCE_START');
	
// 	// Stop recording.
// 	audioBuffer.unpipe();
// 	recorder.stop();
// 	audioBuffer.resume();
// });

// detector.on('silenceEnd', function(){
// 	// _log.debug('SILENCE_END');
	
// 	// Start recording.
// 	audioBuffer.pause();
// 	audioBuffer.pipe(recorder.start());
	
// 	// TODO: Handle 'end' event.
// 	// audioBuffer.resume();
// });

var silenceCount = 0;
detector.on('silenceStart', function(){
	// Check the current state.
	if (silenceCount == 0){
		_log.info('\n>> Ready to record...');
	}
	
	// Stop recording.
	recorder.stop();
	
	silenceCount++;
});

detector.on('silenceEnd', function(){
	// Start recording.
	recorder.start();
});

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
				_log.info('>> Waiting for silence.');
				detector.start();
				
				// detector.getPipe().resume();
				
				break;
			
			case 'q':
				// Terminate the child.
				// Kill all child processes.
				detector.stop();
				recorder.stop();		// Is this needed with the dectector 'end' event?
				
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
