
QUnit.module("model.PlayerFrame: set ballScore", {
	setup:function(assert){
		this.f = new tenpin.model.PlayerFrame(null);
	}
});
QUnit.test("valid set + get", function(assert){
	this.f.ball(1,3);
	this.f.ball(2,5);
	assert.deepEqual(this.f.ball(1), 3);
	assert.deepEqual(this.f.ball(2), 5);
});
QUnit.test("uninitialised ball scores are null", function(assert){
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
	assert.throws(
		function(){ this.f.ball(2,7); },
		/more than ten/i
	);
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
	assert.throws(
		function(){ this.f.ball(0, 3); },
		/ball number/i,
		"0"
	);
	assert.throws(
		function(){ this.f.ball(11, 3); },
		/ball number/i,
		"11"
	);
});
QUnit.test("throw on out-of-order set", function(assert){
	assert.throws(
		function(){
			this.f.ball(2,5);
		},
		/set.+score.+before/i
	);
});


QUnit.module("model.PlayerFrame: misc functions", {
	setup:function(assert){
		this.f = new tenpin.model.PlayerFrame(null);
	}
});
QUnit.test("10,-", function(assert){
	this.f.ball(1,10);
	assert.deepEqual(this.f.isStrike(), true, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 1, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 1, "ballsAllowed");
});
QUnit.test("5,-", function(assert){
	this.f.ball(1,5);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 5, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 1, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 2, "ballsAllowed");
});
QUnit.test("5,4", function(assert){
	this.f.ball(1,5).ball(2,4);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 9, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 2, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 2, "ballsAllowed");
});
QUnit.test("0,10", function(assert){
	this.f.ball(1,0).ball(2,10);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), true, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrown(), 2, "ballsThrown");
	assert.deepEqual(this.f.ballsAllowed(), 2, "ballsAllowed");
});
QUnit.test("3,7", function(assert){
	this.f.ball(1,3).ball(2,7);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), true, "isSpare");
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
	assert.deepEqual(this.p.frameIndex(this.p.frame(5)), 5, "frameIndex");
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
	assert.deepEqual(this.p.totalScore(), 7+8+9, "total score");
});

QUnit.test("spare in middle", function(assert){
	this.p.frame(2).ball(1,8).ball(2,2);
	this.p.frame(3).ball(1,5).ball(2,4);
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 10+5, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 0, "frame 4 score");
	assert.deepEqual(this.p.totalScore(), 7+15+9, "total score");
});

QUnit.test("strike in middle", function(assert){
	this.p.frame(2).clear().ball(1,10);
	this.p.frame(3).ball(1,5).ball(2,4);
	this.p.frame(4).ball(1,3).ball(2,2);
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 10+5+4, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 5, "frame 4 score");
	assert.deepEqual(this.p.totalScore(), 7+19+9+5, "total score");
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
	assert.deepEqual(f.ballsAllowed(), 3, "frame 10 ballsAllowed after 1 strike");
	f.ball(2,10);
	assert.deepEqual(f.isSpare(), false, "isSpare");
	assert.deepEqual(f.isStrike(), true, "isStrike");
	assert.deepEqual(f.ballsAllowed(), 3, "frame 10 ballsAllowed after 2 strikes");
	f.ball(3,10);
	assert.deepEqual(f.isSpare(), false, "isSpare");
	assert.deepEqual(f.isStrike(), true, "isStrike");
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



// TODO: test callbacks



