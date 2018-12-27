const transaction = require('../models').transaction;
const account = require('../models').account;
const Op = require('sequelize').Op;
const fn = require('sequelize').fn;
const col = require('sequelize').col;
const Sequelize = require('sequelize');

module.exports = {
    async fetchNewsfeed(req, res) {
        const found = await account.findByPk(req.params.address);
        if (!found) return res.status(400).send('Account not found!')
        return transaction.findAll({
            attributes: {
                include: [
                    [fn('array_length', col('comments'), 1), 'commentcount'],
                    [fn('array_length', col('reacts'), 1), 'reactcount']
                ],
                exclude: ['comments', 'reacts'],
            },
            where: {
                type: 'post',
                author: {
                    [Op.or]: found.followings,
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 5,
            offset: (req.params.page) ? req.params.page * 5 : 0,
        })
            .then(transaction => res.status(201).send(transaction))
            .catch(error => res.status(400).send(error));
    },
    getReact(req, res) {
        if (req.params.type === "comment")
            return transaction.findOne(
                {
                    attributes: ['comments'],
                    where: { hash: req.params.hash }
                })
                .then(transaction => res.status(201).send(transaction))
                .catch(error => res.status(400).send(error));
        else
            return transaction.findOne(
                {
                    attributes: ['reacts'],
                    where: { hash: req.params.hash }
                })
                .then(transaction => res.status(201).send(transaction))
                .catch(error => res.status(400).send(error));
    },
    async addComment(req, res) {
        return transaction.update(
            {
                comments: fn('array_append', col('comments'), req.txhash)
            },
            {
                where: { hash: req.objecthash }
            })
    },
    findByPk(req) {
		return transaction.findByPk(req);
	},
    findByHash(req, res) {
        return transaction.findOne({
            where: {
                hash: req.params.hash
            },
        })
            .then(transaction => res.status(201).send(transaction))
            .catch(error => res.status(400).send(error));
    },
    find(req, res) {
        var where = {};
        if (req.params.author)
            where.author = req.params.author;
        if (req.params.type)
            where.type = req.params.type;
        return transaction.findAll({
            attributes: {
                include: [
                    [fn('array_length', col('comments'), 1), 'commentcount'],
                    [fn('array_length', col('reacts'), 1), 'reactcount'],
                ],
                exclude: ['comments', 'reacts'],
            },
            where,
            order: [['createdAt', 'DESC']],
            limit: 5,
            offset: (req.params.page) ? req.params.page * 5 : 0,
        })
            .then(transaction => res.status(201).send(transaction))
            .catch(error => res.status(400).send(error));
    },
    create(req) {
        return transaction.create({
            hash: req.hash,
            author: req.author,
            type: req.type,
            data: req.data,
            createdAt: req.createdAt,
        })
    },
    list(req, res) {
        return transaction.all({ order: [['createdAt', 'DESC']] })
            .then(transaction => res.status(201).send(transaction))
            .catch(error => res.status(400).send(error));
    }
}