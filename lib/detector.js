var emitter = require('events').EventEmitter;
var _util = require('util');

var deviceName = 'Microphone (2- USB Audio CODEC )';
var ffDetectSilence = ['-f', 'dshow', '-i', 'audio='+deviceName+'', '-af', 'silencedetect=noise=0.1', '-f', 'null', 'anullsink'];


module.exports = function Detector(){
	// TODO: Default state to 'playing' (i.e. has sound). Emit a 'silenceEnd' event to start with in case
	// something is already coming through.
	// 
	// Or maybe raise an 'initialise' event?
	this.ffChild = null;
}
Detector.prototype = {
	start: function(){
		if (!this.ffChild){
			this.ffChild = startListening(ffDetectSilence);
			this.ffChild.stderr.on('data', this._silenceDataHandler);
		}
	},
	stop: function(){
		this.emit('end');
		this._cleanup();
	},
	
	_cleanup: function(){
		if (this.ffChild){
			stopListening(this.ffChild);
			this.ffChild.stderr.removeListener('data', this._silenceDataHandler);
			this.ffChild = null;
		}
	},
	
	_silenceDataHandler: function(data){
		// [silencedetect @ 028de900] silence_start: -0.494989
		// silence_start
		// silence_end
		
		var content = data.toString();
		if (content.indexOf('silence_start') >= 0){
			this.emit('silenceStart');
		} else if (content.indexOf('silence_start') >= 0){
			this.emit('silenceEnd');
		}
	}
};
_util.inherits(Detector, emitter);


function startListening(command){
	// console.log('Spawning: command=', command);
	var ffChild = spawn('ffmpeg', command, {
		cwd: process.cwd(),
		env: process.env
	});
	
	ffChild.stdout.on('data', function(data){
		ui.log.writeLog('(Detector) stdout: ' + data);
	});
	
	// ffChild.stderr.pipe(ui.log);
	ffChild.stderr.on('data', function(data){
		// ui.log.write('stderr: ' + data);
		var content = data.toString();
		if (content.indexOf('size') >= 0){
			render(content);
		}
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