
//	simple state machine
//	add functions that match the state names.
//		StateMachine.Idle = function(FirstCall){}.bind(YourThis);
//	functions return the new state[name] to change to, or null if no change.
//	and call Update(), that's it! very simple, can't break it!
//	arguments from Update are passed on to your state
//	todo: don't catch the exception and make caller handle it
Pop.StateMachine = function(DefaultState,OnException)
{
	if ( DefaultState === undefined )
		throw "Must indicate a default state for a state machine";
	
	this.State = DefaultState;
	this._IsNewState = true;
	
	this.Update = function()
	{
		let StateFunc = this[this.State];
		let NextState = null;
		try
		{
			//const Func = StateFunc.bind(FunctionThis);
			const Func = StateFunc;
			NextState = Func( this._IsNewState, ...arguments );
			this._IsNewState = false;
		}
		catch(e)
		{
			Pop.Debug( this.State + " error: " + e + " reverting to default state (if not overriden)");
			if ( OnException )
				NextState = OnException(e);
			
			if ( NextState === undefined )
				NextState = DefaultState;
		}
		
		//	change state
		if ( NextState != null )
		{
			Pop.Debug("Changed state " + this.State + " --> " + NextState );
			this.State = NextState;
			this._IsNewState = true;
		}
	}
	
}
