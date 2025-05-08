#ifndef Encoder_h
#define Encoder_h

#include "Arduino.h"

class Encoder {
public:
    Encoder(uint8_t pin1, uint8_t pin2);
    long read();
    void write(long p);
private:
    uint8_t _pin1, _pin2;
    volatile long _position;
    static void updateEncoder();
};

#endif
