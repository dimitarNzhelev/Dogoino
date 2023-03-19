import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import paho.mqtt.client as mqtt

cred = credentials.Certificate(
    './loginauth-5aa1e-firebase-adminsdk-hd0t3-1200b1773c.json')

app = firebase_admin.initialize_app(cred)

db = firestore.client()

user = db.collection("users").document(
    "mitko123@gmail.com").collection("collars").get()

client = mqtt.Client("pi4")
client.connect("broker.hivemq.com")
all_gps = {}
for doc in user:
    x = doc.to_dict()
    client.subscribe(f"{x['id']}/door")
    client.subscribe(f"{x['id']}/awaitLoc")
    client.subscribe(f"{x['id']}/gps")
    all_gps.setdefault(x['id'], [])  # set default value for new key


def on_message(client, userdata, message):
    if 'gps' in message.topic:
        print(f"{message.topic.split('/')[0]}{message.payload.decode()}")
        all_gps[message.topic.split('/')[0]].append(message.payload.decode())
        print(all_gps)


client.on_message = on_message
client.loop_forever()
