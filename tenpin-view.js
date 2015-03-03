if (typeof tenpin=="undefined" || typeof tenpin.inheritPrototype=="undefined")
	throw "tenpin-util.js must be included before tenpin-view.js";

tenpin.view = tenpin.view || {}

tenpin.view.ScoreTable = function(container, gameModel){
	this.gameModel = gameModel;
	this.table = $('<table class="ScoreTable"><thead></thead><tbody></tbody></table>').appendTo(container);
	this.header = new tenpin.view.ScoreTable_header(this.table.find("thead"), gameModel);
	this.players = [];
	var tbody = this.table.find("tbody");
	var len = this.gameModel.players.length;
	for (var i=0; i<len; i++)
	{
		this.players.push(new tenpin.view.ScoreTable_player(tbody, this.gameModel.players[i]));
	}

	// TODO: footer for adding players
};


tenpin.view.ScoreTable_row = function(container, gameModel){
	this.gameModel = gameModel;
	this.row = $(document.createElement('tr'));
	this.nameCell = this.createCell(this.row).addClass('PlayerName');
	var len = gameModel.frameCount();
	for (var i=1; i<=len; i++)
	{
		this.createFrameCell(this.row, i).addClass('Frame');
	}
	this.scoreCell = this.createCell(this.row).addClass('TotalScore');

	this.row.appendTo(container);
};
// ScoreTable_row.createCell and .createFrameCell are provided in derived classes, below.


tenpin.view.ScoreTable_header = function(container, gameModel){
	tenpin.view.ScoreTable_row.call(this, container, gameModel);
	this.nameCell.text('Name');
	this.scoreCell.text('Total');
};
tenpin.view.ScoreTable_header.prototype = tenpin.inheritPrototype(tenpin.view.ScoreTable_row);

tenpin.view.ScoreTable_header.prototype.createCell = function(container){
	return $(document.createElement('th')).appendTo(container);
};

tenpin.view.ScoreTable_header.prototype.createFrameCell = function(container, frameNumber){
	return this.createCell(container).text(frameNumber);
};


tenpin.view.ScoreTable_player = function(container, playerModel){
	this.playerModel = playerModel;
	this.frames = [];
	tenpin.view.ScoreTable_row.call(this, container, playerModel.game);
	this.setName(playerModel.name());
	this.setScore(playerModel.score());

	this.playerModel.callbacks.nameChanged.add(this.setName, this);
	this.playerModel.callbacks.playerScoreChanged.add(this.setScore, this);
};
tenpin.view.ScoreTable_player.prototype = tenpin.inheritPrototype(tenpin.view.ScoreTable_row);

tenpin.view.ScoreTable_player.prototype.createCell = function(container){
	return $(document.createElement('td')).appendTo(container);
};
tenpin.view.ScoreTable_player.prototype.createFrameCell = function(container, frameNumber){
	var cell = this.createCell(container);
	this.frames[frameNumber] = new tenpin.view.ScoreTable_Frame(cell, this.playerModel.frame(frameNumber));
	return cell;
};
tenpin.view.ScoreTable_player.prototype.setName = function(newName){
	this.nameCell.text(newName);
}
tenpin.view.ScoreTable_player.prototype.setScore = function(newScore){
	this.scoreCell.text(newScore);
}


tenpin.view.ScoreTable_Frame = function(container, frameModel){
	this.frameModel = frameModel;
	var ballScoresContainer = $('<div class="BallScores"></div>').appendTo(container);
	this.ballScores = [];
	for (var i=1; i<=2; i++)
	{
		this.ballScores[i] = new tenpin.view.ScoreTable_BallScore(ballScoresContainer, frameModel, i);
	}
	this.scoreElem = $('<div class="FrameScore"></div>').appendTo(container);
	this.setScore(this.frameModel.score());

	this.frameModel.callbacks.frameScoreChanged.add(this.setScore, this);
	this.frameModel.callbacks.ballScoreChanged.add(this.onBallScoreChanged, this);
};
tenpin.view.ScoreTable_Frame.prototype.setScore = function(newScore){
	if (this.frameModel.ballsThrown() || newScore)
		this.scoreElem.text(newScore);
	else
		this.scoreElem.html("&nbsp;");
};
tenpin.view.ScoreTable_Frame.prototype.onBallScoreChanged = function(newBallScore, whichBall, frame){
	this.ballScores[whichBall].setScore(newBallScore);
};


tenpin.view.ScoreTable_BallScore = function(container, frameModel, whichBall){
	this.frameModel = frameModel;
	this.whichBall = whichBall;
	this.scoreElem = $('<span class="BallScore"></div>').appendTo(container);
	this.currentScore = null;
	this.setScore(this.frameModel.ball(whichBall));
}

tenpin.view.ScoreTable_BallScore.prototype.setScore = function(newScore){
	if (newScore===null)
		this.scoreElem.html("&nbsp;");
	else
		this.scoreElem.text(newScore);
	this.scoreElem.removeClass('BallScore-'+this.currentScore).addClass('BallScore-'+newScore);
	this.currentScore = newScore;
}

