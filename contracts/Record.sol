pragma solidity >=0.4.22 <0.8.0;

contract Record {
    // Model a Record
    struct dataRecord {
        string id;
        string name;
        string place;
        string severity;
        string Hash;
        string Date;
    }

    // Read/write Candidates
    mapping(uint => dataRecord) public recordMap;

    // Store Candidates Count
    uint public recordsCount = 0;

    // ...
    constructor() public{}

    function addRecord (string memory _id ,string memory _name, string memory _place,string memory _severity,string memory _Hash, string memory _Date) public {
        recordsCount ++;
        recordMap[recordsCount] = dataRecord(_id, _name, _place, _severity, _Hash, _Date);
    }
    
    function updateSeverity(uint _id, string memory _severity) public {
        dataRecord memory newRecord = recordMap[_id];
        newRecord.severity = _severity;
        recordMap[_id] = newRecord;
    }

    function getRecord (uint _id ) view public returns(string memory, string memory, string memory, string memory, string memory) {
        return(
                recordMap[_id].name,
                recordMap[_id].place,
                recordMap[_id].severity,
                recordMap[_id].Date,
                recordMap[_id].Hash
            );
    }
    
    
}