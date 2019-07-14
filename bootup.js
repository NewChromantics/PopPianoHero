
Pop.Include = function(Filename)
{
	let Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}


const VertShader = Pop.LoadFileAsString('Quad.vert.glsl');
const GameShader = Pop.LoadFileAsString('Game.frag.glsl');

Pop.Include('PopStateMachine.js');
Pop.Include('PopEngineCommon/PopShaderCache.js');
Pop.Include('PopEngineCommon/PopFrameCounter.js');
Pop.Include('PopEngineCommon/PopMath.js');



function TPianoGame
{
	this.GoalKeys = [];
	this.UserKeys = [];
	this.Time = 0;
	this.CurrentKey = 0;
	this.StateMachine = new Pop.StateMachine('Intro');

	this.Update = function(Timestep)
	{
		this.StateMachine.Update( Timestep );
	}
	
	this.State_Intro = function(FirstCall)
	{
		this.AddNewGoalKey();
		this.AddNewGoalKey();
		this.AddNewGoalKey();
		this.AddNewGoalKey();
		
		this.Time += Timestep;
		//	wait a couple of secs
		if ( this.Time < 2 )
			return null;
		
		return 'NextKey';
	}
	
	this.UpdateInput = function()
	{
		//	push any keypress onto the user key queue
	}

	this.AddNewGoalKey = function()
	{
		let NextKey = Math.floor(Math.random() * 4);
		this.GoalKeys.push( NextKey );
	}

	this.State_NextKey = function(FirstCall)
	{
		this.UpdateInput();
		this.UserKey = this.UserKeys[this.CurrentKey];
		this.GoalKey = this.GoalKeys[this.CurrentKey];

		//	waiting for user key
		if ( this.UserKey === undefined )
		{
			return null;
		}

		//	hit wrong key!
		if ( this.UserKey != this.GoalKey )
		{
			return 'ErrorKey';
		}
		
		//	scroll along
		this.Time += Timestep;
		if ( Math.floor( this.Time ) > this.CurrentKey )
		{
			//	onto next key
			this.AddNewGoalKey();
			this.CurrentKey++;
		}
		
		return null;
	}
	
	//	setup state machine
	this.StateMachine.Intro = this.State_Intro.bind(this);
	this.StateMachine.NextKey = this.State_NextKey.bind(this);
	this.StateMachine.ErrorKey = this.State_ErrorKey.bind(this);
}


//	todo:
//	app state flow
let PianoGame = new TPianoGame();


function RenderGame(RenderTarget)
{
	//	draw some squares!
}

async function UpdateLoop()
{
	let UpdateCounter = new Pop.FrameCounter("Update");
	while ( true )
	{
		let UpdateFps = 60;
		let UpdateMs = 1000/UpdateFps;
		await Pop.Yield(UpdateMs);
		let UpdateStep = UpdateMs/1000;	//	gr: here we could do proper time-elapsed amount
		PianoGame.Update( UpdateStep );
		UpdateCounter.Add();
	}
}

let Window = new Pop.Opengl.Window("Piano Hero");
Window.OnRender = RenderGame;

UpdateLoop().then(Pop.Debug).catch(Pop.Debug);
