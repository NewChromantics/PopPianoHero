
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


let InputQueue = [];

function TPianoGame()
{
	let GameSpeed = 2;
	
	this.GoalKeys = [];
	this.UserKeys = [];
	this.Time = 0;
	this.IntroTime = 0;
	this.ErrorTime = 0;
	this.CurrentKey = 0;
	this.StateMachine = new Pop.StateMachine('Intro');

	this.Update = function(Timestep)
	{
		this.StateMachine.Update( Timestep );
	}
	
	this.State_Intro = function(FirstCall,Timestep)
	{
		if ( FirstCall )
		{
			this.AddNewGoalKey();
			this.AddNewGoalKey();
			this.AddNewGoalKey();
			this.AddNewGoalKey();
			this.AddNewGoalKey();
			this.AddNewGoalKey();
		}
		
		this.IntroTime += Timestep;
		//	wait a couple of secs
		if ( this.IntroTime < 0 )
			return null;
		
		return 'NextKey';
	}
	
	this.UpdateInput = function()
	{
		//	push any keypress onto the user key queue
		if ( InputQueue.length == 0 )
			return;
		let Column = InputQueue.shift();
		this.UserKeys.push( Column );
		Pop.Debug( JSON.stringify(this.GoalKeys), JSON.stringify(this.UserKeys) );
	}

	this.AddNewGoalKey = function()
	{
		let NextKey = Math.floor(Math.random() * 4);
		this.GoalKeys.push( NextKey );
	}

	this.State_NextKey = function(FirstCall,Timestep)
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
		
		//	hit correct key! remove it
		
		//	scroll along
		this.Time += Timestep * GameSpeed;
		if ( Math.floor( this.Time ) > this.CurrentKey )
		{
			//	onto next key
			this.AddNewGoalKey();
			this.CurrentKey++;
		}
		
		return null;
	}
	
	this.State_ErrorKey = function(FirstCall,Timestep)
	{
		if ( FirstCall )
			this.ErrorTime = 0;
		
		//	pause for a mo, then remove all the following user's inputs
		this.UserKeys.splice( this.CurrentKey );
		
		this.ErrorTime += Timestep;
		if ( this.ErrorTime < 2 )
			return null;
		
		return 'NextKey';
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
	let Shader = Pop.GetShader( RenderTarget, GameShader, VertShader );

	let KeyTime = PianoGame.Time-PianoGame.CurrentKey;
	let GoalKeys = PianoGame.GoalKeys.slice( PianoGame.CurrentKey, PianoGame.CurrentKey+5 );
	let ErrorTime = PianoGame.ErrorTime;
	if ( PianoGame.StateMachine.State != 'ErrorKey' )
		ErrorTime = -1;
	
	let SetUniforms = function(Shader)
	{
		Shader.SetUniform('ErrorTime', ErrorTime );
		Shader.SetUniform('GoalKeys', GoalKeys );
		Shader.SetUniform('Time', PianoGame.Time );
		//Pop.Debug(KeyTime);
		Shader.SetUniform('KeyTime',KeyTime);
	};
	RenderTarget.DrawQuad( Shader, SetUniforms );
}

function GetColumnFromInputKey(Key)
{
	switch ( Key )
	{
		case '1':	return 0;
		case '2':	return 1;
		case '3':	return 2;
		case '4':	return 3;
		default:	break;
	}
	
	return undefined;
}

function OnWindowKeyDown(Key)
{
	let Column = GetColumnFromInputKey( Key );
	if ( Column == undefined )
	{
		Pop.Debug("Ignoring key",Key);
		return;
	}

	InputQueue.push(Column);
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

let WindowRect = [0,0,1280,720];
let Window = new Pop.Opengl.Window("Piano Hero");
Window.OnRender = RenderGame;
Window.OnKeyDown = OnWindowKeyDown;
Window.OnKeyUp = function(){};
Window.OnMouseMove = function(){};
Window.OnMouseDown = function(){};


UpdateLoop().then(Pop.Debug).catch(Pop.Debug);



/*

function TKeyboardInput(DeviceMeta,DeviceKey)
{
	//	stack of clicks we pop from
	this.TriggerQueue = [];
	
	Debug("New device [" + DeviceKey + "]: " + JSON.stringify(DeviceMeta));
	
	this.LastState = false;
	this.Name = DeviceKey;
	
	this.IsKeyPressed = function(Key)
	{
		if ( this.LastState === false )
			return false;
		let ButtonState = this.LastState[Key];
		return (ButtonState === true);
	}
	
	this.Device = new Pop.Input.Device( DeviceMeta.UsbPath );
	
	this.OnStateChanged = function(NewState)
	{
		let KeyState = [];
		let DebugIfChanged = function(State,ButtonIndex)
		{
			let Key = GetKeyFromHidCode(ButtonIndex);
			let Last = this.LastState ? this.LastState[Key] : false;
			if ( Last && !State )
			{
				Debug( this.Name + " button " + Key + " released");
			}
			else if ( !Last && State )
			{
				Debug( this.Name + " button " + Key + " pressed");
				this.TriggerQueue.push( Key );
			}
			KeyState[Key] = State;
		};
		NewState.Buttons.forEach( DebugIfChanged.bind(this) );
		this.LastState = KeyState;
	}
	
	this.Update = async function()
	{
		while ( true )
		{
			try
			{
				await this.Device.OnStateChanged();
				const NewState = this.Device.GetState();
				this.OnStateChanged( NewState );
			}
			catch(e)
			{
				//	need to handle disconnected device...
				//	but the internal system should recognise the resurgance of the same device
				Debug("Input error: " + e);
				await Pop.Yield();
			}
		}
	}
	
	this.Update();
}




async function CheckForInputDevices()
{
	let HidInputs = [];
	
	function AllocInput(DeviceMeta)
	{
		//	USB path is the only unique thing!
		let DeviceKey = DeviceMeta.UsbPath;
		
		if ( HidInputs.hasOwnProperty(DeviceKey) )
			return;
		
		//	safely fail so next device can be allocated
		try
		{
			let Input = new TKeyboardInput( DeviceMeta, DeviceKey );
			HidInputs[DeviceKey] = Input;
		}
		catch(e)
		{
			Pop.Debug("Failed to create input: " + JSON.stringify(DeviceMeta) + ": " + e );
		}
	}
	
	while ( true )
	{
		try
		{
			await Pop.Yield();
			Debug("Enuming devices...");
			let Devices = await Pop.Input.OnDevicesChanged();
			Debug("Got new device list: " + JSON.stringify(Devices) );
			Devices.forEach( AllocInput );
		}
		catch(e)
		{
			Debug("Input error: " + e );
		}
	}
}
CheckForInputDevices();

*/

