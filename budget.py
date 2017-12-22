#Devin Dang
#CS 1520
#Assignment 5

from flask import Flask, request, abort, url_for, redirect, session, escape, render_template, jsonify
from flask_restful import reqparse, abort, Api, Resource
from datetime import datetime
import json

### app
app = Flask(__name__)
api = Api(app)

app.config.update(dict(SEND_FILE_MAX_AGE_DEFAULT=0))

cats = [{'category':'Uncategorized',
		'limit': None}]

purchases = list()

parser = reqparse.RequestParser()
parser.add_argument('categoryName', type=str)
parser.add_argument('categoryValue', type=float)
parser.add_argument('purchaseDate')
parser.add_argument('purchaseName', type=str)
parser.add_argument('amountSpent', type=float)

### classes

class Category(Resource):
	def get(self):
		return cats

	def post(self):
		args = parser.parse_args()
		cats.append({"category":args['categoryName'], 
					"limit": float(args['categoryValue'])})
		return cats[-1], 201

	def delete(self):
		args = parser.parse_args()
		if args['categoryName'] != "Uncategorized":
			for index, cat in enumerate(cats):
				for key, val in cat.items():
					if val == args['categoryName']:
						cats.pop(index)
		return '', 204
	

class Purchases(Resource):
	def get(self):
		return purchases

	def post(self):
		args = parser.parse_args()
		purchases.append(
			{
			'category':args['categoryName'],
			'date':args['purchaseDate'],
			'purchased':args['purchaseName'],
			'amountPaid':args['amountSpent']
			})
		return purchases, 201

### routes

@app.route("/")
def default():
	return render_template("home.html")

##
## Actually setup the Api resource routing here
##
api.add_resource(Category, '/cats')
api.add_resource(Purchases, '/purchases')

if __name__ == '__main__':
	app.run(debug=True)
