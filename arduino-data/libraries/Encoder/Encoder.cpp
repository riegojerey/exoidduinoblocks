#include "Encoder.h"

Encoder::Encoder(uint8_t pin1, uint8_t pin2) {
    _pin1 = pin1;
    _pin2 = pin2;
    _position = 0;
    
    pinMode(_pin1, INPUT_PULLUP);
    pinMode(_pin2, INPUT_PULLUP);
    
    attachInterrupt(digitalPinToInterrupt(_pin1), updateEncoder, CHANGE);
    attachInterrupt(digitalPinToInterrupt(_pin2), updateEncoder, CHANGE);
}

long Encoder::read() {
    return _position;
}

void Encoder::write(long p) {
    _position = p;
}

void Encoder::updateEncoder() {
    // Simple implementation - increment on rising edge of pin1
    if (digitalRead(_pin1) == HIGH) {
        if (digitalRead(_pin2) == LOW) {
            _position++;
        } else {
            _position--;
        }
    }
}
