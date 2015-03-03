if (typeof tenpin=="undefined" || typeof tenpin.inheritPrototype=="undefined")
	throw "tenpin-util.js must be included before tenpin-model.js";

tenpin.model = tenpin.model || {}


tenpin.model.Game = function(){
	this.players = [];
};

tenpin.model.Game.prototype._frameCount = 10;// default for new players
tenpin.model.Game.prototype.frameCount = function(){
	var count = this._frameCount;
	var len = this.players.length;
	for (var i=0; i<len; i++)
	{
		var n = this.players[i].frameCount();
		if (n>count)
			count = n;
	}
	return count;
}

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
	this.callbacks.nameChanged = new tenpin.Callbacks();// called with arguments: newName, player
	this.callbacks.playerScoreChanged = new tenpin.Callbacks();// called with arguments: newPlayerScore, player
};

tenpin.model.Player.prototype.frameCount = function(){
	return this._frames.length;
}

tenpin.model.Player.prototype._name = null;
// get or set player's name
tenpin.model.Player.prototype.name = function(newName){
	if (typeof newName=="undefined")
		return this._name;
	this._name = newName;
	this.callbacks.nameChanged.fire(newName, this);
	return this;
};

// get player's overall score
tenpin.model.Player.prototype.score = function(){
	return this._score;
}
tenpin.model.Player.prototype._score = 0;
tenpin.model.Player.prototype._calcScore = function(){
	var sum = 0;
	for (var i=0; i<this._frames.length; i++)
	{
		sum += this._frames[i].score();
	}
	return sum;
};
tenpin.model.Player.prototype._checkForScoreChanges = function(){
	// Update frame scores
	var len = this._frames.length;
	for (var i=0; i<len; i++)
	{
		this._frames[i]._checkForScoreChanges();
	}
	// Check whether overall score has changed
	var newScore = this._calcScore();
	if (this._score!==newScore)
	{
		this._score = newScore;
		this.callbacks.playerScoreChanged.fire(newScore, this);
	}
}

// Return an array of the ball scores from startFrame onwards
// startFrame must be an instance of tenpin.model.PlayerFrame and must be one of the frames for this player
// maxBalls is the maximum length of the array (if fewer than maxBalls have been thrown from startFrame onwards, the array will be shorter)
tenpin.model.Player.prototype.getBallScores = function(startFrame, maxBalls){
	var frame = startFrame;
	var balls = [];
	while (frame && balls.length<maxBalls)
	{
		var len = frame.ballsThrown();
		for (var i=1; i<=len; i++)
		{
			balls.push(frame.ball(i));
			if (balls.length>=maxBalls)
				return balls;
		}
		frame = frame.nextFrame();
	}
	return balls;
};

// Get the frame number (1-indexed) corresponding to a frame object
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
// Get the frame object corresponding to a frame number (1-indexed)
tenpin.model.Player.prototype.frame = function(frameNumber){
	if (!tenpin.isInteger(frameNumber) || frameNumber<1 || frameNumber>this._frames.length)
		return null;
	return this._frames[frameNumber-1];
}

// Return the frame before/after the argument (argument must be an instance of tenpin.model.PlayerFrame and must be one of the frames for this player)
// Returns null if there is no frame before/after.
tenpin.model.Player.prototype.frameBefore = function(frame){
	var i = this.frameIndex(frame);
	if (i<=1)
		return null;
	return this.frame(i-1);
};
tenpin.model.Player.prototype.frameAfter = function(frame){
	var i = this.frameIndex(frame);
	if (i>=this._frames.length)
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
	this.player = player;
	this._ballScores = [null,null];
	this._initCallbacks();
};

tenpin.model.PlayerFrame.prototype.clear = function(){
	this.ball(2,null).ball(1,null);
	return this;
}

tenpin.model.PlayerFrame.prototype._initCallbacks = function(){
		this.callbacks = this.callbacks || {};
	this.callbacks.ballScoreChanged = new tenpin.Callbacks();// called with arguments: newBallScore, whichBall, frame
	this.callbacks.frameScoreChanged = new tenpin.Callbacks();// called with arguments: newFrameScore, frame
};

// get total score from this frame (pins knocked down plus any bonuses)
tenpin.model.PlayerFrame.prototype.score = function(){
	return this._score;
}
tenpin.model.PlayerFrame.prototype._score = 0;
tenpin.model.PlayerFrame.prototype._calcScore = function(){
	var score = this.pinsSum();
	if (this.isStrike() && this.nextFrame())
		score += tenpin.arraySum(this.player.getBallScores(this.nextFrame(),2));
	else if (this.isSpare() && this.nextFrame())
		score += tenpin.arraySum(this.player.getBallScores(this.nextFrame(),1));
	return score;
};
tenpin.model.PlayerFrame.prototype._checkForScoreChanges = function(){
	var newScore = this._calcScore();
	if (this._score!==newScore)
	{
		this._score = newScore;
		this.callbacks.frameScoreChanged.fire(newScore, this);
	}
}

// get total number of pins knocked down in this frame
tenpin.model.PlayerFrame.prototype.pinsSum = function(){
	return tenpin.arraySum(this._ballScores);
};

// return true if this frame was a spare
tenpin.model.PlayerFrame.prototype.isSpare = function(){
	return (!this.isStrike() && this._ballScores[0]+this._ballScores[1] === 10);
};

// return true if the first ball was a strike
tenpin.model.PlayerFrame.prototype.isStrike = function(){
	return (this._ballScores[0] === 10);
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
// omit newScore to get the score, newScore=null to clear score
// This does not check whether the preceding frame is complete.
tenpin.model.PlayerFrame.prototype.ball = function(whichBall, newScore){
	if (!tenpin.isInteger(whichBall) || whichBall<1 || whichBall>this._ballScores.length)
		throw "Invalid ball number";

	if (typeof newScore=="undefined") // retrieve score
		return this._ballScores[whichBall-1];

	if (newScore===this._ballScores[whichBall-1]) // no change to score
		return this;
	// Check new scores are valid
	if (!tenpin.isInteger(newScore) && newScore!==null)
		throw new tenpin.model.InvalidBallScoreError("Score must be an integer or null");
	if (newScore>10)
		throw new tenpin.model.InvalidBallScoreError("Cannot knock down more than ten pins with a single ball");
	var newScores = this._ballScores.slice();
	newScores[whichBall-1] = newScore;
	this._checkBallScores(newScores); // (throws if a score is invalid)

	// New score is valid, store it
	this._ballScores[whichBall-1] = newScore;

	// Notify of changes
	this.callbacks.ballScoreChanged.fire(newScore, whichBall, this);
	this.player._checkForScoreChanges();
	return this;
};

// get the number of balls thrown
tenpin.model.PlayerFrame.prototype.ballsThrown = function(){
	var len = this._ballScores.length;
	var count = 0;
	for (var i=0; i<len; i++)
	{
		if (this._ballScores[i]!==null)
			count++;
	}
	return count;
};

// get the number of balls allowed to be thrown in this frame, based on the current ball scores (might not be 2 if this is the last frame or the first ball was a strike)
tenpin.model.PlayerFrame.prototype.ballsAllowed = function(){
	if (this.isStrike())
		return 1;
	return 2;
};

tenpin.model.PlayerFrame.prototype.isComplete = function(){
	return (this.ballsThrown()===this.ballsAllowed());
}

// get the frame before/after this one
tenpin.model.PlayerFrame.prototype.prevFrame = function(){
	return this.player.frameBefore(this);
};

tenpin.model.PlayerFrame.prototype.nextFrame = function(){
	return this.player.frameAfter(this);
};



tenpin.model.PlayerFrame_last = function(player){
	tenpin.model.PlayerFrame.call(this, player);
	this._ballScores = [null,null,null];
};

tenpin.model.PlayerFrame_last.prototype = tenpin.inheritPrototype(tenpin.model.PlayerFrame);

tenpin.model.PlayerFrame_last.prototype.clear = function(){
	this.ball(3,null).ball(2,null).ball(1,null);
	return this;
};

tenpin.model.PlayerFrame_last.prototype.ballsAllowed = function(){
	if (this.isStrike() || this.isSpare())
		return 3;
	return 2;
};

tenpin.model.PlayerFrame_last.prototype._checkBallScores = function(ballScores){
	if (!this.isStrike() && !this.isSpare() && tenpin.arraySum(ballScores) > 10)
		throw new tenpin.model.InvalidBallScoreError("Cannot knock down more than ten pins in the last frame unless a spare or strike was obtained");
	if (this.isStrike() && ballScores[1]!==10 && ballScores[1]+ballScores[2] > 10)
		throw new tenpin.model.InvalidBallScoreError("Cannot knock down more than ten pins in balls 2+3 of the last frame unless ball 2 was a strike");
	if (ballScores[0]<0 || ballScores[1]<0 || ballScores[2]<0)
		throw new tenpin.model.InvalidBallScoreError("Cannot have negative scores");
	if (ballScores[0]===null && ballScores[1]!==null)
		throw new tenpin.model.InvalidBallScoreError("Must set the score of ball 1 before ball 2");
	if (ballScores[0]===null && ballScores[2]!==null)
		throw new tenpin.model.InvalidBallScoreError("Must set the score of ball 1 before ball 3");
	if (ballScores[1]===null && ballScores[2]!==null)
		throw new tenpin.model.InvalidBallScoreError("Must set the score of ball 2 before ball 3");
};

tenpin.model.PlayerFrame_last.prototype._calcScore = function(){
	return this.pinsSum();
}

