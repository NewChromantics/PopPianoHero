#include "Keyboard.h"

const int ButtonCount = 4;

#if defined(ARDUINO_AVR_LEONARDO)
	//	KeeYees Pro Micro ATmega32U4 5V 16MHz
	//	gr: not sure if this is CH30 or not as it's already installed on this dev machine
	const int AllButtonPowerPin = 2;
	const int ButtonPins[ButtonCount] = { 3,4,5,6 };
#else
	#error Unconfigured board
#endif

const char ButtonKeys[ButtonCount] = {'1','2','3','4'};
bool ButtonPressed[ButtonCount] = { false,false,false,false };


void setup() 
{
	//	wait for leonardo serial to initialise
	//while ( !Serial )
	{
	}
	Serial.begin(115200);
	
	pinMode( AllButtonPowerPin, OUTPUT );
	digitalWrite( AllButtonPowerPin, HIGH );

	for ( int b=0;	b<ButtonCount;	b++ )
	{
		pinMode( ButtonPins[b], INPUT );
		digitalWrite( ButtonPins[b], LOW );
	}

	Serial.println("Starting keyboard...");
	Keyboard.begin();
}

bool ProcessButton(int ButtonIndex)
{
	int ButtonPin = ButtonPins[ButtonIndex];
	bool NewPressed = digitalRead( ButtonPin ) == HIGH;
	bool& WasPressed = ButtonPressed[ButtonIndex];

	if ( NewPressed == WasPressed )
		return false;

	if ( NewPressed )
	{
		Serial.print("Button ");
		Serial.print(ButtonIndex);
		Serial.println("Down...");
	
		Keyboard.write( ButtonKeys[ButtonIndex] );
	}

	WasPressed = NewPressed;	
	return true;
}

void loop() 
{
	bool AnyPressed = false;
	AnyPressed |= ProcessButton(0);
	AnyPressed |= ProcessButton(1);
	AnyPressed |= ProcessButton(2);
	AnyPressed |= ProcessButton(3);
	
	if ( !AnyPressed )
	{
		delay(10);
		return;
	}
}
