#include <WiFiNINA.h>
#include <PubSubClient.h>
#include <TinyGPS++.h>
#include <stdlib.h>
#include <avr/dtostrf.h>
TinyGPSPlus gps;

char latitude[20], longtitude[20], pub_string[40];
 float tlat=0,tlng=0;
const char* mqtt_server = "52.29.173.150";
const int mqtt_port = 1883;
const char* client_id = "arduino_client";
char* mqtt_topic = "hacktues";


char ssid[] = "Todor";                
char pass[] = "12345678";                // your network password (use for WPA, or use as key for WEP)
int status = WL_IDLE_STATUS;             // the Wi-Fi radio's status
int ledState = LOW;                       //ledState used to set the LED
unsigned long previousMillisInfo = 0;     //will store last time Wi-Fi information was updated
unsigned long previousMillisLED = 0;      // will store the last time LED was updated
const int intervalInfo = 5000;   // interval at which to update the board information
WiFiClient wifi_client;
PubSubClient mqtt_client(wifi_client);
void setup() {

  Serial.begin(9600);
  Serial1.begin(9600);
  while (!Serial);

  pinMode(LED_BUILTIN, OUTPUT);

  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to network: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network:
    status = WiFi.begin(ssid, pass);
    delay(10000);
  }
  Serial.println("You're connected to the network");
  
   mqtt_client.setServer(mqtt_server, mqtt_port);
  mqtt_client.setCallback(callback);
  while (!mqtt_client.connected()) {
    Serial.println("Connecting to MQTT broker...");
    if (mqtt_client.connect(client_id)) {
      Serial.println("Connected to MQTT broker");
    } else {
      Serial.print("Failed to connect to MQTT broker, rc=");
      Serial.println(mqtt_client.state());
      delay(5000);
    }
  }
}

void loop() {
  while (Serial1.available() > 0)
  {
    if (gps.encode(Serial1.read()))
    {
      Serial.println( gps.location.lat());
      tlat= gps.location.lat();
      tlng=gps.location.lng();
      Serial.println(gps.location.lng());
      
  dtostrf(tlat, 10, 4, latitude);
  dtostrf(tlng, 10, 4, longtitude);
 strcpy(pub_string, latitude);
strcat(pub_string, ",");
strcat(pub_string, longtitude);
  
  //mqtt_client.publish(mqtt_topic,latitude);
  mqtt_client.publish(mqtt_topic,pub_string);
  
 delay(2000);
    
 
    }
  }
     
 if (millis() > 5000 && gps.charsProcessed() < 10)
  {
   Serial.println("No GPS detected");
   while(true);
  }
}


void callback(char* topic, byte* payload, unsigned int length) {
  // Handle incoming MQTT messages here
}
