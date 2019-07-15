#include "Keyboard.h"

#if defined(ARDUINO_AVR_LEONARDO)
	//	KeeYees Pro Micro ATmega32U4 5V 16MHz
	//	gr: not sure if this is CH30 or not as it's already installed on this dev machine
	const int ButtonStartPin = 2;
	const int ButtonEndPin = 3;
#else
	#error Unconfigured board
#endif

bool PreviousPressed = false;


void setup() 
{
	//	wait for leonardo serial to initialise
	while ( !Serial )
	{
	}
	Serial.begin(115200);
	
	pinMode( ButtonStartPin, OUTPUT );
	pinMode( ButtonEndPin, INPUT );
	
	//  we set the internal-pullup value to high so when there is no connection, we
	//  have the internal HIGH value reported
	//  then turn the other end into essentially ground so when there IS a connection
	//  the "ground" comes through.
	//  therefore pressed=ground, unpressed=high
	digitalWrite( ButtonEndPin, HIGH );
	digitalWrite( ButtonStartPin, LOW );

	Serial.println("Starting keyboard...");
	Keyboard.begin();
}

void loop() 
{
	bool NewPressed = digitalRead( ButtonEndPin ) == LOW;
	if ( NewPressed == PreviousPressed )
	{
		delay(20);
		return;
	}

	if ( NewPressed )
	{
		Serial.println("Button Down...");
		Keyboard.write('1');
	}
	else
	{
		Serial.println("Button up...");
	}

	PreviousPressed = NewPressed;
}
