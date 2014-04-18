var _ = require('lodash');
var _path = require('path');
var glob = require('glob');
var printf = require('printf');

module.exports = {
	getDShowSource: function(deviceName){
		return ['-f', 'dshow', '-i', 'audio='+deviceName];
	},
	
	getStdInSource: function(){
		return ['-i', '-'];
	},
	
	// Make sure the source is returned as an array?
	getFileSource: function(filename){
		return ['-i', filename];
	},
	
	getNextDir: function(dir){
		var dirCount = 0;
		
		// Parse the digits off the last directory name.
		var result = glob.sync(_path.join('data', '*'+dir));
		if (result.length){
			dirCount = parseInt(_.last(result).replace(/\D/g, ''));
			dirCount = isFinite(dirCount) ? dirCount + 1 : 0;
		}
		
		var newPath = _path.join('data', printf('%02d-%s', dirCount, dir));
		return newPath;
	}
}