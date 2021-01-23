const dTokenSale = artifacts.require("./dTokenSale.sol");
const dToken = artifacts.require("./dToken.sol");

contract('dTokenSale', (accounts)=>{
    var tokenSaleInstance;
    var tokenInstance;
    var tokenPrice = 1000000000000000;
    var buyer = accounts[1];
    var admin = accounts[0];
    var tokensAvailable = 750000;
    var noOfToken;
    it("initialize the dTokenSale contract", ()=>{
        return dTokenSale.deployed().then((instance)=>{
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then((address)=>{
            assert.notEqual(address, 0x0, "has contract address");
            return tokenSaleInstance.tokenContract();
        }).then((tokenContract)=>{
            assert.notEqual(tokenContract, 0x0, "has a token contract");
            return tokenSaleInstance.tokenPrice();
        }).then((price)=>{
            assert.equal(price, tokenPrice, "token price is correct");
        });
    });

    it("facilitate token buying", ()=>{
        return dToken.deployed().then((instance)=>{
            tokenInstance = instance;
            return dTokenSale.deployed();
        }).then((instance)=>{
            tokenSaleInstance = instance;
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {from: admin});
        }).then((receipt)=>{
            noOfToken = 10;
            return tokenSaleInstance.buyTokens(noOfToken, {from: buyer, value: noOfToken * tokenPrice})
        }).then((receipt)=>{
            assert.equal(receipt.logs.length, 1, 'triggers 1 event');
            assert.equal(receipt.logs[0].event, "Sell", "Sell event triggered");
            assert.equal(receipt.logs[0].args._buyer, buyer, "transfered to the buyer");
            assert.equal(receipt.logs[0].args._amount, noOfToken, "logs transfer amount");
            return tokenSaleInstance.tokenSold();
        }).then((amount)=>{
            assert.equal(amount.toNumber(), noOfToken, "increment tokens sold");
            return tokenInstance.balanceOf(buyer);
        }).then((amount)=>{
            assert.equal(amount, noOfToken, "correct balance of buyer");
            return tokenSaleInstance.balanceOf(tokenSaleInstance.address);
        }).then((amount)=>{
            assert.equal(amount.toNumber(), tokensAvailable - noOfToken, "token balance correct");
            return tokenSaleInstance.buyTokens(noOfToken, {from: buyer, value: 1});
        }).then(assert.fail).catch((error)=>{
            assert(error.message.indexOf('revert')>=0, "msg.value must be equal to no of tokens in wei");
            return tokenSaleInstance.buyTokens(800000, {from: buyer, value: noOfToken * tokenPrice});
        }).then(assert.fail).catch((error)=>{
            assert(error.message.indexOf('revert')>=0, "buy amount must be less than available amount");
        
        })
    })

    it("ends token sale", ()=>{
        return dToken.deployed().then((instance)=>{
            //
            tokenInstance = instance;
            return dTokenSale.deployed();
        }).then((instance)=>{
            //
            tokenSaleInstance = instance;
            //
            return tokenSaleInstance.endSale({from: buyer});
        }).then(assert.fail).catch((error)=>{
            assert(error.message.indexOf('revert')>=0, "must be admin");
            //
            return tokenSaleInstance.endSale({from: admin}); 
        }).then((receipt)=>{
            return tokenInstance.balanceOf(admin);
        }).then((balance)=>{
            //
            assert.equal(balance.toNumber(), 1000000, "return all unsold balance to admin");
            //
            return tokenSaleInstance.tokenPrice();
        }).then((price)=>{
            assert.equal(price, 0, "token price was reset");
        });
    })
});
