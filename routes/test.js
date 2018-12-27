const express = require('express');
const fetchblock = require('./seeders/fetchblock');
const account = require('./models').account;
const WebSocket = require('ws');
const socketIo = require("socket.io");
const http = require("http");

const wsurl = 'ws://localhost:26657/websocket'

const app = express();
const PORT = 3010;
const GENESIS_ADDRESS = "GA6IW2JOWMP4WGI6LYAZ76ZPMFQSJAX4YLJLOQOWFC5VF5C6IGNV2IW7";
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true
	})
);
// Add headers
app.use(function (req, res, next) {
	res.setHeader("Content-Type", "application/json");
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});

// const server = http.Server(app);
// const io = socketIo(server);
// global.io = io;
const nodews = new WebSocket(wsurl);

require('./routes/index')(app);



// io.on("connection", socket => {
// 	console.log("New client connected");
// 	socket.emit("FromAPI", "EMITED");
// 	socket.on("client-send", function (data) {
// 		console.log(data);
// 	});
// 	socket.on("disconnect", () => console.log("Client disconnected"));
// });;


const fetchData = {
	async fetch() {

		let isFetchDone = false;
		while (!isFetchDone) {
			isFetchDone = await fetchblock.app.isFetchDone()
				.then(async res => {
					if (res === false) {
						await fetchblock.app.fetchblock();
						return false;
					}
					else {
						return true;
					}
				})
		}
	}
}


app.listen(PORT, async () => {
	const count = await account.count();
	if (count === 0)
		await account.create({
			address: GENESIS_ADDRESS,
			balance: Number.MAX_SAFE_INTEGER,
			sequence: 0,
			bandwidth: 0,
		});

	fetchData.fetch()
		.then(() => {
			console.log('fetch done');
			//Private node ws
			nodews.onopen = function (e) {
				console.log("Connection established");
				nodews.send(JSON.stringify({ "method": "subscribe", "params": { "query": "tm.event='NewBlock'" }, "id": 0 }));
			};
			nodews.onmessage = function (e) {
				console.log("Message received");
				fetchblock.app.fetchblock();
			};
			nodews.onerror = function (e) {
				console.log("WebSocket Error: ", e);
				//Custom function for handling errors
			};
			nodews.onclose = function (e) {
				console.log("Connection closed", e);
			};
		})
	console.log(`Server running at port ${PORT}.`);

});

module.exports = app;
