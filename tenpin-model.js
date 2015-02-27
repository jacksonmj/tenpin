if (typeof tenpin=="undefined" || typeof tenpin.inheritPrototype=="undefined")
	throw "tenpin-util.js must be included before tenpin-model.js";

tenpin.model = tenpin.model || {}


tenpin.model.Game = function(){
	this.players = [];
};

tenpin.model.Game.prototype._frameCount = 10;

tenpin.model.Game.prototype.newPlayer = function(){
	var p = new tenpin.model.Player(this);
	this.players.push(p);
	return p;
}




tenpin.model.Player = function(game){
	this.game = game;

	this._initFrames();
	this._initCallbacks();
};

// initialise this._frames with an array of tenpin.model.PlayerFrame objects
tenpin.model.Player.prototype._initFrames = function(){
	this._frames = [];
	for (var i=0; i<this.game._frameCount-1; i++)
	{
		this._frames[i] = new tenpin.model.PlayerFrame(this);
	}
	this._frames[this.game._frameCount-1] = new tenpin.model.PlayerFrame_last(this);
};

tenpin.model.Player.prototype._initCallbacks = function(){
	this.callbacks = this.callbacks || {};
	this.callbacks.nameChanged = new tenpin.Callbacks();// called with arguments: player, newName
	this.callbacks.totalScoreChanged = new tenpin.Callbacks();// called with arguments: player, newTotal
	this.callbacks.frameScoreChanged = new tenpin.Callbacks();
	this.callbacks.ballScoreChanged = new tenpin.Callbacks();
};

tenpin.model.Player.prototype._name = null;
// get or set player's name
tenpin.model.Player.prototype.name = function(newName){
	if (typeof newName=="undefined")
		return this._name;
	this._name = newName;
	this.callbacks.nameChanged.fire(this, newName);
	return this;
};

// get player's overall score
tenpin.model.Player.prototype.totalScore = function(){
	var sum = 0;
	for (var i=0; i<this.game._frameCount; i++)
	{
		sum += this._frames[i].score();
	}
	return sum;
};

// Return an array of the ball scores from startFrame onwards
// startFrame must be an instance of tenpin.model.PlayerFrame and must be one of the frames for this player
// maxBalls is the maximum length of the array (if fewer than maxBalls have been thrown from startFrame onwards, the array will be shorter)
tenpin.model.Player.prototype.getBallScores = function(startFrame, maxBalls){

};

// Get frame number (1-indexed) from frame object
tenpin.model.Player.prototype.frameIndex = function(frame){
	if (!(frame instanceof tenpin.model.PlayerFrame))
		throw "Invalid frame object";
	var len = this._frames.length;
	for (var i=0; i<len; i++)
	{
		if (this._frames[i]===frame)
			return i+1;
	}
	throw "Frame is not from this player";
}
// Get frame object from frame number (1-indexed)
tenpin.model.Player.prototype.frame = function(frameNumber){
	if (+frameNumber<1 || +frameNumber>this._frames.length)
		return false;
	return this._frames[+frameNumber-1];
}

// Return the frame before/after the argument (argument must be an instance of tenpin.model.PlayerFrame and must be one of the frames for this player)
tenpin.model.Player.prototype.frameBefore = function(frame){
	var i = this.frameIndex(frame);
	if (i<=1)
		return null;
	return this.frame(i-1);
};
tenpin.model.Player.prototype.frameAfter = function(frame){
	var i = this.frameIndex(frame);
	if (i>=this.game._frameCount)
		return null;
	return this.frame(i+1);
};


tenpin.model.InvalidBallScoreError = function(msg){
	this.msg = msg;
};
tenpin.model.InvalidBallScoreError.prototype.toString = function() {
	return this.msg;
}

tenpin.model.PlayerFrame = function(player){
	this.ballScores = [null,null];
	this.player = player;
};
tenpin.model.PlayerFrame.prototype._initCallbacks = function(){
		this.callbacks = this.callbacks || {};
	this.callbacks.ballScoreChanged = new tenpin.Callbacks();
	this.callbacks.frameScoreChanged = new tenpin.Callbacks();
};

// get total score from this frame (pins knocked down plus any bonuses)
tenpin.model.PlayerFrame.prototype.score = function(){
	var score = this.pinsSum();
	// TODO
	return score;
};

// get total number of pins knocked down in this frame
tenpin.model.PlayerFrame.prototype.pinsSum = function(){
	return this.ballScores[0]+this.ballScores[1];
};

// return true if this frame was a spare
tenpin.model.PlayerFrame.prototype.isSpare = function(){
	return (!this.isStrike() && this.pinsSum() === 10);
};

// return true if this frame was a strike
tenpin.model.PlayerFrame.prototype.isStrike = function(){
	return (this.ballScores[0] === 10);
};

tenpin.model.PlayerFrame.prototype._checkBallScores = function(ballScores){
	if (ballScores[0]+ballScores[1] > 10)
		throw new tenpin.model.InvalidBallScoreError("Cannot knock down more than ten pins in a frame, except on the last frame");
	if (ballScores[0]<0 || ballScores[1]<0)
		throw new tenpin.model.InvalidBallScoreError("Cannot have negative scores");
	if (ballScores[0]===null && ballScores[1]!==null)
		throw new tenpin.model.InvalidBallScoreError("Must set the score of ball 1 before ball 2");
}

// get or set the score for a particular ball (score == number of pins knocked down with that ball)
// whichBall is 1-indexed
// omit newScore to get the score
tenpin.model.PlayerFrame.prototype.ballScore = function(whichBall, newScore){
	if (typeof newScore=="undefined")
		return this.ballScores[whichBall-1];

	var newScores = this.ballScores.slice();
	newScores[whichBall-1] = newScore;
	this._checkBallScores(newScores); // throws if a score is invalid
	this.ballScores[whichBall-1] = newScore;
	return this;
};

// get the number of balls thrown
tenpin.model.PlayerFrame.prototype.ballsThrownCount = function(){
	var len = this.ballScores.length;
	var count = 0;
	for (var i=0; i<len; i++)
	{
		if (this.ballScores[i]!==null)
			count++;
	}
	return count;
};

// get the number of balls allowed to be thrown in this frame, based on the current ball scores (might not be 2 if this is the last frame or the first ball was a strike)
tenpin.model.PlayerFrame.prototype.ballsAllowedCount = function(){
	if (this.isStrike())
		return 1;
	return 2;
};

// get the frame before or after this one
tenpin.model.PlayerFrame.prototype.prevFrame = function(){
	return this.player.frameBefore(this);
};

tenpin.model.PlayerFrame.prototype.nextFrame = function(){
	return this.player.frameAfter(this);
};




tenpin.model.PlayerFrame_last = function(player){
	tenpin.model.PlayerFrame.call(this, player);
	this.ballScores = [null,null,null];
};

tenpin.model.PlayerFrame_last.prototype = tenpin.inheritPrototype(tenpin.model.PlayerFrame);
tenpin.model.PlayerFrame_last.prototype.ballsAllowedCount = function(){

};


