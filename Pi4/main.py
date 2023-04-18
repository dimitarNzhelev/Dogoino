import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522
import time
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import paho.mqtt.client as mqtt
import json
import datetime

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

cred = credentials.Certificate(
    './loginauth-5aa1e-firebase-adminsdk-hd0t3-1200b1773c.json')

app = firebase_admin.initialize_app(cred)

db = firestore.client()

user = db.collection("users").document(
    "aa@gmail.com").collection("collars").get()

client = mqtt.Client("pi4")
client.connect("broker.hivemq.com")
all_gps = {}  # all gps cords for every id
ids = ()  # empty tuple for the ids
lock_ref = db.document("users/aa@gmail.com/lock/lockDoor")
lock_doc_snap = lock_ref.get()

lock_value = lock_doc_snap.to_dict()["value"]
locked = lock_value
print(lock_value)
for doc in user:
    x = doc.to_dict()
    client.subscribe(f"{x['id']}/door")
    client.subscribe(f"{x['id']}/awaitLoc")
    client.subscribe(f"{x['id']}/gps")
    all_gps.setdefault(x['id'], [])
    ids = ids + ({x['id']},)


def on_message(client, userdata, message):
    global all_gps

    id = message.topic.split('/')[0]
    if 'gps' in message.topic:
        coords = message.payload.decode().split(", ")
        latitude = coords[0]
        longitude = coords[1]
        print(f"{coords}")
        if len(all_gps[id]) == 0 or all_gps[id][-1] != coords:
            all_gps[id].append(
                {"latitude": float(latitude), "longitude": float(longitude)})
    if 'awaitLoc' in message.topic:
        if message.payload.decode() == '1':
            client.publish(f"{id}/receiveLoc",
                           json.dumps(all_gps[id]), qos=1, retain=False)
    if 'door' in message.topic:
        if message.payload.decode() == "1":
            locked = True
            print("Reader locked")
        elif message.payload.decode() == "0":
            locked = False
            print("Reader unlocked")


# Set up the MQTT client
client.on_message = on_message
client.loop_start()

# Wait for the MQTT connection to establish
time.sleep(2)

# Set up the RFID reader
reader = SimpleMFRC522()


def Open_Close(direction, motor_pins, step_sequence, motor_step_counter, id):
    current_time = datetime.datetime.now().time()
    formatted_time = current_time.strftime('%H:%M:%S')
    query = db.collection("users").document(
        "aa@gmail.com").collection("collars")

    for doc in query.stream():
        print(f"{doc.id} => {doc.to_dict()['id']}")
        if (doc.to_dict()['id'] == id):
            name = doc.id
            break
    logs = db.collection("users").document(
        "aa@gmail.com").collection("collars").document(name).collection("logs")

    for i in range(step_count):
        for pin in range(0, len(motor_pins)):
            GPIO.output(motor_pins[pin],
                        step_sequence[motor_step_counter][pin])
        if direction == True:
            motor_step_counter = (motor_step_counter - 1) % 8
        elif direction == False:
            motor_step_counter = (motor_step_counter + 1) % 8
        time.sleep(step_sleep)
    if direction == False:
        logs.add({"message": f"{formatted_time}  The Door Closed"})
    elif direction == True:
        logs.add({"message": f"{formatted_time}  The Door Opened"})


def cleanup():
    GPIO.output(in1, GPIO.LOW)
    GPIO.output(in2, GPIO.LOW)
    GPIO.output(in3, GPIO.LOW)
    GPIO.output(in4, GPIO.LOW)
    GPIO.cleanup()


# RFID
reader = SimpleMFRC522()

# Stepper motor
in1 = 17
in2 = 18
in3 = 27
in4 = 22
direction = False
step_count = 2200

step_sequence = [[1, 0, 0, 1],
                 [1, 0, 0, 0],
                 [1, 1, 0, 0],
                 [0, 1, 0, 0],
                 [0, 1, 1, 0],
                 [0, 0, 1, 0],
                 [0, 0, 1, 1],
                 [0, 0, 0, 1]]

motor_pins = [in1, in2, in3, in4]
motor_step_counter = 0
step_sleep = 0.002

# setting up
GPIO.setup(in1, GPIO.OUT)
GPIO.setup(in2, GPIO.OUT)
GPIO.setup(in3, GPIO.OUT)
GPIO.setup(in4, GPIO.OUT)

# initializing
GPIO.output(in1, GPIO.LOW)
GPIO.output(in2, GPIO.LOW)
GPIO.output(in3, GPIO.LOW)
GPIO.output(in4, GPIO.LOW)


# Sonic setup
TRIG = 26
ECHO = 16

GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

GPIO.output(TRIG, False)
print("Waiting for sensor to settle...")
time.sleep(2)
constDist = 0


def GetDist():
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    while GPIO.input(ECHO) == 0:
        pulse_start = time.time()

    while GPIO.input(ECHO) == 1:
        pulse_end = time.time()

    pulse_duration = pulse_end - pulse_start
    distance = pulse_duration * 17150
    distance = round(distance, 2)

    return distance


constDist = GetDist()
print(constDist)

while True:
    try:
        id, text = reader.read()
        id = str(id)
        print({id})
        print(ids)
        time.sleep(0.5)
        if {id} in ids:
            lock_ref = db.document("users/aa@gmail.com/lock/lockDoor")
            lock_doc_snap = lock_ref.get()
            lock_value = lock_doc_snap.to_dict()["value"]
            locked = lock_value
            print(id)
            print(locked)
            if locked == False:
                Open_Close(True, motor_pins, step_sequence,
                           motor_step_counter, id)
                while True:
                    time.sleep(5)
                    distance = GetDist()
                    if distance < constDist * 0.6:
                        continue
                    else:
                        break
                Open_Close(False, motor_pins, step_sequence,
                           motor_step_counter, id)
            else:
                print("Door is locked")

        else:
            print("Unknown RFID tag")

    except Exception as e:
        print(f"Exception occurred: {e}")
        GPIO.cleanup()
