
QUnit.module("model.PlayerFrame: set ballScore", {
	setup:function(assert){
		this.f = new tenpin.model.PlayerFrame(null);
	}
});
QUnit.test("valid set + get", function(assert){
	this.f.ballScore(1,3);
	this.f.ballScore(2,5);
	assert.deepEqual(this.f.ballScore(1), 3);
	assert.deepEqual(this.f.ballScore(2), 5);
});
QUnit.test("uninitialised ball scores are null", function(assert){
	assert.deepEqual(this.f.ballScore(1), null, "ball 1 score");
	assert.deepEqual(this.f.ballScore(2), null, "ball 2 score");
	assert.deepEqual(this.f.ballsThrownCount(), 0, "ballsThrownCount");
});
QUnit.test("throw on single score too large", function(assert){
	assert.throws(
		function(){
			this.f.ballScore(1,11);
		},
		/more than ten/i,
		"setting ball 1"
	);
	assert.throws(
		function(){
			this.f.ballScore(2,20);
		},
		/more than ten/i,
		"setting ball 2"
	);
});
QUnit.test("throw on sum too large", function(assert){
	this.f.ballScore(1,6);
	assert.throws(
		function(){
			this.f.ballScore(2,7);
		},
		/more than ten/i
	);
});
QUnit.test("throw on negative score", function(assert){
	assert.throws(
		function(){
			this.f.ballScore(1,-10);
		},
		/negative/i
	);
});
QUnit.test("throw on out-of-order set", function(assert){
	assert.throws(
		function(){
			this.f.ballScore(2,5);
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
	this.f.ballScore(1,10);
	assert.deepEqual(this.f.isStrike(), true, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrownCount(), 1, "ballsThrownCount");
	assert.deepEqual(this.f.ballsAllowedCount(), 1, "ballsAllowedCount");
});
QUnit.test("5,-", function(assert){
	this.f.ballScore(1,5);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 5, "pinsSum");
	assert.deepEqual(this.f.ballsThrownCount(), 1, "ballsThrownCount");
	assert.deepEqual(this.f.ballsAllowedCount(), 2, "ballsAllowedCount");
});
QUnit.test("5,4", function(assert){
	this.f.ballScore(1,5).ballScore(2,4);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), false, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 9, "pinsSum");
	assert.deepEqual(this.f.ballsThrownCount(), 2, "ballsThrownCount");
	assert.deepEqual(this.f.ballsAllowedCount(), 2, "ballsAllowedCount");
});
QUnit.test("0,10", function(assert){
	this.f.ballScore(1,0).ballScore(2,10);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), true, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrownCount(), 2, "ballsThrownCount");
	assert.deepEqual(this.f.ballsAllowedCount(), 2, "ballsAllowedCount");
});
QUnit.test("3,7", function(assert){
	this.f.ballScore(1,3).ballScore(2,7);
	assert.deepEqual(this.f.isStrike(), false, "isStrike");
	assert.deepEqual(this.f.isSpare(), true, "isSpare");
	assert.deepEqual(this.f.pinsSum(), 10, "pinsSum");
	assert.deepEqual(this.f.ballsThrownCount(), 2, "ballsThrownCount");
	assert.deepEqual(this.f.ballsAllowedCount(), 2, "ballsAllowedCount");
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

QUnit.module("model.Player: scoring", {
	setup:function(assert){
		this.g = new tenpin.model.Game();
		this.p = this.g.newPlayer();
		this.p.frame(1).ballScore(1,0).ballScore(2,7);
		this.p.frame(2).ballScore(1,8).ballScore(2,0);
		this.p.frame(3).ballScore(1,6).ballScore(2,3);
		this.p.frame(4).ballScore(1,0).ballScore(2,0);
	}
});

QUnit.test("simple scoring", function(assert){
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 8, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 0, "frame 4 score");
	assert.deepEqual(this.p.totalScore(), 7+8+9, "total score");
});

QUnit.test("spare in middle", function(assert){
	this.p.frame(2).ballScore(1,8).ballScore(2,2);
	this.p.frame(3).ballScore(1,5).ballScore(2,4);
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 10+5, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 0, "frame 4 score");
	assert.deepEqual(this.p.totalScore(), 7+15+9, "total score");
});

QUnit.test("strike in middle", function(assert){
	this.p.frame(2).ballScore(1,8).ballScore(2,0);
	this.p.frame(3).ballScore(1,5).ballScore(2,4);
	this.p.frame(4).ballScore(1,3).ballScore(2,2);
	assert.deepEqual(this.p.frame(1).score(), 7, "frame 1 score");
	assert.deepEqual(this.p.frame(2).score(), 10+5+4, "frame 2 score");
	assert.deepEqual(this.p.frame(3).score(), 9, "frame 3 score");
	assert.deepEqual(this.p.frame(4).score(), 5, "frame 4 score");
	assert.deepEqual(this.p.totalScore(), 7+15+9+5, "total score");
});





// TODO: test callbacks



