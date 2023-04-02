import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import time
from datetime import datetime

cred = credentials.Certificate(
    './loginauth-5aa1e-firebase-adminsdk-hd0t3-1200b1773c.json')

app = firebase_admin.initialize_app(cred)

db = firestore.client()

step_count = 2200

step_sleep = 0.002


def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).get()
    deleted = 0
    if (len(docs) == 0):
        return deleted
    for doc in docs:
        print(f'Deleting doc {doc.id} => {doc.to_dict()}')
        doc.reference.delete()
        deleted += 1

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)


def Open_Close(direction, motor_pins, step_sequence, motor_step_counter, id):

    query = db.collection("users").document(
        "aa@gmail.com").collection("collars")

    for doc in query.stream():
        print(f"{doc.id} => {doc.to_dict()['id']}")
        if (doc.to_dict()['id'] == id):
            name = doc.id
            break
    logs = db.collection("users").document(
        "aa@gmail.com").collection("collars").document(name).collection("logs")
    now = datetime.now()

    hour = int(now.strftime("%H"))

    # if hour == 0:
    # for i in range(step_count):
    #     for pin in range(0, len(motor_pins)):
    #         GPIO.output(motor_pins[pin],
    #                     step_sequence[motor_step_counter][pin])
    #     if direction == True:
    #         motor_step_counter = (motor_step_counter - 1) % 8
    #     elif direction == False:
    #         motor_step_counter = (motor_step_counter + 1) % 8
    #     time.sleep(step_sleep)
    # if direction == False:
    logs.add({"message": "{}  The Door Closed".format(
        now.strftime("%H:%M:%S"))})
    time.sleep(2)
    # elif direction == True:
    now = datetime.now()
    logs.add({"message": "{}  The Door Opened".format(
        now.strftime("%H:%M:%S"))})
    # time.sleep(2)


Open_Close(True, 0, 0, 0, "326460584940")
