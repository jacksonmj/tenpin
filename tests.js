
QUnit.module("model.PlayerFrame: ballScore", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
		this.f = this.p.frame(1);
	}
});
QUnit.test("valid set + get", function(assert){
	this.f.ball(1,3);
	this.f.ball(2,5);
	assert.deepEqual(this.f.ball(1), 3, "ball 1");
	assert.deepEqual(this.f.ball(2), 5, "ball 2");
});
QUnit.test("uninitialised ball scores", function(assert){
	assert.deepEqual(this.f.ball(1), null, "ball 1 score");
	assert.deepEqual(this.f.ball(2), null, "ball 2 score");
	assert.deepEqual(this.f.ballsThrown(), 0, "ballsThrown");
});
QUnit.test("clearing scores", function(assert){
	this.f.ball(1,4).ball(2,5);
	this.f.clear();
	assert.deepEqual(this.f.ball(1), null, "ball 1 score");
	assert.deepEqual(this.f.ball(2), null, "ball 2 score");
	assert.deepEqual(this.f.ballsThrown(), 0, "ballsThrown");
});
QUnit.test("throw on single score too large", function(assert){
	assert.throws(
		function(){ this.f.ball(1,11); },
		/more than ten/i,
		"setting ball 1"
	);
	assert.throws(
		function(){ this.f.ball(2,20); },
		/more than ten/i,
		"setting ball 2"
	);
});
QUnit.test("throw on sum too large", function(assert){
	this.f.ball(1,6);
	assert.throws(function(){ this.f.ball(2,7); }, /more than ten/i);
});
QUnit.test("throw on invalid score", function(assert){
	assert.throws(
		function(){ this.f.ball(1,-10); },
		/negative/i,
		"negative"
	);
	assert.throws(
		function(){ this.f.ball(1,"abc"); },
		/integer/i,
		"non-numeric"
	);
	assert.throws(
		function(){ this.f.ball(1, 0.3); },
		/integer/i,
		"floating point"
	);
});
QUnit.test("throw on invalid ball number", function(assert){
	assert.throws(function(){ this.f.ball(0, 2); }, /ball number/i, "0");
	assert.throws(function(){ this.f.ball(3, 2); }, /ball number/i, "3");
});
QUnit.test("throw on out-of-order set", function(assert){
	assert.throws(function(){ this.f.ball(2,5); }, /set.+score.+before/i);
});


QUnit.module("model.PlayerFrame_last: ballScore", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
		this.f = this.p.frame(10);
	}
});
QUnit.test("throw on out-of-order set", function(assert){
	assert.throws(function(){ this.f.ball(2,5); }, /set.+score.+before/i);
	assert.throws(function(){ this.f.ball(3,5); }, /set.+score.+before/i);
});
QUnit.test("throw on invalid ball number", function(assert){
	assert.throws(function(){ this.f.ball(0, 2); }, /ball number/i, "0");
	assert.throws(function(){ this.f.ball(4, 2); }, /ball number/i, "4");
});
QUnit.test("throw on sum too large", function(assert){
	this.f.ball(1,6);
	assert.throws(function(){ this.f.ball(2,7); }, /more than ten/i);
});
QUnit.test("throw on sum too large (bonus balls after strike)", function(assert){
	this.f.ball(1,10);
	this.f.ball(2,5);
	assert.throws(function(){ this.f.ball(3,7); }, /more than ten/i);
});
QUnit.test("valid set + get", function(assert){
	this.f.ball(1,10);
	this.f.ball(2,5);
	this.f.ball(3,4);
	assert.deepEqual(this.f.ball(1), 10);
	assert.deepEqual(this.f.ball(2), 5);
	assert.deepEqual(this.f.ball(3), 4);
});


QUnit.module("model.PlayerFrame: misc functions", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
		this.f = this.p.frame(1);
	}
});
QUnit.test("10,-", function(assert){
	this.f.ball(1,10);
	assert.deepEqual(this.f.isStrike(), true, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.isComplete(), true, "isComplete");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 1, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 1, "ballsAllowed");
});
QUnit.test("5,-", function(assert){
	this.f.ball(1,5);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.isComplete(), false, "isComplete");
	assert.deepEqual(this.f.pinsSum(), 5, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 1, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 2, "ballsAllowed");
});
QUnit.test("5,4", function(assert){
	this.f.ball(1,5).ball(2,4);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.isComplete(), true, "isComplete");
	assert.deepEqual(this.f.pinsSum(), 9, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 2, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 2, "ballsAllowed");
});
QUnit.test("0,10", function(assert){
	this.f.ball(1,0).ball(2,10);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), true, "isSpare");
	assert.deepEqual(this.f.isComplete(), true, "isComplete");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 2, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 2, "ballsAllowed");
});
QUnit.test("3,7", function(assert){
	this.f.ball(1,3).ball(2,7);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), true, "isSpare");
	assert.deepEqual(this.f.isComplete(), true, "isComplete");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 2, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 2, "ballsAllowed");
});


QUnit.module("model.Player", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
	}
});

QUnit.test("frame access", function(assert){
	assert.ok(this.p.frame(3) !== this.p.frame(4), "different frames are distinct");
	assert.deepEqual(this.p.frame(3), this.p.frame(4).prevFrame(), "prevFrame");
	assert.deepEqual(this.p.frame(6), this.p.frame(5).nextFrame(), "nextFrame");
	assert.deepEqual(this.p.frameNumber(this.p.frame(5)), 5, "frameIndex");
	assert.deepEqual(this.p.frameNumber(this.p.frame(10)), 10, "frameIndex for frame 10");
	assert.deepEqual(this.p.frame(11), null, "frame > 10");
	assert.deepEqual(this.p.frame(0), null, "frame < 1");
	assert.deepEqual(this.p.frame("abc"), null, "invalid frame number (string)");
	assert.deepEqual(this.p.frame(1.5), null, "invalid frame number (float)");
	assert.deepEqual(this.p.frame(1).prevFrame(), null, "non-existent prev frame");
	assert.deepEqual(this.p.frame(10).nextFrame(), null, "non-existent next frame");
	assert.throws(function(){
		var g = new tenpin.model.Game();
		var p = g.newPlayer();
		this.p.frameNumber(p.frame(1));
	}, /not from this player/i, "throw on frame from different Player");
	assert.throws(function(){
		this.p.frameNumber({});
	}, /invalid frame/i, "throw on object which isn't a frame");
});

QUnit.test("name set + get", function(assert){
	var ret = this.p.name("John Smith");
	assert.equal(ret, this.p, "chaining");
	assert.deepEqual(this.p.name(), "John Smith", "get name");
});


QUnit.module("model.Player: basic scoring", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
		this.p.frame(1).ball(1,0).ball(2,7);
		this.p.frame(2).ball(1,8).ball(2,0);
		this.p.frame(3).ball(1,6).ball(2,3);
		this.p.frame(4).ball(1,0).ball(2,0);
	}
});

QUnit.test("getBallScores", function(assert){
	this.p.frame(5).ball(1,10);
	this.p.frame(6).ball(1,5).ball(2,4);
	assert.deepEqual(this.p.getBallScores(this.p.frame(1),5), [0,7,8,0,6], "frame 1, n=5");
	assert.deepEqual(this.p.getBallScores(this.p.frame(2),6), [8,0,6,3,0,0], "frame 2, n=6");
	assert.deepEqual(this.p.getBallScores(this.p.frame(5),3), [10,5,4], "including a frame with only 1 ball thrown");
	assert.deepEqual(this.p.getBallScores(this.p.frame(5),6), [10,5,4], "not enough balls to fill array");
});

QUnit.test("simple scoring", function(assert){
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 8, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 0, "frame 4 score");
	assert.deepEqual(this.p.score(), 7+8+9, "total score");
});

QUnit.test("spare in middle", function(assert){
	this.p.frame(2).ball(1,8).ball(2,2);
	this.p.frame(3).ball(1,5).ball(2,4);
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 10+5, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 0, "frame 4 score");
	assert.deepEqual(this.p.score(), 7+15+9, "total score");
});

QUnit.test("strike in middle", function(assert){
	this.p.frame(2).clear().ball(1,10);
	this.p.frame(3).ball(1,5).ball(2,4);
	this.p.frame(4).ball(1,3).ball(2,2);
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 10+5+4, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 5, "frame 4 score");
	assert.deepEqual(this.p.score(), 7+19+9+5, "total score");
});


QUnit.module("model.Player: more complex scoring", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
	}
});
QUnit.test("example scoring from instructions: multiple strikes", function(assert){
	this.p.frame(1).ball(1,10);
	this.p.frame(2).ball(1,10);
	this.p.frame(3).ball(1,4).ball(2,2);
	assert.deepEqual(this.p.frame(1).score(), 24, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 16, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 6, "frame 3 score");
});

QUnit.test("last frame strikes", function(assert){
	var f = this.p.frame(10);
	assert.deepEqual(f.ballsAllowed(), 2, "frame 10 initial ballsAllowed");
	f.ball(1,10);
	assert.deepEqual(f.isSpare(), false, "isSpare");
	assert.deepEqual(f.isStrike(), true, "isStrike");
	assert.deepEqual(f.isComplete(), false, "isComplete");
	assert.deepEqual(f.ballsAllowed(), 3, "frame 10 ballsAllowed after 1 strike");
	f.ball(2,10);
	assert.deepEqual(f.isSpare(), false, "isSpare");
	assert.deepEqual(f.isStrike(), true, "isStrike");
	assert.deepEqual(f.isComplete(), false, "isComplete");
	assert.deepEqual(f.ballsAllowed(), 3, "frame 10 ballsAllowed after 2 strikes");
	f.ball(3,10);
	assert.deepEqual(f.isSpare(), false, "isSpare");
	assert.deepEqual(f.isStrike(), true, "isStrike");
	assert.deepEqual(f.isComplete(), true, "isComplete");
	assert.deepEqual(f.ballsAllowed(), 3, "frame 10 ballsAllowed after 3 strikes");
	assert.deepEqual(f.score(), 30, "frame 10 score");
});

QUnit.test("last frame spare", function(assert){
	var f = this.p.frame(10);
	assert.deepEqual(f.ballsAllowed(), 2, "frame 10 initial ballsAllowed");
	f.ball(1,6);
	assert.deepEqual(f.isSpare(), false, "isSpare");
	assert.deepEqual(f.isStrike(), false, "isStrike");
	assert.deepEqual(f.ballsAllowed(), 2, "frame 10 ballsAllowed after 1 ball");
	f.ball(2,4);
	assert.deepEqual(f.isSpare(), true, "isSpare");
	assert.deepEqual(f.isStrike(), false, "isStrike");
	assert.deepEqual(f.ballsAllowed(), 3, "frame 10 ballsAllowed after spare");
	f.ball(3,2);
	assert.deepEqual(f.ballsAllowed(), 3, "frame 10 ballsAllowed after spare+bonus");
	assert.deepEqual(f.score(), 12, "frame 10 score");
});


QUnit.module("model callbacks", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
		this.p.frame(1).ball(1,3);
		this.p.frame(2).ball(1,4);
	}
});
QUnit.test("Player nameChanged", function(assert){
	assert.expect(2);
	this.p.callbacks.nameChanged.add(function(newName, player){
		assert.equal(player, this.p, "callback argument: player");
		assert.equal(newName, "John Smith", "callback argument: newName");
	}, this);
	this.p.name("John Smith")
});
QUnit.test("Player playerScoreChanged", function(assert){
	assert.expect(2);
	this.p.callbacks.playerScoreChanged.add(function(newPlayerScore, player){
		assert.equal(player, this.p, "callback argument: player");
		assert.equal(newPlayerScore, 12, "callback argument: newPlayerScore");
	}, this);
	this.p.frame(1).ball(2,5);
});
QUnit.test("PlayerFrame ballScoreChanged", function(assert){
	assert.expect(3);
	this.p.frame(1).callbacks.ballScoreChanged.add(function(newBallScore, whichBall, frame){
		assert.equal(frame, this.p.frame(1), "callback argument: frame");
		assert.equal(whichBall, 1, "callback argument: whichBall");
		assert.equal(newBallScore, 5, "callback argument: newBallScore");
	}, this);
	this.p.frame(1).ball(1,5);
	this.p.frame(2).ball(1,2);
});
QUnit.test("PlayerFrame frameScoreChanged", function(assert){
	assert.expect(2);
	this.p.frame(1).callbacks.frameScoreChanged.add(function(newFrameScore, frame){
		assert.equal(frame, this.p.frame(1), "callback argument: frame");
		assert.equal(newFrameScore, 8, "callback argument: newFrameScore");
	}, this);
	this.p.frame(1).ball(2,5);
	this.p.frame(2).ball(2,2);
});
QUnit.test("PlayerFrame frameScoreChanged for other affected frames", function(assert){
	assert.expect(2);
	this.p.frame(1).clear().ball(1,10);
	this.p.frame(1).callbacks.frameScoreChanged.add(function(newFrameScore, frame){
		assert.equal(frame, this.p.frame(1), "callback argument: frame");
		assert.equal(newFrameScore, 16, "callback argument: newFrameScore");
	}, this);
	this.p.frame(2).ball(2,2);
});

