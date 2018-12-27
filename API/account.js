const account = require('../models').account;
const Op = require('sequelize').Op;
module.exports = {
	async fetchFollowings(req, res) {
        const found = await account.findByPk(req.params.address);
        if (!found) return res.status(400).send('Account not found!')
        return account.findAll({
            where: {
                address: {
                    [Op.or] : found.followings,
                }
            },
            limit: 5,
            offset: (req.params.page) ? req.params.page * 5 : 0,
        })
            .then(transaction => res.status(201).send(transaction))
            .catch(error => res.status(400).send(error));
    },
	findByAddress(req) {
		return account.findByPk(req);
	},
	search(req, res) {
		return account.findAll({
			where: {
				[Op.or]: {
					address: {
						[Op.iLike]: '%' + req.params.search + '%',
					},
					name: {
						[Op.iLike]: '%' + req.params.search + '%',
					}
				}
			},
			order: [['updatedAt', 'DESC']],
			limit: 5,
			offset: (req.params.page) ? req.params.page * 5 : 0,
		})
			.then(account => res.status(201).send(account))
			.catch(error => res.status(400).send(error));
	},
	detail(req, res) {
		return account.findByPk(req.params.address)
			.then(account => res.status(201).send(account))
			.catch(error => res.status(400).send(error));
	},
	create(req) {
		return account.create({
			address: req.address,
			balance: req.balance,
			sequence: req.sequence,
			bandwidth: req.bandwidth,
			bandwidthTime: req.bandwidthTime
		})
	},
	list(req, res) {
		return account.findAll({
			order: [['updatedAt', 'DESC']],
			limit: 5,
			offset: (req.params.page) ? req.params.page * 5 : 0,
		})
			.then(account => res.status(201).send(account))
			.catch(error => res.status(400).send(error));
	}

};