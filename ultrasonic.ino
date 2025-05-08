#include <Arduino.h>
#include <NewPing.h>

NewPing mySonar(12, 11, 200); // WARNING: Using default pins and max distance

long readUltrasonicDistance_mySonar() {
    unsigned int pingTime = mySonar.ping(); // Get the raw ping time in microseconds
    return mySonar.convert_cm(pingTime); // Convert ping time to distance in centimeters; Returns 0 if no echo received within MAX_DISTANCE
}

void setup() {
}

void loop() {
    delay(1000); // Wait for 1 second between readings
} 