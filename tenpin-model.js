if (typeof tenpin=="undefined" || typeof tenpin.inheritPrototype=="undefined")
	throw "tenpin-util.js must be included before tenpin-model.js";

tenpin.model = tenpin.model || {}



tenpin.model.Game = function(){
	this.players = [];
	this._initCallbacks();
};

tenpin.model.Game.prototype._initCallbacks = function(){
	this.callbacks = this.callbacks || {};
	this.callbacks.playerAdded = new tenpin.Callbacks();// called with arguments: newPlayer, game
};

tenpin.model.Game.prototype._frameCount = 10;// default for newly created players
// Return maximum number of frames for any player (should be 10, but just for flexibility)
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
	return new tenpin.model.Player(this);
}




tenpin.model.Player = function(game){
	this.game = game;
	this.game.players.push(this);

	this._initFrames();
	this._initCallbacks();

	this.game.callbacks.playerAdded.fire(this, this.game);
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

// number of frames for this player
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
// Recalculate player's score
tenpin.model.Player.prototype._calcScore = function(){
	var sum = 0;
	for (var i=0; i<this._frames.length; i++)
	{
		sum += this._frames[i].score();
	}
	return sum;
};
// Recalculate player's score and notify observers if it has changed
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
tenpin.model.Player.prototype.frameNumber = function(frame){
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
	var i = this.frameNumber(frame);
	if (i<=1)
		return null;
	return this.frame(i-1);
};
tenpin.model.Player.prototype.frameAfter = function(frame){
	var i = this.frameNumber(frame);
	if (i>=this._frames.length)
		return null;
	return this.frame(i+1);
};

// Get the next player
tenpin.model.Player.prototype.next = function(){
	var len = this.game.players.length;
	for (var i=0; i<len; i++)
	{
		if (this.game.players[i]===this)
		{
			if (i+1<len)
				return this.game.players[i+1];
			else
				return null;
		}
	}
	return null;
}




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

// Clear ball score data
tenpin.model.PlayerFrame.prototype.clear = function(){
	this.setBalls({1:null,2:null});
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

// Recalculate score for this frame
tenpin.model.PlayerFrame.prototype._calcScore = function(){
	var score = this.pinsSum();
	if (this.isStrike() && this.nextFrame())
		score += tenpin.arraySum(this.player.getBallScores(this.nextFrame(),2));
	else if (this.isSpare() && this.nextFrame())
		score += tenpin.arraySum(this.player.getBallScores(this.nextFrame(),1));
	return score;
};

// Recalculate score for this frame and notify observers if it has changed
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
// optional argument ballScores is an array of the ball scores to check this condition for, defaults to the current ball scores for this frame
tenpin.model.PlayerFrame.prototype.isSpare = function(ballScores){
	if (typeof ballScores=="undefined")
		ballScores = this._ballScores;
	return (!this.isStrike(ballScores) && ballScores[0]+ballScores[1] === 10);
};

// return true if the first ball was a strike
// optional argument ballScores is an array of the ball scores to check this condition for, defaults to the current ball scores for this frame
tenpin.model.PlayerFrame.prototype.isStrike = function(ballScores){
	if (typeof ballScores=="undefined")
		ballScores = this._ballScores;
	return (ballScores[0] === 10);
};

// Validate a new set of ball scores for this frame
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
	else if (newScore!==this._ballScores[whichBall-1])// if newScore is different from the current stored score, try to change it
	{
		var changes = {};
		changes[whichBall] = newScore;
		this.setBalls(changes);
	}
	return this;
};

// Set scores for multiple balls at once
// Useful when changing them one at a time would cause validation errors (e.g. "more than 10 pins knocked down in a frame"), but the new scores taken as a whole are valid
tenpin.model.PlayerFrame.prototype.setBalls = function(scoreChanges){
	var i, ballNumber;
	var newScores = this._ballScores.slice();
	for (i=0; i<this._ballScores.length; i++)
	{
		ballNumber = i+1;
		if (typeof scoreChanges[ballNumber]!="undefined")
		{
			this._validateBallScore(scoreChanges[ballNumber]);// (throws if a score is invalid)
			newScores[i] = scoreChanges[ballNumber];
		}
	}

	this._checkBallScores(newScores); // (throws if a score is invalid)

	// New scores are valid, store them
	var oldScores = this._ballScores.slice();
	this._ballScores = newScores;

	// Notify of changes
	for (i=0; i<this._ballScores.length; i++)
	{
		if (oldScores[i] !== newScores[i])
			this.callbacks.ballScoreChanged.fire(newScores[i], i+1, this);
	}
	this.player._checkForScoreChanges();
	return this;
};

// Check whether a value could be a valid ball score
tenpin.model.PlayerFrame.prototype._validateBallScore = function(newScore){
	if (!tenpin.isInteger(newScore) && newScore!==null)
		throw new tenpin.model.InvalidBallScoreError("Score must be an integer or null");
	if (newScore>10)
		throw new tenpin.model.InvalidBallScoreError("Cannot knock down more than ten pins with a single ball");
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

// Has all the data been entered for this frame, based on the current ball scores?
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

tenpin.model.PlayerFrame.prototype.frameNumber = function(){
	return this.player.frameNumber(this);
}




// Last frame in a game (frame 10)
tenpin.model.PlayerFrame_last = function(player){
	tenpin.model.PlayerFrame.call(this, player);
	this._ballScores = [null,null,null];
};

tenpin.model.PlayerFrame_last.prototype = tenpin.inheritPrototype(tenpin.model.PlayerFrame);

tenpin.model.PlayerFrame_last.prototype.clear = function(){
	this.setBalls({1:null,2:null,3:null});
	return this;
};

tenpin.model.PlayerFrame_last.prototype.ballsAllowed = function(){
	if (this.isStrike() || this.isSpare())
		return 3;
	return 2;
};

tenpin.model.PlayerFrame_last.prototype._checkBallScores = function(ballScores){
	if (!this.isStrike(ballScores) && !this.isSpare(ballScores) && tenpin.arraySum(ballScores) > 10)
		throw new tenpin.model.InvalidBallScoreError("Cannot knock down more than ten pins in the last frame unless a spare or strike was obtained");
	if (this.isStrike(ballScores) && ballScores[1]!==10 && ballScores[1]+ballScores[2] > 10)
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

// score for this frame is just pins knocked down (for other frames, bonus balls are in subsequent frames but for the last frame  all bonuses are in the last frame)
tenpin.model.PlayerFrame_last.prototype._calcScore = function(){
	return this.pinsSum();
}

