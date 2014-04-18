module.exports = AudioBuffer;

function AudioBuffer(inStream){
	this.inStream = inStream;
	this.outStream = null;
}

AudioBuffer.prototype = {
	resume: function(){
		if (!this.inStream._readableState.ended){
			this.inStream.resume();
		}
	},
	
	pause: function(){
		this.inStream.pause();
	},
	
	pipe: function(newOutput){
		if (this.outStream){
			this.unpipe();
		}
		
		// Link the output to the input.
		this.outStream = newOutput;
		this.inStream.on('data', this._dataHandler.bind(this));
	},
	
	unpipe: function(){
		if (this.outStream){
			this.inStream.removeAllListeners('data');
			this.outStream = null;
		}
	},
	
	_dataHandler: function(data){
		this.outStream.write(data);
	}
}
