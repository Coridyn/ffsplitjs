var _ = require('lodash');
var _util = require('util');
var Emitter = require('events').EventEmitter;
var Logme = require('logme').Logme;
var spawn = require('child_process').spawn;
var util = require('./util');

// Private data.
var _log = new Logme();
var ffDetectSilence = ['-af', 'silencedetect=noise=0.1', '-f', 'null', 'anullsink'];
// var ffDetectSilence = ['-af', 'silencedetect=noise=0.1', '-f', 'wav', '-'];

module.exports = Detector;
function Detector(options){
	this.options = options;
	
	// TODO: Default state to 'playing' (i.e. has sound). Emit a 'silenceEnd' event to start with in case
	// something is already coming through.
	// 
	// Or maybe raise an 'initialise' event?
	this.ffChild = null;
	
}
Detector.prototype = (function(){
	function DetectorProto(){
		this.start = function(){
			if (!this.ffChild){
				var args = this.options.audioSource.concat(ffDetectSilence);
				this.ffChild = startListening(args);
				
				this.ffChild.stderr.on('data', this._silenceDataHandler.bind(this));
				this.ffChild.on('close', this._closeHandler.bind(this));
			}
			
			// The stream that will supply the data.
			return this.ffChild.stdout;
		};
		
		this.stop = function(){
			this._cleanup();
		};
		
		this.getPipe = function(){
			var pipe;
			if (this.ffChild){
				pipe = this.ffChild.stdout;
			}
			return pipe
		};
		
		this._cleanup = function(){
			if (this.ffChild){
				stopListening(this.ffChild);
				this.ffChild.stderr.removeAllListeners('data');
				this.ffChild.removeAllListeners('close');
				this.ffChild = null;
			}
		};
		
		this._silenceDataHandler = function(data){
			// [silencedetect @ 028de900] silence_start: -0.494989
			// silence_start
			// silence_end
			
			// _log.debug('(DETECTOR) stderr', data);
			
			var content = data.toString();
			if (content.indexOf('silence_start') >= 0){
				_log.debug('(Detector) SILENCE_START');
				
				this.emit('silenceStart', this.ffChild.stdin);
			} else if (content.indexOf('silence_end') >= 0){
				_log.debug('(Detector) SILENCE_END');
				
				this.emit('silenceEnd', this.ffChild.stdin);
			} else if (content.indexOf('size') >= 0){
				_log.debug('(Detector)', content);
			}
		};
		
		this._closeHandler = function(code){
			_log.debug('(Detector) ffmpeg exited with code: ' + code);
			
			this.emit('close');
		};
	};
	DetectorProto.prototype = new Emitter();
	return new DetectorProto();
}());

Detector.setLog = function(newLog){
	_log = newLog;
}


function startListening(command){
	// console.log('Spawning: command=', command);
	var ffChild = spawn('ffmpeg', command, {
		cwd: process.cwd(),
		env: process.env
	});
	
	// ffChild.stdout.on('data', function(data){
	// 	// Handle the data from stdout.
	// 	_log.error('(Detector) stdout.data: ', data.length)
	// 	// _log.debug('(Detector) stdout: ' + data);
	// });
	
	// ffChild.stderr.on('data', function(data){
	// 	var content = data.toString();
	// 	if (content.indexOf('size') >= 0){
	// 		_log.info(content);
	// 	}
	// });
	
	// ffChild.on('close', function(code){
		
	// });
	
	return ffChild;
}


function stopListening(child){
	if (child){
		// Send: ctrl+c
		child.kill('SIGINT');
	} else {
		_log.debug('(Detector) No child process.');
	}
}
