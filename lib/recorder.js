var _path = require('path');
var Logme = require('logme').Logme;
var printf = require('printf');
var spawn = require('child_process').spawn;

// TODO: Append the filename onto the end of this array.
var FORMAT = '.mp3';
var ffMp3 = ['-acodec', 'libmp3lame', '-ac', '2', '-b:a', '128k', '-ar', '44100'];

var _log = new Logme();

module.exports = Recorder;
function Recorder(options){
	this.options = options;
	
	this.ffChild = null;
	this.basePath = options.basePath;
	this.baseFilename = options.filename;
	
	// Format number to two digits?
	this._filecount = 0;
	this.currentFile = null;
}
Recorder.prototype = {
	start: function(){
		if (!this.ffChild){
			var filename = this.getNextFile();
			this.currentFile = filename;
			_log.info('>> Recording to: ', filename);
			
			var args = this.options.audioSource.concat(ffMp3, filename);
			this.ffChild = startListening(args);
		}
		
		// Return the stream that will receive the audio data.
		return this.ffChild.stdin;
		
		// this.detector.on('silenceStart', this._silenceStartHandler.bind(this));
		// this.detector.on('silenceEnd', this._silenceEndHandler.bind(this));
		// this.detector.on('end', this.stop.bind(this));
	},
	stop: function(){
		if (this.ffChild){
			_log.info('>> Finished recording: ', this.currentFile);
			
			stopListening(this.ffChild);
			this.ffChild = null;
			this.currentFile = null;
		}
	},
	getNextFile: function(){
		// TODO: Check for existence of files?
		var newFile = printf('%02d-%s%s', this._filecount++, this.baseFilename, FORMAT);
		return _path.join(this.basePath, newFile);
	},
	
	// _silenceStartHandler: function(pipe){
	// 	_log.info('>> Silence start');
		
	// 	// TODO: Release the previous pipe.
		
		
	// 	// NOTE: In the initial state we want to wait for silence before recording?
		
	// 	// TODO: Have a test mode where we display levels?
		
	// 	// end recording.
	// 	// stopListening(this.ffChild);
	// 	// this.ffChild = null;
	// },
	// _silenceEndHandler: function(pipe){
	// 	_log.info('>> Silence end');
		
	// 	// start recording.
	// 	if (!this.ffChild){
	// 		var filename = this.getNextFile();
	// 		_log.info('>> Recording to: ', filename);
			
	// 		var args = this.options.audioSource.concat(ffMp3, filename);
	// 		this.ffChild = startListening(args);
	// 	}
	// }
};

Recorder.setLog = function(newLog){
	_log = newLog;
}


function startListening(command){
	var ffChild = spawn('ffmpeg', command, {
		cwd: process.cwd(),
		env: process.env
	});
	
	ffChild.stdout.on('data', function(data){
		_log.info('(Recorder)', data);
	});
	
	ffChild.stderr.on('data', function(data){
		_log.debug('(Recorder)', data);
	});
	
	ffChild.on('close', function(code){
		// ui.log.write('ffmpeg exited with code: ' + code);
		_log.debug('(Recorder) ffmpeg exited with code: ' + code);
	});
	
	
	return ffChild;
}


function stopListening(child){
	if (child){
		child.kill('SIGINT');	// ctrl+c
	} else {
		_log.debug('(Recorder) No child process.');
	}
}
