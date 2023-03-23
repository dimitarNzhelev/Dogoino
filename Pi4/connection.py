import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import paho.mqtt.client as mqtt
import json

cred = credentials.Certificate(
    './loginauth-5aa1e-firebase-adminsdk-hd0t3-1200b1773c.json')

app = firebase_admin.initialize_app(cred)

db = firestore.client()

user = db.collection("users").document(
    "aa@gmail.com").collection("collars").get()

client = mqtt.Client("pi4")
client.connect("broker.hivemq.com")
all_gps = {}
lock_ref = db.document("users/aa@gmail.com/lock/lockDoor")
lock_doc_snap = lock_ref.get()
ids = ()
lock_value = lock_doc_snap.to_dict()["value"]
locked = bool(lock_value)

for doc in user:
    x = doc.to_dict()
    client.subscribe(f"{x['id']}/door")
    client.subscribe(f"{x['id']}/awaitLoc")
    client.subscribe(f"{x['id']}/gps")
    all_gps.setdefault(x['id'], [])
    ids = ids + ({x['id']},)
print(ids)


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


client.on_message = on_message
client.loop_forever()
