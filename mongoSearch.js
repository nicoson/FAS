db.illegal.find({"manualreview":true,"update":{$gt:ISODate("2021-12-14T00:00:00")}}).count()

db.illegal.find({"update": {$gt:ISODate("2021-01-03T00:00:00")}}).count()

db.illegal.deleteMany({"create": {$gt:ISODate("2021-01-03T00:00:00")}})