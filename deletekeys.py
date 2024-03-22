from replit import db
print(db.keys(), "1")
for i in db.keys():
    print(i, db[i])

