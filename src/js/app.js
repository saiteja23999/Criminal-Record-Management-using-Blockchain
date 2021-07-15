App = {
  web3Provider: null,
  contracts: {},
  account:'0x0',
  imageString:null,
  id:null,

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Record.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Record = TruffleContract(AdoptionArtifact);
      // Set the provider for our contract
      App.contracts.Record.setProvider(App.web3Provider);      
    });
    return App.render();
  },

  render: function() {
    // Load account data
     web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
      }
      console.log(account);
    });
    document.getElementById('Validity').style.visibility='hidden'
    const fileSelector = document.getElementById('formimage');
    fileSelector.addEventListener('change', (event) => {
      let reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = function () {
        App.imageString = reader.result;
      }.bind(this);
      reader.onerror = function (error) {
        console.log("Error: ", error);
      };
    });
  },

  addrecord :function()
  {
    var adoptionInstance;
    var count;
    var Hash;
    var name = document.getElementById("formname").value;
    var id = document.getElementById("formid").value;
    var place = document.getElementById("formplace").value;
    var severity = document.getElementById("formseverity").value;
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy;
    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];
      if (error) {
        console.log(error);
      }
      $.ajax({
        url: "http://127.0.0.1:5000/Hash", 
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({'image':App.imageString}),
        success: function( data ) {
            alert( "Hash Computed success");
            Hash = data["Hash"];
        }
      }).then(function(){
        App.contracts.Record.deployed().then(function(instance) {
          adoptionInstance = instance;
          return adoptionInstance.addRecord(id,name,place,severity,Hash,today, {from: account});
        }).then(function() {
          App.contracts.Record.deployed().then(function(instance) {
            var electionInstance = instance;
            return electionInstance.recordsCount();
          }).then(function(candidatesCount) {
            count = candidatesCount['c'][0];
            $.ajax({
              url: "http://127.0.0.1:5000/addRecord", 
              type: "POST",
              contentType: "application/json",
              data: JSON.stringify({'rid': count, 'name': name,'pid':id,'image':App.imageString }),
              success: function( data ) {
                alert( "Record Added" );
              }
            });
          });
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    });
  },
  
  getrecord : async function(){
    var fname = document.getElementById("fname").value;
    var fid = document.getElementById("fid").value;
    await $.post( "http://127.0.0.1:5000/getRecord", { inputVar: fid, inputname: fname })
    .done(function( data ) {
      App.id = data;
    }).done(function(temp){
      var records = $("#displayRecords");
      records.empty();
      App.recursive(0,records);
    });
  },

  recursive : function(index, records){
    App.contracts.Record.deployed().then(async function(instance) {
      adoptionInstance = instance;
      return adoptionInstance.getRecord(parseInt(App.id[index]));
    }).then(async function(result) {
      var place = result[1];
      var severity = result[2];
      var date = result[3];
      var Template = "<tr><th scope='row'>" + App.id[index] + "</th><td>" + date +"</td><td>" + place + "</td><td>" + severity + "</td></tr>";
      records.append(Template);
    }).then(function(){
      index+=1;
      if(index < App.id.length)
      {
        App.recursive(index, records);
      }
    }).catch(async function(err) {
      console.log(err.message);
    });
  },

  searchHim : function(){
    var fname = document.getElementById("fname").value;
    var pid = document.getElementById("fid").value;
    var rid= document.getElementById("rid").value;
    $.ajax({
      url: "http://127.0.0.1:5000/Send", 
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({'pid': pid, 'name':fname, 'rid':rid}),
      success: function( data ) { 
        alert( "succesfully Make Him Wanted" );
      }   
  });
  },

  getImage : function(){
    var fname = document.getElementById("fname").value;
    var pid = document.getElementById("fid").value;
    var rid= document.getElementById("rid").value;
    var rimage= document.getElementById("rimage");
    var cHash="";
    rimage.src="";
    document.getElementById('Validity').style.visibility='hidden';
    App.contracts.Record.deployed().then(async function(instance) {
      adoptionInstance = instance;
      return adoptionInstance.getRecord(parseInt(rid));
    }).then(function(result) {
      var test = document.getElementById("rDate")
      test.value = result[3];
      var test = document.getElementById("rSeverity")
      test.value = result[2];
      var test = document.getElementById("rPlace")
      test.value = result[1];
      cHash= result[4];
    }).then(function(){
      $.ajax({
        url: "http://127.0.0.1:5000/Image", 
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({'pid': pid, 'name':fname, 'rid':rid}),
        success: function( data ) { 
          rimage.src = data.Image;
          if(cHash == data.Hash)
          {
            document.getElementById('Validity').style.visibility='visible'
          }
        }
    });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});