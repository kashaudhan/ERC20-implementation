var dToken = artifacts.require("./dToken.sol");

contract("dToken", (accounts) => {
    var tokenInstance;
    it("set total supply to 1000 ,000", ()=>{
        return dToken.deployed().then((instance)=>{
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then((totalSupply) => {
            assert.equal(totalSupply.toNumber(), 1000000, 'set the totalSupply to 1M');
            return tokenInstance.balanceOf(accounts[0]);
        }).then((balance) => {
            assert.equal(balance.toNumber(), 1000000, 'balance allocated');
        });
    });

    it('initialize contract with correct value', ()=>{
        return dToken.deployed().then((instance)=>{
            tokenInstance = instance;
            return tokenInstance.name();
        }).then((name)=>{
            assert.equal(name, "dToken", "has correct name");
            return tokenInstance.symbol();
        }).then((symbol) => {
            assert.equal(symbol, "DTK", "has correct symbol");
            return tokenInstance.standard();
        }).then((standard)=>{
            assert.equal(standard, "dToken v1.0.0", "has correct standard");
        })
    });

    it('transfer token ownership', ()=>{
        return dToken.deployed().then((instance)=>{
            tokenInstance = instance;
            return tokenInstance.transfer.call(accounts[1], 99999999999);
        }).then(assert.fail).catch((error)=>{
            assert(error.message.indexOf('revert') >= 0, 'error msg must contain revert');
            return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
        }).then((success)=>{
            assert.equal(success, true, "it returns true");
            return tokenInstance.transfer(accounts[1], 250000, {from: accounts[0]});
        })
        .then((receipt)=>{
            assert.equal(receipt.logs.length, 1, 'triggers 1 event');
            assert.equal(receipt.logs[0].event, "Transfer", "Transfer event triggered");
            assert.equal(receipt.logs[0].args._from, accounts[0], "transfered to accounts[0]");
            assert.equal(receipt.logs[0].args._to, accounts[1], "transfered to accounts[1]");
            assert.equal(receipt.logs[0].args._value, 250000, "logs transfer amount");
            return tokenInstance.balanceOf(accounts[1]);
        }).then((balance)=>{
            assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiver account');
            return tokenInstance.balanceOf(accounts[0]);
        }).then((balance)=>{
            assert.equal(balance.toNumber(), 750000, 'amount deducted form sender account');
        });
    });

    it("approve delegated transfer", ()=>{
        return dToken.deployed().then((instance)=>{
            tokenInstance = instance;
            return tokenInstance.approve.call(accounts[1], 100);
        }).then((success)=>{
            assert.equal(success, true, "approved transfer");
            return tokenInstance.approve(accounts[1], 100, {from:accounts[0]});
        }).then((receipt)=>{
            assert.equal(receipt.logs.length, 1, 'triggers 1 event');
            assert.equal(receipt.logs[0].event, "Approval", "Approval event triggered");
            assert.equal(receipt.logs[0].args._owner, accounts[0], "transfered to accounts[0]");
            assert.equal(receipt.logs[0].args._spender, accounts[1], "transfered to accounts[1]");
            assert.equal(receipt.logs[0].args._value, 100, "logs transfer amount");
            return tokenInstance.allowance(accounts[0], accounts[1]);
        }).then((allowance)=>{
            assert.equal(allowance.toNumber(), 100, "stores allowance for delegated transfer");
        })
    })
    var fromAcc;
    var toAcc ;
    var spenderAcc;

    it('handles transferFrom', ()=>{
        return dToken.deployed().then((instance)=>{
            tokenInstance = instance;
            fromAcc = accounts[2];
            toAcc = accounts[3];
            spenderAcc = accounts[4];
            return tokenInstance.transfer(fromAcc, 100, {from: accounts[0]});
        }).then((receipt) =>{
            return tokenInstance.approve(spenderAcc, 10, {from :fromAcc});
        }).then((receipt)=>{
            return tokenInstance.transferFrom(fromAcc, toAcc, 999, {from: spenderAcc});
        }).then(assert.fail).catch((error)=>{
            assert(error.message.indexOf('revert')>=0, "msg does not contain revert");
            return tokenInstance.transferFrom(fromAcc, toAcc, 20, {from: spenderAcc});
        }).then(assert.fail).catch((error)=>{
            assert(error.message.indexOf('revert') >= 0, 'error msg must contain revert');
            return tokenInstance.transferFrom.call(fromAcc, toAcc, 10, {from: spenderAcc});
        }).then((success)=>{
            assert.equal(success, true, "expected true");
            return tokenInstance.transferFrom(fromAcc, toAcc, 10, {from: spenderAcc});
        }).then((receipt)=>{
            assert.equal(receipt.logs.length, 1, 'triggers 1 event');
            assert.equal(receipt.logs[0].event, "Transfer", "Transfer event triggered");
            assert.equal(receipt.logs[0].args._from, fromAcc, "transfered to accounts[0]");
            assert.equal(receipt.logs[0].args._to, toAcc, "transfered to accounts[1]");
            assert.equal(receipt.logs[0].args._value, 10, "logs transfer amount");
            return tokenInstance.balanceOf(fromAcc);
        }).then((balance)=>{
            assert.equal(balance.toNumber(), 90, "balance in fromAcc");
            return tokenInstance.balanceOf(toAcc);
        }).then((balance)=>{
            assert.equal(balance, 10, "balance in toAcc");
            return tokenInstance.allowance(fromAcc, spenderAcc);
        }).then((allowance)=>{
            assert.equal(allowance, 0, "deduct amount from the allowance")
        });
    })
});