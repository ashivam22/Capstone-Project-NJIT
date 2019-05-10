/*********************************************
*npm package requirements:
*cap, to capture packets on network
*express, web server backend
*body-parser, to handle the post body
*isset, to check if a variable is set
*fuzzy, to handle the 'fuzzy' rule
*child_process, to run the external file
**********************************************/
var Cap = require('cap').Cap;
var decoders = require('cap').decoders;
var PROTOCOL = decoders.PROTOCOL;
var express = require('express');
var bodyParser=require('body-parser');
var isset=require('isset');
var fuzzy=require('fuzzy');
const {exec}=require('child_process');

var app=express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

function doRules(caseString, ruleMass){
	var rulesSatisfied = true;
	for(var i=0; i<ruleMass.length; i++){
		if(!ruleMass[i]['ruleOn']){
			continue;
		}else{
			switch(ruleMass[i]['rule']){
				case 'Contains':
					if(!caseString.includes(ruleMass[i]['testString'])){
						rulesSatisfied = false;
					}break;
				case 'Starts with':
					if(!caseString.startsWith(ruleMass[i]['testString'])){
						rulesSatisfied = false;
					}break;
				case 'Ends with':
					if(!caseString.endsWith(ruleMass[i]['testString'])){
						rulesSatisfied = false;
					}break;
				case 'Doesn\'t contain':
					if(caseString.includes(ruleMass[i]['testString'])){
						rulesSatisfied = false;
					}break;
				case 'Doesn\'t start with':
					if(caseString.startsWith(ruleMass[i]['testString'])){
						rulesSatisfied=false;
					}break;
				case 'Doesn\'t end with':
					if(caseString.endsWith(ruleMass[i]['testString'])){
						rulesSatisfied = false; 
					}break;
				case 'Fuzzy':
					var splitCase = caseString.split(' ');
					var results = fuzzy.filter(ruleMass[i]['testString'], splitCase);
					var matches = results.map(function(el){
						return el.string;
					});
					if(matches===null){
						rulesSatisfied = false;
						break;
					}
			}
			if(!rulesSatisfied){
				return rulesSatisfied;
			}
		}
	}
	return rulesSatisfied;
}

function getParams(input){
	var temp='';
	var inSplit = input.split('\n');
	for(var i=0; i<inSplit.length; i++){
		if((inSplit[i]).startsWith('HTTP/')){
			temp=inSplit[i].substring(9,12);
		}
	}
	return [temp];
}

function executeFile(fileName, parameters){
    var pass='';
    if(parameters.length>0){
        for(var i=0; i<parameters.length; i++){
            pass+=parameters[i]+' ';
        }
    }
    var toExec=('node '+fileName+' '+pass).trim();
    exec(toExec, (err, stdout, stderr)=> {
        if(err){
            console.error(`exec error: ${err}`);
            return;
        }
        console.log(`${stdout}`);
    });
}
console.log('Listener is running...');
app.use(function(req,res){
	var c = new Cap();
	var device = Cap.findDevice(String(req.body.ip));
	var filter = 'port '+req.body.port;
	var bufSize = 10 * 1024 * 1024;
	var buffer = Buffer.alloc(65535);
	var linkType = c.open(device, filter, bufSize, buffer);
	c.setMinBytes && c.setMinBytes(0);
	
	console.log('IP Address is: '+req.body.ip);
	console.log('Port is: '+req.body.port);
	console.log();
	
	var rules=[
		{rule:'Contains', ruleOn:isset(req.body.contains), testString:req.body.contains},
		{rule:'Starts with', ruleOn:isset(req.body.starts), testString:req.body.starts},
		{rule:'Ends with', ruleOn:isset(req.body.ends), testString:req.body.ends},
		{rule:'Doesn\'t contain', ruleOn:isset(req.body.d_contains), testString:req.body.d_contains},
		{rule:'Doesn\'t start with', ruleOn:isset(req.body.d_starts), testString:req.body.d_starts},
		{rule:'Doesn\'t end with', ruleOn:isset(req.body.d_ends), testString:req.body.d_ends}, 
		{rule:'Fuzzy', ruleOn:isset(req.body.fuzzy), testString:req.body.fuzzy}
	];
	var aRule=false;
	console.log('Rules to capture:')
	for (var i=0; i<rules.length; i++){
		if(rules[i]['ruleOn']===true){
			console.log(rules[i]['rule']+': '+rules[i]['testString']);
			aRule=true;
		}
	}
	if(!aRule){
		console.log('No rules specified.');
	}
	console.log();
	var fileName = req.body.FileToRun;
	console.log('File to execute: '+fileName+'\n');
	console.log('------------------------------------------------------------------\n');
	var found=false;
	c.on('packet', function(nbytes, trunc) {
		if (linkType==='ETHERNET'){
			var ret = decoders.Ethernet(buffer);
			if(ret.info.type === PROTOCOL.ETHERNET.IPV4){
				ret = decoders.IPV4(buffer, ret.offset);
				if(ret.info.protocol===PROTOCOL.IP.TCP){
					var datalen = ret.info.totallen - ret.hdrlen;
					ret = decoders.TCP(buffer, ret.offset);
					datalen -= ret.hdrlen;
					var contents=buffer.toString('binary', ret.offset, ret.offset+datalen);
					let cpcon=contents;
					if(doRules(contents, rules)){
						if(contents!==''){
							console.log('Packet received that meets specified rules:\n');
							console.log(contents+'\n');
							console.log('------------------------------------------------------------------\n');
							var params=getParams(cpcon);
							console.log('Now executing external file...\n');
							executeFile(fileName, params);
							found=true;
						}
					}
				}
				/*else if(ret.info.protocol===PROTOCOL.IP.UDP){
					ret = decoders.UDP(buffer, ret.offset);
					var contents=buffer.toString('binary', ret.offset, ret.offset+ret.info.length);
					if(doRules(contents, rules)){
						if(contents!==''){
							console.log('Packet received that meets specified rules:');
							console.log(contents);
							console.log();
						}
					}
				}
				*/
				else
					console.log('Unsupported IPv4 protocol: '+PROTOCOL.IP[ret.info.protocol]);
			}
			else
				console.log('Unsupported Ethertype: '+PROTOCOL.ETHERNET[ret.info.type]);
		}
	});
	
	res.send('Please  see command prompt for results');
});

app.listen(4910);