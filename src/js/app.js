App = {

    contracts: {},
    web3Provider: null,
    tokenPrice: 0,
    tokenSold: 0,
    tokensAvailable: 750000,
    loading: false,
    account : '0x0',

    init: () => {
        App.initWeb3();
    },

    initWeb3: function() {
        if (typeof web3 !== 'undefined') {
          App.web3Provider = window.ethereum;
          window.ethereum.enable();
          ethereum.autoRefreshOnNetworkChange = false; //silent warning
        } else {
          App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
          web3 = new Web3(App.web3Provider);
        }
        return App.initContracts();
      },

      initContracts: () => {
        $.getJSON('../dTokenSale.json', (dTokenSale) => {
            App.contracts.dTokenSale = TruffleContract(dTokenSale);
            App.contracts.dTokenSale.setProvider(App.web3Provider);
            App.contracts.dTokenSale.deployed().then((instance)=>{
                console.log("dTokenSale Address: ", instance.address);
            });
          }).done(()=>{
            $.getJSON("dToken.json", (dToken)=>{
              App.contracts.dToken = TruffleContract(dToken);
              App.contracts.dToken.setProvider(App.web3Provider);
              App.contracts.dToken.deployed().then((instance)=>{
              console.log("dToken Address: ", instance.address);
              });
              App.listenForEvents();
              return App.render();     
            });
          });  
      },

      listenForEvents: () => {
        App.contracts.dTokenSale.deployed().then((instance) => {
          instance.Sell({}, {fromBlock:0, toBlock:'lattest'} 
        ).watch((err, event) => {
            console.log("event triggered with txHash: ", event.transactionHash);
            App.render();
          });
        });
      },
      
      render: () => {
        if(App.loading){
          return;
        }

        var loader = $("#loader");
        var content = $("#content");
        var dTokenSaleInstance;
        loader.show();
        content.hide();

        App.loading = true; 
        web3.eth.getCoinbase((err, account) => {
          if(!err){
            App.account = account;
            console.log("account address: ", App.account);
            $('#accountAddress').html(`Your account: ${App.account}`);
          }
        });

        App.contracts.dTokenSale.deployed().then((instance)=>{
          dTokenSaleInstance = instance;
          return dTokenSaleInstance.tokenPrice();
        }).then((price) => {
          App.tokenPrice = web3.fromWei(price.toNumber(), "ether");
          console.log("Price: ", App.tokenPrice);
          $('.toke-price').html(App.tokenPrice);
          return dTokenSaleInstance.tokenSold();
        }).then((tokenSold) => {
          App.tokenSold = tokenSold.toNumber();
          $(".token-sold").html(App.tokenSold);
          $(".token-available").html(App.tokensAvailable);
          var progressPercent = App.tokenSold / App.tokensAvailable * 100;
          $('#progress').css('width', progressPercent + "%");
          var dTokenInstance;
          App.contracts.dToken.deployed().then((instance)=>{
            dTokenInstance = instance;
            return dTokenInstance.balanceOf(App.account);
          }).then((balance)=>{
            $(".dapp-balance").html(balance.toNumber());
            App.loading = false;
            loader.hide();
            content.show();
          });
        })
        
      },

      buyTokens: function() {
        $('#content').hide();
        $('#loader').show();
        var numberOfTokens = $('#noOfTokens').val();
        App.contracts.dTokenSale.deployed().then(function(instance) {
          return instance.buyTokens(numberOfTokens, {
            from: App.account,
            value: web3.toWei(numberOfTokens * App.tokenPrice, "ether"),
            gas: 500000 // Gas limit
          });
        }).then(function(result) {
          console.log("Tokens bought...")
          $('form').trigger('reset') // reset number of tokens in form
          // Wait for Sell event
        });
      },
}

$(() => {
    $(window).load(() => {
        App.init();
    });
});