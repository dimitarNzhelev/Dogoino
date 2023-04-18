#include <WiFiNINA.h>
#include <PubSubClient.h>
#include <TinyGPS++.h>
#include <stdlib.h>
#include <avr/dtostrf.h>
TinyGPSPlus gps;

char latitude[20], longtitude[20], pub_string[40];
float tlat = 0, tlng = 0;
const char *mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char *client_id = "arduino_client";
char *mqtt_topic = "326460584940/gps";

char ssid[] = "Todor";
char pass[] = "12345678";
int status = WL_IDLE_STATUS;
int ledState = LOW;
unsigned long previousMillisInfo = 0;
unsigned long previousMillisLED = 0;
const int intervalInfo = 5000;
WiFiClient wifi_client;
PubSubClient mqtt_client(wifi_client);
void setup()
{

  Serial.begin(9600);
  Serial1.begin(9600);

  pinMode(LED_BUILTIN, OUTPUT);

  while (status != WL_CONNECTED)
  {
    status = WiFi.begin(ssid, pass);
    delay(10000);
  }
  Serial.println("You're connected to the network");

  mqtt_client.setServer(mqtt_server, mqtt_port);
  mqtt_client.setCallback(callback);
  while (!mqtt_client.connected())
  {
    Serial.println("Connecting to MQTT broker...");
    if (mqtt_client.connect(client_id))
    {
      Serial.println("Connected to MQTT broker");
    }
    else
    {
      Serial.print("Failed to connect to MQTT broker, rc=");
      Serial.println(mqtt_client.state());
      delay(5000);
    }
  }
}

void loop()
{
  int i = 0;
  while (Serial1.available() > 0)
  {
    if (gps.encode(Serial1.read()))
    {
      Serial.println(gps.location.lat());
      tlat = gps.location.lat();
      tlng = gps.location.lng();
      Serial.println(gps.location.lng());

      dtostrf(tlat, 10, 4, latitude);
      dtostrf(tlng, 10, 4, longtitude);
      strcpy(pub_string, latitude);
      strcat(pub_string, ",");
      strcat(pub_string, longtitude);

      if (i == 10)
      {
        mqtt_client.publish(mqtt_topic, pub_string);
        i = 0;
      }

      delay(10000);
      i++;
    }
  }

  if (millis() > 5000 && gps.charsProcessed() < 10)
  {
    Serial.println("No GPS detected");
    while (true)
      ;
  }
}

void callback(char *topic, byte *payload, unsigned int length)
{
  // Handle incoming MQTT messages here
}