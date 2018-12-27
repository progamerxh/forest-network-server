const account = require('../api/account.js');
const block = require('../api/block.js');
const transaction = require('../api/transaction.js');
module.exports = app => {
	app.get('/api', (req, res) =>
		res.status(200).send({
			message: 'Bump!'
		})
	);
	app.get('/api/accounts/page=:page', account.list);
	app.get('/api/accounts/:address', account.detail);
	app.get('/api/accounts/search=:search?/page=:page?', account.search);
	app.get('/api/accounts/followings/:address/page=:page?', account.fetchFollowings);
	
	app.get('/api/blocks', block.list);

	app.get('/api/transactions/author=:author?/type=:type?/page=:page?', transaction.find);
	app.get('/api/transactions/hash=:hash', transaction.findByHash);
	app.get('/api/transactions', transaction.list);
	app.get('/api/transactions/react/hash=:hash/type=:type', transaction.getReact);

	app.get('/api/newsfeed/:address/page=:page?', transaction.fetchNewsfeed)
};