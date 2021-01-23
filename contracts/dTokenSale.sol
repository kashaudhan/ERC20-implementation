pragma solidity >=0.5.0 <0.8.0;

import "./dToken.sol";

contract dTokenSale{

    address payable admin;
    dToken public tokenContract;
    uint public tokenPrice;
    uint public tokenSold;
    address public contractAddress = address(this);
    event Sell(address _buyer, uint _amount);

    constructor(dToken _tokenContract, uint _tokenPrice) public{
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function _multiply(uint x, uint y) internal pure returns(uint z) {
        require(y==0 || (z = x * y) / y == x);
    }

    function buyTokens(uint _noOfTokens) public payable{
        require(msg.value == _multiply(_noOfTokens, tokenPrice));
        require(tokenContract.balanceOf(address(this)) >= _noOfTokens);
        require(tokenContract.transfer(msg.sender, _noOfTokens));

        tokenSold += _noOfTokens;

        emit Sell(msg.sender, _noOfTokens);
    }

    function endSale() public{
        require(msg.sender == admin);
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));
        //selfdestruct(admin);
    }
}