#define MIDI_MODE

#if defined(MIDI_MODE)
#include "MIDIUSB.h"
#else
#include "Keyboard.h"
#endif

const int ButtonCount = 4;

#if defined(ARDUINO_AVR_LEONARDO)
	//	KeeYees Pro Micro ATmega32U4 5V 16MHz
	//	gr: not sure if this is CH30 or not as it's already installed on this dev machine
	const int AllButtonPowerPin = 2;
	const int ButtonPins[ButtonCount] = { 3,4,5,6 };
#else
	#error Unconfigured board
#endif

#if defined(MIDI_MODE)
#define C4  60
#define A3  57
#define E3  52
#define D3  50
#define C3  48
const char ButtonNotes[ButtonCount] = {C3,D3,E3,A3};
const char ButtonVelocitys[ButtonCount] = {127,127,127,127};
const char ButtonChannels[ButtonCount] = {0,0,0,0};
#else
const char ButtonKeys[ButtonCount] = {'1','2','3','4'};
#endif
bool ButtonPressed[ButtonCount] = { false,false,false,false };


#if defined(MIDI_MODE)
//  https://github.com/arduino-libraries/MIDIUSB/blob/master/examples/MIDIUSB_loop/MIDIUSB_loop.ino
void noteOn(byte channel, byte pitch, byte velocity) 
{
  midiEventPacket_t noteOn = {0x09, 0x90 | channel, pitch, velocity};
  MidiUSB.sendMIDI(noteOn);
  MidiUSB.flush();
}
#endif

#if defined(MIDI_MODE)
void noteOff(byte channel, byte pitch, byte velocity) 
{
  midiEventPacket_t noteOff = {0x08, 0x80 | channel, pitch, velocity};
  MidiUSB.sendMIDI(noteOff);
  MidiUSB.flush();
}
#endif

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

 #if defined(MIDI_MODE)
 #else
  Keyboard.begin();
 #endif
}

bool IsSerialConnected()
{
  //  if data has buffered up, serial may be disconnected
  if ( Serial.availableForWrite() < 32 )
    return false;

  return true;
}

bool ProcessButton(int ButtonIndex)
{
	int ButtonPin = ButtonPins[ButtonIndex];
	bool NewPressed = digitalRead( ButtonPin ) == HIGH;
	bool& WasPressed = ButtonPressed[ButtonIndex];

	if ( NewPressed == WasPressed )
		return false;

#if defined(MIDI_MODE)
  int Channel = ButtonChannels[ButtonIndex];
  int Note = ButtonNotes[ButtonIndex];
  int Velocity = ButtonVelocitys[ButtonIndex];
  #endif

	if ( NewPressed )
	{
    if ( IsSerialConnected() )
    {
  		Serial.print("Button ");
	  	Serial.print(ButtonIndex);
		  Serial.println(" Down...");
    }
#if defined(MIDI_MODE)
    noteOn(Channel,Note,Velocity);    
#else
    Keyboard.write( ButtonKeys[ButtonIndex] );
#endif
	}
 else
 {
    if ( IsSerialConnected() )
    {
      Serial.print("Button ");
      Serial.print(ButtonIndex);
      Serial.println(" up...");
    }
 //  button released
#if defined(MIDI_MODE)
    noteOff(Channel,Note,Velocity);    
#else
#endif
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
