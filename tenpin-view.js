if (typeof tenpin=="undefined" || typeof tenpin.inheritPrototype=="undefined")
	throw "tenpin-util.js must be included before tenpin-view.js";

tenpin.view = tenpin.view || {}

// Controller, creates all things necessary to display a tenpin game
tenpin.view.Game = function(container, gameModel){
	if (typeof gameModel=="undefined") {
		gameModel = new tenpin.model.Game();
	}
	this.gameModel = gameModel;
	this.scoreTable = new tenpin.view.ScoreTable(container, this.gameModel);
	this.scoreInput = new tenpin.view.FrameInput(container);
	this.newPlayerForm = new tenpin.view.NewPlayerForm(container, this.gameModel);

	this.scoreTable.inputActions.clickFrame.add(this.setEditFrame, this);
	this.gameModel.callbacks.playerAdded.add(this.onPlayerAdded, this);

	this.newPlayerForm.nameInput.focus();
}
// Set the frame for which scores are currently being edited
tenpin.view.Game.prototype.setEditFrame = function(newFrame) {
	this.scoreInput.setFrame(newFrame);
	this.scoreInput.focus();
}
// If a player has been added, reset score edit position
tenpin.view.Game.prototype.onPlayerAdded = function() {
	this.scoreInput.setFrame(this.gameModel.players[0].frame(1));
}




// Form for adding a new player
tenpin.view.NewPlayerForm = function(container, gameModel){
	this.onSubmit = tenpin.bind(this.onSubmit, this);
	this.gameModel = gameModel;

	this.form = $(document.createElement('form')).addClass("AddPlayer");
	this.title = $('<h2>Add player</h2>').appendTo(this.form);
	this.nameInput = $('<input type="text" placeholder="Name">').appendTo(this.form);
	this.submitButton = $('<input class="btn" type="submit" value="Add">').appendTo(this.form);
	this.form.appendTo(container);

	this.form.on('submit', this.onSubmit);
}

tenpin.view.NewPlayerForm.prototype.onSubmit = function(){
	var name = this.nameInput.val();
	name = name.replace(/^\s+|\s+$/gm,'');// trim whitespace, old browsers are a pain for not supporting trim()
	if (name==='')
	{
		alert('Name cannot be blank');
		return false;
	}
	this.gameModel.newPlayer().name(name);
	this.nameInput.val('').focus();// clear and re-focus input ready for the next name
	return false;
}




// Table for displaying scores
tenpin.view.ScoreTable = function(container, gameModel){
	this.gameModel = gameModel;
	this.onClick = tenpin.bind(this.onClick, this);

	// observer subjects for input actions performed on the score table (for use by controller)
	this.inputActions = this.inputActions || {};
	this.inputActions.clickFrame = new tenpin.Callbacks();

	this.table = $('<table class="ScoreTable"><thead></thead><tbody></tbody></table>').appendTo(container);
	this.header = new tenpin.view.ScoreTable_header(this.table.find("thead"), gameModel);

	// Create rows for existing players
	this.players = [];
	this.tbody = this.table.find("tbody");
	var len = this.gameModel.players.length;
	for (var i=0; i<len; i++)
	{
		this.players.push(new tenpin.view.ScoreTable_player(this.tbody, this.gameModel.players[i]));
	}

	// Placeholder for if there aren't any players
	this.placeholderRow = $('<tr><td class="NoPlayers">No players added yet</td></tr>').appendTo(this.tbody);
	this.placeholderRow.find("td").attr('colspan', 2+this.gameModel.frameCount());
	if (this.players.length)
		this.placeholderRow.hide();

	this.gameModel.callbacks.playerAdded.add(this.onPlayerAdded, this);
	this.table.on('click', this.onClick);
};

tenpin.view.ScoreTable.prototype.onClick = function(e){
	// When a frame is clicked, tell all interested objects about it (currently only the controller, which will change the frame being edited to the one which is clicked)
	var frameCell = $(e.target).parents(".ScoreTable td.Frame");
	if (frameCell.length===1) {
		this.inputActions.clickFrame.fire(frameCell.data("frameView").frameModel, e);// a reference to the frame view object is stored on the DOM element in jQuery data("frameView")
		return false;
	}
	return true;
}

// Add rows to the table for new players
tenpin.view.ScoreTable.prototype.onPlayerAdded = function(newPlayer) {
	this.players.push(new tenpin.view.ScoreTable_player(this.tbody, newPlayer));
	this.placeholderRow.hide();
}




// A row in the score table, which could be the header row or a player row
// ScoreTable_row.createCell and .createFrameCell are provided in derived classes, below.
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




// Score table header row
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




// Score table player row
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
	// Display of the scores is handled by yet another object for each frame
	var FrameClass = tenpin.view.ScoreTable_Frame;// normal frame
	if (frameNumber===this.playerModel.frameCount())
		FrameClass = tenpin.view.ScoreTable_Frame_last;// last frame, which may have an extra ball in it
	this.frames[frameNumber] = new FrameClass(cell, this.playerModel.frame(frameNumber));
	cell.data("frameView", this.frames[frameNumber]);// store a reference to the frame view object on the DOM element
	return cell;
};
// update displayed name/score for this player
tenpin.view.ScoreTable_player.prototype.setName = function(newName){
	this.nameCell.text(newName);
}
tenpin.view.ScoreTable_player.prototype.setScore = function(newScore){
	this.scoreCell.text(newScore);
}




// Class to display results for a single frame in a score table
tenpin.view.ScoreTable_Frame = function(container, frameModel){
	this.container = container;
	this.frameModel = frameModel;
	this.container.addClass('Frame-Normal');

	// Ball scores
	this.ballScoresContainer = $('<div class="BallScores"></div>').appendTo(container);
	this.ballScores = [];
	for (var i=1; i<=2; i++)
	{
		this.ballScores[i] = new tenpin.view.ScoreTable_BallScore(this.ballScoresContainer, frameModel, i);
	}

	// Frame score
	this.scoreElem = $('<div class="FrameScore"></div>').attr('title', 'Frame '+frameModel.frameNumber()+' score').appendTo(container);
	this.setScore(this.frameModel.score());

	this.updateClasses();

	this.frameModel.callbacks.frameScoreChanged.add(this.setScore, this);
	this.frameModel.callbacks.ballScoreChanged.add(this.onBallScoreChanged, this);
};

// Update displayed frame score
tenpin.view.ScoreTable_Frame.prototype.setScore = function(newScore){
	if (this.frameModel.ballsThrown() || newScore)
		this.scoreElem.text(newScore);
	else
		this.scoreElem.html("&nbsp;");// elements have a tendency to collapse if completely empty
};
// Notification from the model that a ball score has changed
tenpin.view.ScoreTable_Frame.prototype.onBallScoreChanged = function(newBallScore, whichBall, frame){
	// route it to the correct ScoreTable_BallScore object
	this.ballScores[whichBall].setScore(newBallScore);
	// If a ball score has changed, current status of the frame may have changed
	this.updateClasses();
};
// Update various CSS classes which indicate the current status of the frame
tenpin.view.ScoreTable_Frame.prototype.updateClasses = function(){
	this.container.toggleClass('Frame-Complete', this.frameModel.isComplete());
	this.container.toggleClass('Frame-Strike', this.frameModel.isStrike());
	this.container.toggleClass('Frame-Spare', this.frameModel.isSpare());
}




// Class to display results for the last frame (may have an extra ball)
tenpin.view.ScoreTable_Frame_last = function(container, frameModel){
	tenpin.view.ScoreTable_Frame.call(this, container, frameModel);
	this.ballScores[3] = new tenpin.view.ScoreTable_BallScore(this.ballScoresContainer, frameModel, 3);
	this.container.removeClass('Frame-Normal').addClass('Frame-Last');
}
tenpin.view.ScoreTable_Frame_last.prototype = tenpin.inheritPrototype(tenpin.view.ScoreTable_Frame);




// Class to display a single ball score
tenpin.view.ScoreTable_BallScore = function(container, frameModel, whichBall){
	this.frameModel = frameModel;
	this.whichBall = whichBall;

	this.scoreElem = $('<span class="BallScore"></span>').attr('title', 'Frame '+frameModel.frameNumber()+' ball '+whichBall).appendTo(container);

	this.currentScore = null;
	this.setScore(this.frameModel.ball(whichBall));
}

// Update displayed score
tenpin.view.ScoreTable_BallScore.prototype.setScore = function(newScore){
	if (newScore===null)
		this.scoreElem.html("&nbsp;");
	else
		this.scoreElem.text(newScore);
	this.scoreElem.removeClass('BallScore-'+this.currentScore).addClass('BallScore-'+newScore);
	this.currentScore = newScore;
}




// A widget to edit the ball scores for a frame
tenpin.view.FrameInput = function(container){
	this.onInputChanged = tenpin.bind(this.onInputChanged, this);
	this.onFormSubmit = tenpin.bind(this.onFormSubmit, this);

	this.container = $('<div class="FrameInput"></div>');
	this.title = $('<h2></h2>').appendTo(this.container);
	this.form = $('<form></form>').appendTo(this.container);
	this.errorMsg = false;
	this.frameModel = null;
	this.balls = [];
	this.ballsCount = 3;// max number of balls in any frame
	var ballInputsContainer = $('<div class="BallInputs"></div>').appendTo(this.form);
	for (var i=1; i<=this.ballsCount; i++) {
		this.balls[i] = new tenpin.view.BallInput(ballInputsContainer, this);
	}

	this.submitButton = $('<input type="submit" class="btn" value="Next frame">').appendTo(this.form);
	this.errorContainer = $('<div class="ErrorMsg"></div>').hide().appendTo(this.form);

	this.form.on('change', this.onInputChanged);
	this.form.on('submit', this.onFormSubmit);
	this.container.appendTo(container);
	this.setFrame(null);
}
// Set which frame is currently being edited, without saving any previously entered data
tenpin.view.FrameInput.prototype._setFrame = function(frameModel){
	if (this.frameModel)
	{
		this.frameModel.player.callbacks.nameChanged.remove(this.updateTitle, this);
	}

	this.frameModel = frameModel;
	for (var i=1; i<=this.ballsCount; i++) {
		this.balls[i].setTargetBall(frameModel, i);
	}
	this.submitButton.toggle(!!frameModel);
	if (this.frameModel)
	{
		this.frameModel.player.callbacks.nameChanged.add(this.updateTitle, this);
	}
	this.updateTitle();
	this.container.toggle(this.frameModel!==null);
}
// Update displayed widget title in response to frame change or player name change
tenpin.view.FrameInput.prototype.updateTitle = function(){
	if (this.frameModel)
		this.title.text("Scores for "+this.frameModel.player.name()+" - frame "+this.frameModel.frameNumber());
}
// Set which frame is currently being edited
tenpin.view.FrameInput.prototype.setFrame = function(newFrameModel){
	if (this.processInputs() || confirm('The ball scores entered for this frame are invalid. Continue and discard changes?'))
	{
		this._setFrame(newFrameModel);
		return true;
	}
	return false;
}
// Get or set the displayed error message (false for no error)
tenpin.view.FrameInput.prototype.error = function(newValue){
	this.errorMsg = newValue;
	if (newValue===false)
		this.errorContainer.hide();
	else
		this.errorContainer.show().text(newValue);
}
// Try to update ball scores in model whenever an input value is changed
tenpin.view.FrameInput.prototype.onInputChanged = function(){
	this.processInputs();
}
// On form submit ("Next" button), advance to next frame
tenpin.view.FrameInput.prototype.onFormSubmit = function(){
	this.setFrame(this.nextFrame());
	this.focus();
	return false;
}

// Try to update ball scores in model
// Returns true if successful, otherwise false.
// If unsuccessful (e.g. scores are invalid), model data is not changed.
tenpin.view.FrameInput.prototype.processInputs = function(){
	if (!this.frameModel)
		return true;// not editing anything, so data does not need storing

	// Read input values
	var newValues = {};
	for (var i=1; i<=this.ballsCount; i++) {
		newValues[i] = this.balls[i].value();
	}

	this.error(false);// clear any previous error message
	try
	{
		// Try updating values in model (all values for current frame are updated at once)
		this.frameModel.setBalls(newValues);
		return true;// succeeded
	}
	catch (e)
	{
		// Failed, most likely invalid data
		this.error(e.toString());
	}
	return false;
}
// Return the frame which will be bowled after the current one (i.e. the next frame for which data will be entered)
tenpin.view.FrameInput.prototype.nextFrame = function(){
	var frameNumber = this.frameModel.frameNumber();

	// Try the same frame number but next player
	var newPlayerModel = this.frameModel.player.next();// (returns null if this is the last player)
	if (newPlayerModel)
		return newPlayerModel.frame(frameNumber);

	// Or if everyone has had a turn, go back to the first player and increment frameNumber
	newPlayerModel = this.frameModel.player.game.players[0];
	if (frameNumber+1 <= newPlayerModel.frameCount())
		return newPlayerModel.frame(frameNumber+1);

	// Run out of frames, end of game
	return null;
}
// Focus this widget
tenpin.view.FrameInput.prototype.focus = function(){
	this.balls[1].input.focus();
	// TODO: could be more intelligent? First empty visible textbox, or first textbox if all visible textboxes are non-empty.
}




// Textbox to edit a single ball score inside a tenpin.view.FrameInput
tenpin.view.BallInput = function(container, frameInput){
	this.onKeydown = tenpin.bind(this.onKeydown, this);

	this.frameInput = frameInput;
	this.container = $('<div class="BallInput"></div>').appendTo(container);
	this.label = $(document.createElement('label')).appendTo(this.container);
	this.input = $('<input type="number" min="0" max="10" autocomplete="off">').appendTo(this.container);
	this.input.on('keydown', this.onKeydown);
	this.setTargetBall(null, null);
}
// Set the frame and ball being edited by this textbox
tenpin.view.BallInput.prototype.setTargetBall = function(frameModel, whichBall){
	if (this.frameModel)
	{
		this.frameModel.callbacks.ballScoreChanged.remove(this.onBallScoreChanged, this);
	}

	this.frameModel = frameModel;
	this.whichBall = whichBall;
	if (frameModel && whichBall)
	{
		var inputId = 'BallInput-'+whichBall;
		this.label.attr('for', inputId).text('Ball '+whichBall);
		this.input.attr('id', inputId);
		try {
			this.value(frameModel.ball(whichBall));
		}
		catch(e) {
			this.value(null);
		}
	}
	else
	{
		this.value(null);
	}
	this.updateVisibility();

	if (this.frameModel)
	{
		this.frameModel.callbacks.ballScoreChanged.add(this.onBallScoreChanged, this);
	}

	return this;
}
// Auto show/hide textboxes as required, using the current ball score data for this frame to determine how many balls should be bowled in this frame, and only showing enough textboxes for that many balls
tenpin.view.BallInput.prototype.updateVisibility = function(){
	if (this.frameModel && this.whichBall<=this.frameModel.ballsAllowed())
		this.container.show();
	else
	{
		this.container.hide();
		// If this textbox is hidden, make sure its value is set to null in the model (since if it's hidden, that's what the value should be)
		// (And since it's hidden, it's a bit hard for the user to change...)
		if (this.value()!==null)
		{
			this.value(null);
			this.frameInput.onInputChanged();
		}
	}
	return this;
}
// Get or set the value in the textbox
tenpin.view.BallInput.prototype.value = function(newValue){
	if (typeof newValue=="undefined")
	{
		var value = this.input.val();
		if (value==='')
			return null;
		else
			return +value;
	}
	else
	{
		if (newValue===null)
			newValue = '';
		this.input.val(newValue);
		return this;
	}
}
// Ball score has been changed in the model, update value in textbox to match
tenpin.view.BallInput.prototype.onBallScoreChanged = function(newBallScore, whichBall, frame){
	if (frame===this.frameModel)
	{
		if (whichBall===this.whichBall)
		{
			this.value(newBallScore);
		}
		this.updateVisibility();
	}
}

tenpin.view.BallInput.prototype.onKeydown = function(e){
	if (e.keyCode===13) {
		// turn enter keypress into tab ("advance to next input") if data entry for this frame is not finished
		if (this.frameModel.isComplete())// finished data entry, submit is ok
			return true;
		if (this.input.val()==='')// don't advance or submit if the current field is blank
			return false;
		var inputs = this.frameInput.form.find("input");
		var i = inputs.index(this.input);
		if (i+1>=inputs.length)
			return true;
		inputs[i+1].focus();
		return false;
	}
	// try to update model with new data after input
	setTimeout(this.frameInput.onInputChanged, 1);// slightly delayed execution otherwise the value retrieved is still the one before the keypress. There's an onchange event listener for the form too, but that doesn't fire immediately in response to keypresses, you have to focus something else before it will fire.
	return true;
}

