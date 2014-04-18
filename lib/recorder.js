var spawn = require('child_process').spawn;
var _path = require('path');

// TODO: Append the filename onto the end of this array.
var deviceName = 'Microphone (2- USB Audio CODEC )';
var FORMAT = '.mp3';
var ffMp3 = ['-f', 'dshow', '-i', 'audio='+deviceName+'', '-acodec', 'libmp3lame', '-ac', '2', '-b:a', '128k', '-ar', '44100'];


module.exports = function Recorder(basePath, baseFilename, detector){
	this.ffChild = null;
	this.basePath = basePath;
	this.baseFilename = baseFilename;
	this.detector = detector;
	
	// Format number to two digits?
	this._filecount = 0;
}
Recorder.prototype = {
	start: function(){
		this.detector.on('silenceStart', this._silenceStartHandler.bind(this));
		this.detector.on('silenceEnd', this._silenceEndHandler.bind(this));
		this.detector.on('end', this.end.bind(this));
	},
	end: function(){
		this._silenceEndHandler();
		stopListening(this.ffChild);
	},
	getNextFile: function(){
		// TODO: Check for existence of files?
		var newFile = _util.format('%d-%s%s', this._filecount++, this.baseFilename, FORMAT);
		return path.join(basePath, newFile);
	},
	
	_silenceStartHandler: function(){
		// NOTE: In the initial state we want to wait for silence before recording?
		
		// TODO: Have a test mode where we display levels?
		
		// end recording.
		stopListening(this.ffChild);
		this.ffChild = null;
	},
	_silenceEndHandler: function(){
		// start recording.
		if (!this.ffChild){
			var filename = this.getNextFile();
			this.ffChild = startListening(filename, ffMp3);
		}
	}
};


function startListening(filename, command){
	console.log('>> Recording to: ', filename);
	
	var ffChild = spawn('ffmpeg', command.concat(filename), {
		cwd: process.cwd(),
		env: process.env
	});
	
	ffChild.stdout.on('data', function(data){
		ui.log.writeLog('(Recorder) stdout: ' + data);
	});
	
	ffChild.stderr.on('data', function(data){
		// ui.log.write('stderr: ' + data);
		// var content = data.toString();
		// if (content.indexOf('size') >= 0){
		// 	render(content);
		// }
	});
	
	ffChild.on('close', function(code){
		ui.log.write('ffmpeg exited with code: ' + code);
	});
	
	
	return ffChild;
}


function stopListening(child){
	if (child){
		// child.stderr.unpipe(ui.log);
		child.kill('SIGINT');	// ctrl+c
	} else {
		ui.log.write('No child process.');
	}
}