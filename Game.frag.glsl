precision highp float;
varying vec2 uv;

uniform int GoalKeys[10];
uniform float Time = 0;
uniform float KeyTime = 0;
uniform float ErrorTime = -1;
const int Rows = 4;

bool IsError()
{
	return ErrorTime >= 0;
}

float3 DrawColumn(int Column,float2 ColumnUv)
{
	float v = ColumnUv.y + (KeyTime/float(Rows));
	int y = int(floor(v * Rows));
	if ( GoalKeys[y] != Column )
		return float3(1,1,1);
	
	if ( IsError() )
	{
		if ( fract(ErrorTime*5) < 0.5 )
			return float3(1,0,0);
	}
	
	return float3(0,0,1);
}

void main()
{
	float Columnf = uv.x * 6;
	int Column = int(floor(Columnf));
	Column -= 1;
	
	float u = fract( Columnf );
	
	float3 Rgb = float3(0,0,0);
	
	if ( Column >= 0 && Column <= 3 )
		Rgb = DrawColumn( Column, float2(u,1-uv.y) );
	
	gl_FragColor = float4( Rgb, 1 );
}

