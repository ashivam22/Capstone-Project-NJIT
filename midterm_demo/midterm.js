/*********************************************
*npm package requirements:
*cap, to capture packets on network
*express, web server backend
*isset, to check if a variable is set
*fuzzy, to handle the 'fuzzy' rule
**********************************************/
var Cap = require('cap').Cap;
var decoders = require('cap').decoders;
var PROTOCOL = decoders.PROTOCOL;
var express = require('express');
var path=require('path');
var isset=require('isset');
var fuzzy=require('fuzzy');

var app=express();

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

app.get('/',function(req,res){
	var c = new Cap();
	var device = Cap.findDevice(String(req.query.ip));
	var filter = 'port '+req.query.port;
	var bufSize = 10 * 1024 * 1024;
	var buffer = Buffer.alloc(65535);
	var linkType = c.open(device, filter, bufSize, buffer);
	c.setMinBytes && c.setMinBytes(0);
	
	console.log('IP Address is: '+req.query.ip);
	console.log('Port is: '+req.query.port);
	console.log();
	
	var rules=[
		{rule:'Contains', ruleOn:isset(req.query.contains), testString:req.query.contains},
		{rule:'Starts with', ruleOn:isset(req.query.starts), testString:req.query.starts},
		{rule:'Ends with', ruleOn:isset(req.query.ends), testString:req.query.ends},
		{rule:'Doesn\'t contain', ruleOn:isset(req.query.d_contains), testString:req.query.d_contains},
		{rule:'Doesn\'t start with', ruleOn:isset(req.query.d_starts), testString:req.query.d_starts},
		{rule:'Doesn\'t end with', ruleOn:isset(req.query.d_ends), testString:req.query.d_ends}, 
		{rule:'Fuzzy', ruleOn:isset(req.query.fuzzy), testString:req.query.fuzzy}
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
					if(doRules(contents, rules)){
						if(contents!==''){
							console.log('Packet received that meets specified rules:');
							console.log(contents);
							console.log();
						}
					}
				}
				else if(ret.info.protocol===PROTOCOL.IP.UDP){
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