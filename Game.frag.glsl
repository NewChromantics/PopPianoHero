precision highp float;
varying vec2 uv;


float3 DrawColumn(int Column,float2 ColumnUv)
{
	return float3( ColumnUv, 0 );
}

void main()
{
	float Columnf = uv.x * 4;
	int Column = (int)floor(Columnf);
	float u = frac( Columnf );
	float3 Rgb = DrawColumn( Column, float2(u,uv.y) );
	gl_fragColor = float4( Rgb, 1 );
}
