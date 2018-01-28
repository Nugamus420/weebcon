(function(window){
"use strict";

var JSON=window.JSON,ls=window.localStorage||{'getItem':function(){},'setItem':function(){}};

var LStorage = function LStorage(id, defaults){
	this.id = id;
	this.disabled = {};
	this.data = JSON.parse(ls.getItem(id) || JSON.stringify(defaults));
	for(var x in defaults) if (!(x in this.data)) this.data[x] = defaults[x];
};

LStorage.prototype.get = function LStorage$get(id){
	return this.data[id];
};

LStorage.prototype.set = function LStorage$set(id, value){
	this.data[id] = value;
	return this;
};

LStorage.prototype.save = function LStorage$save(){
	ls.setItem(this.id, JSON.stringify(this.data));
	return this;
};

LStorage.prototype.bind = function LStorage$bind(id, obj, f){
	var _this = this,
		listener = function listener(){
			if(id in _this.disabled) return;
			// XXX: determine the best order
			_this.data[id] = obj.value;
			_this.save();
			if((typeof f) === 'function') f.call(obj, obj.value);
		};
	if(obj instanceof window.jQuery) obj = obj[0];
	obj.value = this.data[id];
	obj.addEventListener('blur', listener);
	obj.addEventListener('change', listener);
	if((typeof f) === 'function') f.call(obj, obj.value);
};

LStorage.get = function LStorage_get(id, defaults){
	return new LStorage(id, defaults);
};

window.LStorage = LStorage;

})(this);
