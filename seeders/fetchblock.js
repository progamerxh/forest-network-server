const blockapi = require('../api/block.js');
const transactionapi = require('../api/transaction.js');
const accountapi = require('../api/account.js');
const atob = require('atob');
const Decimal = require('decimal.js');
const { decode, hash } = require('../lib/tx/index');
const { asyncForEach } = require('../lib/helper');
const { PlainTextContent, ReactContent } = require('../lib/tx/v1');
const moment = require('moment');
const base32 = require('base32.js');
const vstruct = require('varstruct')
// 24 hours
const BANDWIDTH_PERIOD = 86400;

const baseurl = "http://localhost:26657/"
// const baseurl = "http://fox.forest.network/"
const axios = require('axios')
const MIN_BLOCKHEIGHT_TEST = 0;


async function fetchTx(txhash, mblock) {
    const datahash = await axios.get(baseurl + `tx?hash=0x${txhash}`)
        .then(async res => res.data.result)
    if (datahash == undefined || datahash.tx_result.code === 1) {
        console.log('Error: ', datahash.tx_result.log)
        return;
    }
    const tx = decode(Buffer.from(datahash.tx, 'base64'));
    const txSize = Buffer.from(datahash.tx, 'base64').length;
    const req = {
        hash: datahash.hash,
        author: atob(datahash.tx_result.tags[0].value),
        type: tx.operation,
        data: Buffer.from(datahash.tx, 'base64'),
        createdAt: mblock.header.time,
    }

    var foundaccount = await accountapi.findByAddress(tx.account);
    var isUpdateAccount = false;
    if (foundaccount) { }
    else {
        foundaccount = await accountapi.create({
            address: tx.account,
            balance: 0,
            sequence: 0,
            bandwidth: 0,
        });
    }

    foundaccount.sequence = new Decimal(tx.sequence).toFixed();

    const diff = foundaccount.bandwidthTime ? moment().unix() - moment(foundaccount.bandwidthTime).unix() : BANDWIDTH_PERIOD;

    // 24 hours window max 65kB
    foundaccount.bandwidth = Math.ceil(Math.max(0, (BANDWIDTH_PERIOD - diff) / BANDWIDTH_PERIOD) * foundaccount.bandwidth + txSize);

    foundaccount.bandwidthTime = mblock.header.time;

    if (tx.operation === "create_account") {
        const { address } = tx.params;
        await accountapi.create({
            address,
            balance: 0,
            sequence: 0,
            bandwidth: 0,
        });
    }
    else if (tx.operation === "payment") {
        const { address, amount } = tx.params;
        foundaddress = await accountapi.findByAddress(address);
        foundaddress.balance = new Decimal(foundaddress.balance).add(amount).toFixed();
        foundaccount.balance = new Decimal(foundaccount.balance).sub(amount).toFixed();
        await foundaddress.save();
        if (global.userid[foundaddress.address])
            global.io.to(global.userid[foundaddress.address]).emit("update_account", foundaddress);
    }
    else if (tx.operation === "update_account") {
        isUpdateAccount = true;
        switch (tx.params.key) {
            case "name":
                foundaccount.name = Buffer.from(tx.params.value).toString('utf8');
                break;
            case "picture":
                foundaccount.picture = tx.params.value;
                break;
            case "followings":
                const Followings = vstruct([
                    { name: 'addresses', type: vstruct.VarArray(vstruct.UInt16BE, vstruct.Buffer(35)) },
                ]);
                const followings = Followings.decode(tx.params.value).addresses.map(address => {
                    return base32.encode(address);
                })
                if (followings)
                    foundaccount.followings = followings;
                break;
            default:
                isUpdateAccount = false;
                break;
        }
    }
    else if (tx.operation === "interact") {
        const objecthash = tx.params.object;
        var content = null;
        try {
            content = PlainTextContent.decode(tx.params.content);
        }
        catch (err) {
        }
        if (content) {
            await transactionapi.addComment({ objecthash, type: 'comment', txhash });
            if (global.commentid[objecthash]) {
            }
            global.io.to(global.commentid[objecthash]).emit("newcomment", objecthash);
        }
        else {
            try {
                content = ReactContent.decode(tx.params.content);
            }
            catch (err) {
            }
            if (content) {
                var foundobject = await transactionapi.findByPk(objecthash);
                if (foundobject.reacts) {
                    var foundindex = null;
                    var reacts = foundobject.reacts;
                    await asyncForEach(reacts, async (reacthash, index) => {
                        const foundreact = await transactionapi.findByPk(reacthash);
                        if (foundreact.author === tx.account)
                            foundindex = index;
                    });
                    if (foundindex !== null) {
                        reacts.splice(foundindex, 1);
                        if (content.reaction)
                            reacts.push(txhash);
                    }
                    else if (content.reaction)
                        reacts.push(txhash);
                    foundobject.reacts = reacts;
                }
                else if (content.reaction)
                    foundobject.reacts = [txhash];
                await foundobject.save();
            }
        }
    }
    await foundaccount.save();
    if (global.userid[foundaccount.address]) {
        const updatesequence = {
            balance: foundaccount.balance,
            sequence: foundaccount.sequence,
            bandwidth: foundaccount.bandwidth,
            bandwidthTime: foundaccount.bandwidthTime,
        }
        global.io.to(global.userid[foundaccount.address]).emit("update_sequence", updatesequence);
        if (isUpdateAccount) {
            global.io.to(global.userid[foundaccount.address]).emit("update_account", isUpdateAccount);
        }
    }
    await transactionapi.create(req);
    if (tx.operation === "post") {
        Object.entries(global.newsfeedid).forEach(
            ([key, value]) => {
                global.io.to(value).emit("newpost", "newpost");
            }
        );
    }
}
const app = {
    async isFetchDone() {
        const inforurl = baseurl + 'abci_info';
        const nodemaxheight = await axios.get(inforurl)
            .then(res => res.data.result.response.last_block_height)
        const latestBlock = await blockapi.getlast();
        return (latestBlock) ? Number(nodemaxheight) <= Number(latestBlock.height) : false;
    },
    async fetchblock() {
        const latestBlock = await blockapi.getlast();
        let minHeight = MIN_BLOCKHEIGHT_TEST;
        if (latestBlock)
            minHeight = (Number(latestBlock.height) >= minHeight) ? Number(latestBlock.height) + 1 : minHeight;
        const maxHeight = minHeight + 19;
        let blocklist = await axios.get(baseurl + `blockchain?minHeight=${minHeight}&maxHeight=${maxHeight}`)
            .then(res => res.data.result ? res.data.result.block_metas.reverse() : []);

        await asyncForEach(blocklist, async (mblock) => {
            let req = {
                height: mblock.header.height,
                time: mblock.header.time,
                hash: mblock.block_id.hash,
                appHash: mblock.header.app_hash
            }
            await blockapi.create(req);
            if (mblock.header.num_txs === "0")
                return;
            else if (mblock.header.num_txs === "1") {
                fetchTx(mblock.header.data_hash, mblock);
            }
            else {
                const txs = await axios.get(baseurl + `block?height=${Number(mblock.header.height)}`)
                    .then(async res => res.data.result.block.data.txs);
                await asyncForEach(txs, async (base64tx) => {
                    const tx = decode(Buffer.from(base64tx, 'base64'));
                    tx.hash = hash(tx);
                    fetchTx(tx.hash, mblock);
                })
            }
        });

    }
}
module.exports = {
    app
}
