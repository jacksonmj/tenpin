var tenpin = tenpin || {}

// Return a prototype suitable for a child class inheriting from parentClass
// (Object.create is not supported by old browsers)
tenpin.inheritPrototype = function(parentClass){
	var c = function (){};
	c.prototype = parentClass.prototype;
	return new c();
};

// add up all the elements in an array
tenpin.arraySum = function(a){
	var sum = 0, len = a.length;
	for (var i=0; i<len; i++)
	{
		sum += a[i];
	}
	return sum;
}

// returns true if x is an integer
tenpin.isInteger = function(x){
	return (Math.floor(+x)===x);
}

// Return a wrapper function to run func with this=thisArg
// (Function.bind is not supported by old browsers)
tenpin.bind = function(func,thisArg){
	return function(){return func.apply(thisArg,arguments);};
}


// Class to manage a list of callbacks
// (basically an observer subject)
tenpin.Callbacks = function(){
	this._callbacks = [];
}
// Add a callback (a function to call, and a value to use as the "this" value inside the function)
// Does not detect and prevent duplicates
tenpin.Callbacks.prototype.add = function(func, thisArg){
	this._callbacks.push({func:func, thisArg:thisArg});
}
// Run the callbacks. All arguments given are passed through to the callback functions
// Does not detect and prevent recursion
tenpin.Callbacks.prototype.fire = function(){
	var cbs = this._callbacks.slice();// copy the callbacks array so that additions/removals during a callback do not affect which funcs are called
	var len = cbs.length;
	for (var i=0; i<len; i++)
	{
		cbs[i].func.apply(cbs[i].thisArg, arguments);
	}
};
// Remove a callback
tenpin.Callbacks.prototype.remove = function(func, thisArg){
	for (var i=this._callbacks.length; i--; )
	{
		if (this._callbacks[i].func===func && this._callbacks[i].thisArg===thisArg)
			this._callbacks.splice(i,1);
	}
};

