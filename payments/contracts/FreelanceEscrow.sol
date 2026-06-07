// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FreelanceEscrow {
    address public arbiter;

    struct Escrow {
        address client;
        address freelancer;
        uint256 amount;
        bool isFunded;
        bool isReleased;
        bool isRefunded;
    }

    mapping(string => Escrow) public escrows;

    event Deposited(string projectId, address client, uint256 amount);
    event Released(string projectId, address freelancer, uint256 amount);
    event Refunded(string projectId, address client, uint256 amount);

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only the AI arbiter can call this function");
        _;
    }

    constructor(address _arbiter) {
        require(_arbiter != address(0), "Arbiter address cannot be zero");
        arbiter = _arbiter;
    }

    function deposit(string memory projectId) public payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        
        Escrow storage escrow = escrows[projectId];
        require(!escrow.isFunded, "Escrow already funded for this project");

        escrow.client = msg.sender;
        escrow.amount = msg.value;
        escrow.isFunded = true;

        emit Deposited(projectId, msg.sender, msg.value);
    }

    // Set freelancer address later when they accept or when depositing
    function setFreelancer(string memory projectId, address _freelancer) public {
         Escrow storage escrow = escrows[projectId];
         require(escrow.isFunded, "Escrow not funded");
         require(msg.sender == escrow.client, "Only client can set freelancer");
         require(escrow.freelancer == address(0), "Freelancer already set");
         escrow.freelancer = _freelancer;
    }

    function release(string memory projectId, address _freelancer) public onlyArbiter {
        Escrow storage escrow = escrows[projectId];
        require(escrow.isFunded, "Escrow is not funded");
        require(!escrow.isReleased, "Funds already released");
        require(!escrow.isRefunded, "Funds already refunded");
        require(_freelancer != address(0), "Invalid freelancer address");

        escrow.isReleased = true;
        // In this flow, the arbiter defines who the freelancer is upon release
        escrow.freelancer = _freelancer; 

        uint256 amount = escrow.amount;
        
        (bool success, ) = _freelancer.call{value: amount}("");
        require(success, "Transfer failed");

        emit Released(projectId, _freelancer, amount);
    }

    function refund(string memory projectId) public onlyArbiter {
        Escrow storage escrow = escrows[projectId];
        require(escrow.isFunded, "Escrow is not funded");
        require(!escrow.isReleased, "Funds already released");
        require(!escrow.isRefunded, "Funds already refunded");

        escrow.isRefunded = true;
        uint256 amount = escrow.amount;
        address client = escrow.client;

        (bool success, ) = client.call{value: amount}("");
        require(success, "Refund failed");

        emit Refunded(projectId, client, amount);
    }

    function getEscrow(string memory projectId) public view returns (
        address client,
        address freelancer,
        uint256 amount,
        bool isFunded,
        bool isReleased,
        bool isRefunded
    ) {
        Escrow memory e = escrows[projectId];
        return (e.client, e.freelancer, e.amount, e.isFunded, e.isReleased, e.isRefunded);
    }
}
