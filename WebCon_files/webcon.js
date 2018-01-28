jQuery(function($){

// slightly faster
var abs = Math.abs;

var Storage = window.LStorage,
	Deferred = $.Deferred.bind($),
	WebSocket = window.WebSocket || null;

if(!WebSocket){
	alert("This browser does not support websocket... :(");
	return;
}

var option = Storage.get('tools.webcon.option', {
	'remote-addr': 'localhost',
	'remote-port': 53235,
	'input-type': 'sdvx-big',
	'scratch-max-idle-ds': 2,
	'scratch-max-idle-s': 12
});

/*
option.data['scratch-max-idle-ds'] = 2;
option.data['scratch-max-idle-s'] = 12;
option.save();
*/

var SMIDS = 0|option.data['scratch-max-idle-ds'],
	SMIS = 0|option.data['scratch-max-idle-s'];

var inputData = {
	'sdvx-big': [
		{'type':'rect', 'x':46.5, 'y':10, 'w':7, 'h':10, 'v':'\x0A', 't':"", 'c':'green'},
		{'type':'swipeh', 'x':0, 'y':0, 'w':46, 'h':35, 'v':'QW', 't':"VOL L", 'c':'#33A'},
		{'type':'swipeh', 'x':54, 'y':0, 'w':46, 'h':35, 'v':'OP', 't':"VOL R", 'c':'#A33'},
		{'type':'rect', 'x':0.25, 'y':36, 'w':24.5, 'h':35, 'v':'S', 't':"BT-A", 'c':'white'},
		{'type':'rect', 'x':25.25, 'y':36, 'w':24.5, 'h':35, 'v':'D', 't':"BT-B", 'c':'white'},
		{'type':'rect', 'x':50.25, 'y':36, 'w':24.5, 'h':35, 'v':'K', 't':"BT-C", 'c':'white'},
		{'type':'rect', 'x':75.25, 'y':36, 'w':24.5, 'h':35, 'v':'L', 't':"BT-D", 'c':'white'},
		{'type':'rect', 'x':0.25, 'y':72, 'w':49.5, 'h':27.5, 'v':'X', 't':"FX-L", 'c':'orange'},
		{'type':'rect', 'x':50.25, 'y':72, 'w':49.5, 'h':27.5, 'v':'M', 't':"FX-R", 'c':'orange'}
	],
	'iidx-big': [
		{'type':'rect', 'x':90, 'y':3, 'w':7, 'h':10, 'v':'1', 't':"SC", 'c':'green'},
		{'type':'swipev', 'x':1, 'y':10, 'w':20, 'h':85, 'v':'\x11\x10', 't':"", 'c':'gray'},
		{'type':'rect', 'x':23, 'y':60, 'w':20, 'h':35, 'v':'S', 't':"", 'c':'white'},
		{'type':'rect', 'x':30.5, 'y':20, 'w':20, 'h':38, 'v':'D', 't':"", 'c':'black'},
		{'type':'rect', 'x':44, 'y':60, 'w':16, 'h':35, 'v':'F', 't':"", 'c':'white'},
		{'type':'rect', 'x':51.5, 'y':20, 'w':18, 'h':38, 'v':' ', 't':"", 'c':'black'},
		{'type':'rect', 'x':61, 'y':60, 'w':16, 'h':35, 'v':'J', 't':"", 'c':'white'},
		{'type':'rect', 'x':70.5, 'y':20, 'w':20, 'h':38, 'v':'K', 't':"", 'c':'black'},
		{'type':'rect', 'x':78, 'y':60, 'w':20, 'h':35, 'v':'L', 't':"", 'c':'white'}
	],
	'iidx-btn': [
		{'type':'rect', 'x':1850/197, 'y':8200/148, 'w':2800/197, 'h':4600/148, 'v':'S', 't':"", 'c':'white'},
		{'type':'rect', 'x':4050/197, 'y':2000/148, 'w':2800/197, 'h':4600/148, 'v':'D', 't':"", 'c':'black'},
		{'type':'rect', 'x':6250/197, 'y':8200/148, 'w':2800/197, 'h':4600/148, 'v':'F', 't':"", 'c':'white'},
		{'type':'rect', 'x':8450/197, 'y':2000/148, 'w':2800/197, 'h':4600/148, 'v':' ', 't':"", 'c':'black'},
		{'type':'rect', 'x':10650/197, 'y':8200/148, 'w':2800/197, 'h':4600/148, 'v':'J', 't':"", 'c':'white'},
		{'type':'rect', 'x':12850/197, 'y':2000/148, 'w':2800/197, 'h':4600/148, 'v':'K', 't':"", 'c':'black'},
		{'type':'rect', 'x':15050/197, 'y':8200/148, 'w':2800/197, 'h':4600/148, 'v':'L', 't':"", 'c':'white'},
	]
};

if(!(option.data['input-type'] in inputData)){
	option.data['input-type'] = Object.keys(inputData)[0];
	option.save();
}

var $buttons = $('#buttons');

var connector = new function Connector(){
	var _this = this;
	
	this.uri = "";
	this.ws = null;
	this.connect = function Connector$connect(addr, port) {
		this.uri = "ws://"+addr+":"+port;
		return Deferred(function(defer){
			_this.ws = new WebSocket(_this.uri);
			_this.ws.onerror = function(e){
				_this.uri = "";
				_this.ws = null;
				defer.reject();
			};
			_this.ws.onopen = function(e){
				defer.resolve();
			};
		});
	};

	this.send = function Connector$send(data){
		this.ws && this.ws.send(data);
	};
};

option.bind('remote-addr', $('#in-remote-ip'));

$('#btn-connect').click(function beginConnect(){
	var remoteAddr = $('#in-remote-ip').val();
	if(!remoteAddr) return;

	$("#btn-connect, #in-remote-ip").attr('disabled', true);

	connector.connect(remoteAddr, 53235).done(function(){
		$('#toolbar').hide();
		connector.ws.onclose = function(){
			$('#toolbar').show();
			$("#btn-connect, #in-remote-ip").removeAttr('disabled');
		};
	}).fail(function(){
		$("#btn-connect, #in-remote-ip").removeAttr('disabled');
	});
});

var changedTouchCoordX = function changedTouchCoordX(elem, ev){
	var i, x, d=0, c=0;
	for(var i=ev.changedTouches.length; i-->0;){
		x = ev.changedTouches[i];
		if(x.target == elem){
			c++; d += x.clientX;
		}
	}
	return d/c;
};

// Not reusing code on purpose
var changedTouchCoordY = function changedTouchCoordY(elem, ev){
	var i, x, d=0, c=0;
	for(var i=ev.changedTouches.length; i-->0;){
		x = ev.changedTouches[i];
		if(x.target == elem){
			c++; d += x.clientY;
		}
	}
	return d/c;
};

var applyInputType = function applyInputType(type){
	$buttons.empty();
	inputData[type].forEach(function(con, ind){
		var $con = $("<div class='con'></div>").attr('id', 'con'+ind),
			_con = $con[0], ob, od, ou, ods, ous, oe, id=0, pd=0, ps=0;
		$con.addClass('con-'+con.type).text(con.t);
		$con.css({'left':con.x+'%','top':con.y+'%','width':con.w+'%','height':con.h+'%','background-color':con.c});
		$buttons.append($con);
		switch(con.type){
			case 'swipeh':
				ods = '1'+con.v[1];
				ous = '1'+con.v[0];
				od = ods+'0'+con.v[0];
				ou = ous+'0'+con.v[1];
				oe = '0'+con.v[0]+'0'+con.v[1];
				_con.addEventListener('touchstart', function(e){
					id = pd = changedTouchCoordX(_con, e);
					ps = false;
				});
				_con.addEventListener('touchmove', function(e){
					var s, d = changedTouchCoordX(_con, e);
					var dd = abs(pd-d);
					if(d == pd) return;
					s = (d > pd);
					if(s == ps){
						if(dd > SMIDS) connector.send(s?ods:ous);
						pd = d; return;
					}
					if(dd <= SMIDS && abs(id-d) <= SMIS){
						pd = d; return;
					}
					var t=Math.abs(id-d)%10;
					connector.send(s?od:ou);
					if(ps) id = pd;
					pd = d;
					ps = s;
				});
				_con.addEventListener('touchend', connector.send.bind(connector, oe));
				break;
			case 'swipev':
				ods = '1'+con.v[1];
				ous = '1'+con.v[0];
				od = ods+'0'+con.v[0];
				ou = ous+'0'+con.v[1];
				oe = '0'+con.v[0]+'0'+con.v[1];
				_con.addEventListener('touchstart', function(e){
					id = pd = changedTouchCoordY(_con, e);
					ps = false;
				});
				_con.addEventListener('touchmove', function(e){
					var s, d = changedTouchCoordY(_con, e);
					var dd = abs(pd-d);
					if(d == pd) return;
					s = (d > pd);
					if(s == ps){
						if(dd > SMIDS) connector.send(s?ods:ous);
						pd = d; return;
					}
					if(dd <= SMIDS && abs(id-d) <= SMIS){
						pd = d; return;
					}
					connector.send(s?od:ou);
					if(ps) id = pd;
					pd = d;
					ps = s;
				});
				_con.addEventListener('touchend', connector.send.bind(connector, oe));
				break;
			case 'rect':
			default:
				// TODO: reduce using jQuery
				ob = '1'+con.v; oe = '0'+con.v;
				_con.addEventListener('touchstart', function(){
					connector.send(ob);
					$con.addClass('con-active');
				});
				_con.addEventListener('touchend', function(){
					connector.send(oe);
					$con.removeClass('con-active');
				});
		}
	});
};

applyInputType(option.data['input-type']);

option.bind('input-type', $('#in-input-type'), function(val){
	applyInputType(val);
});

document.addEventListener('touchstart', function(e){
	var en, f = !!connector.ws;
	if(!f){
		en = e.target.nodeName.toUpperCase();
		f = en == 'DIV' || en == 'BODY';
	}
	f && e.preventDefault();
	return !f;
});

});

