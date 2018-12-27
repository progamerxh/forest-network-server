const block = require('../models').block;

module.exports = {
	create(req) {
		return block.create({
			height: req.height,
			time: req.time,
			hash: req.hash,
			appHash: req.appHash,
		})
	},
	list(req,res) {
		return block.all({ order: [['time', 'DESC']] })
			.then(block => res.status(201).send(block))
			.catch(error => res.status(400).send(error));
	},
	getlast() {
		return block.findOne({
			order: [['time', 'DESC']],
		})
	},
};