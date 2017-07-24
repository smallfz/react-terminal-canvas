/* -*- coding: utf-8 -*- */

var HostBuff = function(){

    window.currentHostBuff = this;

    this.ptySize = {w: 80, h: 30};

    this.setPtySize = function(w, h){
	this.ptySize.w = w;
	this.ptySize.h = h;
	if(this.scrollMargin.bottom > h-1){
	    this.scrollMargin.bottom = h-1;
	}
    };

    this.buff = [];

    this.text = {};
    this.color = {};
    this.cursor = {x: 0, y: 0};

    this.scrollMargin = {top: this.ptySize.h * -4, bottom: this.ptySize.h-1};

    this.visibleWindowOffset = 0;

    this.moveVisibleWindowByLines = function(y){
	var ptySize = this.ptySize;
	var offsetY = this.visibleWindowOffset + y;
	if(offsetY > ptySize.h - 1){
	    offsetY = ptySize.h - 1;
	}
	this.visibleWindowOffset = offsetY;
    };

    this.resetVisibleWindow = function(){
	this.visibleWindowOffset = 0;
    };

    this.getVisibleWindowOffset = function(){
	return this.visibleWindowOffset;
    };

    this._decrKeys = function(d){
	var keys = [];
	for(var k in d){ keys.push(parseInt(k)); }
	keys = keys.sort(function(a, b){ return a-b; });
	for(var i=0;i<keys.length;i++){
	    var k = keys[i];
	    if(typeof d[k] != 'undefined'){
		if(k > this.scrollMargin.top && k <= this.scrollMargin.bottom){
		    if(k-1 >= this.ptySize.h * -4){
			d[k-1] = d[k];
		    }
		    delete d[k];
		}
	    }
	}
    };

    this._incrKeys = function(d){
	var keys = [];
	for(var k in d){ keys.push(parseInt(k)); }
	keys = keys.sort(function(a, b){ return b-a; });
	for(var i=0;i<keys.length;i++){
	    var k = keys[i];
	    if(typeof d[k] != 'undefined'){
		if(k >= this.scrollMargin.top && k < this.scrollMargin.bottom){
		    if(k+1 < this.ptySize.h){
			d[k+1] = d[k];
		    }
		    delete d[k];
		}
	    }
	}
    };

    this._setScrollMargin = function(y1, y2){
	var ptySize = this.ptySize;
	if(y1 > 0){
	    for(var y=0;y<y1;y++){
		// this._clearLine(y);
	    }
	}
	if(y2 < ptySize.h - 1){
	    for(var y=y2+1; y<ptySize.h; y++){
		// this._decrKeys(this.text);
		// this._decrKeys(this.color);
		// this._clearLine(y);
	    }
	}
	if(y1 == 0 && y2 == ptySize.h - 1){
	    // treat this as a reset
	    this.scrollMargin.top = ptySize.h * -4;
	    this.scrollMargin.bottom = ptySize.h - 1;
	}else{
	    this.scrollMargin.top = y1;
	    this.scrollMargin.bottom = y2;
	}
    };

    this._newLine = function(){
	var ptySize = this.ptySize;
	var cur = this.cursor;
	var scrollMargin = this.scrollMargin;
	if(cur.y < ptySize.h - 1 && cur.y < scrollMargin.bottom){
	    cur.y ++;
	}else{
	    this._decrKeys(this.text);
	    this._decrKeys(this.color);
	}
    };

    this._moveUpLine = function(){
	this._incrKeys(this.text);
	this._incrKeys(this.color);
    };

    this._backspace = function(cnt){
	var ptySize = this.ptySize;
	var cur = this.cursor;
	while(cnt -- > 0){
	    var row = this.text[cur.y];
	    var colorRow = this.color[cur.y];
	    if(cur.x > 0){
		cur.x --;
	    }else{
		cur.x = ptySize.w - 1;
		cur.y --;
	    }
	    // if(typeof row != 'undefined'){
	    // 	if(typeof row[cur.x] != 'undefined'){
	    // 	    delete row[cur.x];
	    // 	}
	    // }
	    // if(typeof colorRow != 'undefined'){
	    // 	if(typeof colorRow[cur.x] != 'undefined'){
	    // 	    delete colorRow[cur.x];
	    // 	}
	    // }
	}
    };

    this._clearTextAfterCur = function(y, x){
	var ptySize = this.ptySize;
	for(var y1=y;y1<ptySize.h;y1++){
	    var row = this.text[y1];
	    if(typeof row == 'undefined'){
		continue;
	    }
	    var colorRow = this.color[y1];
	    for(var x1=y1==y?x:0; x1<ptySize.w; x1++){
		if(typeof row[x1] != 'undefined'){
		    delete row[x1];
		}
		if(typeof colorRow != 'undefined'){
		    if(colorRow[x1] != 'undefined'){
			delete colorRow[x1];
		    }
		}
	    }
	}
    };

    this._clearLineAfterCur = function(y, x){
	var ptySize = this.ptySize;
	var row = this.text[y];
	if(typeof row == 'undefined'){
	    return;
	}
	var colorRow = this.color[y];
	for(var x1=x; x1<ptySize.w; x1++){
	    if(typeof row[x1] != 'undefined'){
		delete row[x1];
	    }
	    if(typeof colorRow != 'undefined'){
		if(colorRow[x1] != 'undefined'){
		    delete colorRow[x1];
		}
	    }
	}
    };

    this._clearLine = function(y){
	var ptySize = this.ptySize;
	var row = this.text[y];
	var colorRow = this.color[y];
	for(var x=0;x<ptySize.w;x++){
	    if(typeof row != 'undefined'){
		if(typeof row[x] != 'undefined'){
		    delete row[x];
		}
	    }
	    if(typeof colorRow != 'undefined'){
		if(colorRow[x] != 'undefined'){
		    delete colorRow[x];
		}
	    }
	}
    };

    this._setText = function(y, x, c){
        if(typeof this.text[y] == 'undefined'){
	    this.text[y] = {};
	}
	this.text[y][x] = c;
    };

    this._setColor = function(y, x, bk, fc){
	var ptySize = this.ptySize;
	if(typeof this.color[y] == 'undefined'){
	    this.color[y] = {};
	}
	this.color[y][x] = [bk, fc];
    };

    this._moveCurOneStep = function(){
        var ptySize = this.ptySize;
        var cur = this.cursor;
        if(cur.x < ptySize.w - 1){
	    cur.x ++;
	}else{
	    this._newLine();
	    cur.x = 0;
	}
    };

    this._tailData = '';
    this._tailDataTimer = null;

    this._handleTailData = function(){
	if(this._tailData){
	    this.virtualRender('', false);
	}
    };

    this.virtualRender = function(data, keepTailData){
	keepTailData = typeof keepTailData == 'boolean' ? keepTailData : true;
	if(this._tailData){
	    if(this._tailDataTimer){
		clearTimeout(this._tailDataTimer);
		this._tailDataTimer = null;
	    }
	    // console.info('tail data unshift:', this._tailData);
	    data = this._tailData + data;
	    this._tailData = '';
	}
	window.lastBlock = data;
	var ptySize = this.ptySize;
	var cur = this.cursor;
        // this._setText(cur.y, cur.x, '#');
        // this._setColor(cur.y, cur.x, -2, -2);
        // this._moveCurOneStep();
	for(var i=0;i<data.length;i++){
	    var c = data.substring(i, i+1);
	    var code = c.charCodeAt(0);
	    // switch(c){
	    // case '\r': this._newLine(); cur.x = 0; continue;
	    // case '\n': cur.x = 0; continue;
	    // }
	    if(code == 7){
		// bell!
		continue;
	    }else if(code == 8){
		// BS
		this._backspace(1);
		continue;
	    }else if(code == 10){
		// LF
		this._newLine();
		cur.x = 0;
		continue;
	    }else if(code == 13){
		// CR
		cur.x = 0;
		continue;
	    }else if(code == 27 /* ESC */){
                // this._setText(cur.y, cur.x, 'E');
                // this._setColor(cur.y, cur.x, -2, -2);
                // this._moveCurOneStep();
		var seq = data.substring(i+1, i+1+10);

		if(/^\[((\d*)(\;(\d*))?)?m/.test(seq)){
		    var m = /^\[((\d*)(\;(\d*))?)?m/.exec(seq);
		    if(!m[1]){
			// reset color
			this._setColor(cur.y, cur.x, -1, -1);
			// console.warn('('+cur.y+', '+cur.x+') reset color');
		    }else{
			var bk, fc;
			if(!m[4]){
			    // if(parseInt(m[1]) == 0){
			    // 	bk = fc = -1;
			    // }else{
			    // 	bk = fc = parseInt(m[1]);
			    // }
			    bk = -1;
			    fc = -1;
			}else{
			    bk = parseInt(m[2] || '-1');
			    fc = parseInt(m[4] || '-1');
			}
			this._setColor(cur.y, cur.x, bk, fc);
			// console.info('('+cur.y+', '+cur.x+') fc=' + fc);
		    }
		    i += m[0].length;
		    
		}else if(/^\[(\d*)([ABCD])/.test(seq)){
		    var m = /^\[(\d*)([ABCD])/.exec(seq);
		    var j = parseInt(m[1] || '1');
		    var dir = m[2];
		    switch(dir){
		    case 'A':
			if(cur.y > 0){
			    cur.y -= j;
			}
			break;
		    case 'B':
			if(cur.y < ptySize.h -1){
			    cur.y += j ;
			}
			break;
		    case 'C':
			if(cur.x < ptySize.w-1){
			    cur.x += j;
			}
			break;
		    case 'D':
			if(cur.x > 0){
			    cur.x -= j;
			}
			break;
		    }
		    i += m[0].length;
		    
		}else if(/^\[((\d+)\;(\d+))?H/.test(seq)){
		    // Cursor position
		    var m = /^\[((\d+)\;(\d+))?H/.exec(seq);
		    var py = m[2] || '1', px = m[3] || '1';
		    py = parseInt(py) - 1;
		    cur.y = py;
		    px = parseInt(px) - 1;
		    cur.x = px;
		    i += m[0].length;

		}else if(/^M/.test(seq)){
		    this._moveUpLine();
		    i += 1;
		    
		}else if(/^\[(\d*)([JO])/.test(seq)){
		    // Earse display
		    var m = /^\[(\d*)([JO])/.exec(seq);
		    var j = parseInt(m[1] || '0');
		    var op = m[2];
		    if(j == 0){
			this._clearTextAfterCur(cur.y, cur.x);
		    }else if(j == 1){
			// clear to the beginning, not implemented yet.
		    }else if(j == 2){
			this._clearTextAfterCur(0, 0);
		    }
		    i += m[0].length;
		    
		}else if(/^\[(\d*)K/.test(seq)){
		    var m = /^\[(\d*)K/.exec(seq);
		    var j = parseInt(m[1] || '0');
		    if(j == 0){
			this._clearLineAfterCur(cur.y, cur.x);
		    }else if(j == 2){
			this._clearLineAfterCur(cur.y, 0);
		    }
		    i += m[0].length;
		    
		}else if(/^\[\?\d*[lh]/.test(seq)){
		    // hide/show cursor
		    var m = /^\[\?\d*[lh]/.exec(seq);
		    i += m[0].length;
		    
		}else if(/^\[(\d+)\;(\d+)r/.exec(seq)){
		    var m = /^\[(\d+)\;(\d+)r/.exec(seq);
		    var y1 = parseInt(m[1] || '1') - 1;
		    var y2 = parseInt(m[2] || '1') - 1;
		    this._setScrollMargin(y1, y2);
		    i += m[0].length;
		    
		}else{
		    // unhandled ESC sequence:
		    // hold the buff, wait for more data
		    var tailData = data.substring(i, data.length);
		    if(tailData.length <= 8 && keepTailData){
			this._tailData = tailData;
			this._tailDataTimer = setTimeout(this._handleTailData.bind(this), 500);
			return;
		    }
		}
		continue;
	    }
	    if(typeof this.text[cur.y] == 'undefined'){
		this.text[cur.y] = {};
	    }
	    this.text[cur.y][cur.x] = c;
	    // move cursor to next position
            this._moveCurOneStep();
	}
    };

    this.write = this.append;

    this.append = function(data){
	this.virtualRender(data);
	var lastLine = this.buff.pop();
	if(typeof lastLine == 'string'){
	    data = lastLine + data;
	}
	var ptySize = this.ptySize;
	var lines = data.split(/\r/g);
	var _lines = lines.reduce(function(l, line){
	    if(line.length > ptySize.w){
		for(var i=0;i<line.length;i+=ptySize.w){
		    var piece = line.substring(i, i+ptySize.w);
		    if(piece.length > 0){
			piece = piece.replace(/\n/g, '');
			l.push(piece);
		    }
		}
	    }else{
		line = line.replace(/\n/g, '');
		l.push(line);
	    }
	    return l;
	}, []);
	for(var i=0;i<_lines.length;i++){
	    this.buff.push(_lines[i]);
	}
	if(this.buff.length > 100){
	    this.buff.shift();
	}
    };

    this.selectionUpdating = false;

    this.selection = {
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 0
    };

    this.setSelectionStart = function(x, y){
        var offsetY = this.getVisibleWindowOffset();
        this.selection.x0 = x;
        this.selection.y0 = y + offsetY;
        this.selection.x1 = x;
        this.selection.y1 = y + offsetY;
    };
    
    this.setSelectionEnd = function(x, y){
        var offsetY = this.getVisibleWindowOffset();
        this.selection.x1 = x;
        this.selection.y1 = y + offsetY;
    };

    this.clearSelection = function(){
        this.selectionUpdating = false;
        this.selection.x0 = 0;
        this.selection.y0 = 0;
        this.selection.x1 = 0;
        this.selection.y1 = 0;
    };

    this.isInSelection = function(x, y){
        if(!this.selection){ return false; }
        var offsetY = this.getVisibleWindowOffset();
        var {w, h} = this.ptySize;
        var {x0, y0, x1, y1} = this.selection;
        var i0 = y0 * w + x0;
        var i1 = y1 * w + x1;
        var i = (y+offsetY) * w + x;
        // console.info(i0+', '+i1+'. '+ i);
        return (i >= i0 && i < i1) || (i >= i1 && i < i0);
    };

    this.getSelectedLength = function(){
        if(!this.selection){ return 0; }
        var offsetY = this.getVisibleWindowOffset();
        var {w, h} = this.ptySize;
        var {x0, y0, x1, y1} = this.selection;
        var i0 = y0 * w + x0;
        var i1 = y1 * w + x1;
        var len = Math.abs(i0 - i1);
        return len;
    };

    this.getSelectedText = function(){
        var offsetY = this.getVisibleWindowOffset();
        var {w, h} = this.ptySize;
        var {x0, y0, x1, y1} = this.selection;
        // y0 += offsetY;
        // y1 += offsetY;
        var _x0 = Math.min(x0, x1);
        var _y0 = Math.min(y0, y1);
        var _x1 = Math.max(x0, x1);
        var _y1 = Math.max(y0, y1);
        if(_y1 == _y0){
            var t = '';
            var line = this.text[_y0];
            if(typeof line != 'undefined'){
                // console.info(_y0, _x0, _x1);
                for(var x=_x0;x<_x1;x++){
                    var c = line[x];
                    t += typeof c == 'string' ? c : ' ';
                }
            }
            return t;
        }else{
            var t = '';
            for(var y=_y0;y<=_y1;y++){
                var ss, se, crlf;
                if(y ==_y0){
                    ss = _x0;
                    se = w;
                    crlf = true;
                    // t += this.buff[y].substring(_x0) + '\r\n';
                }else if(y == _y1){
                    ss = 0;
                    se = _x1;
                    crlf = false;
                    // t += this.buff[y].substring(0, _x1);
                }else{
                    // t += this.buff[y] + '\r\n';
                    ss = 0;
                    se = w;
                    crlf = true;
                }
                var line = this.text[y];
                if(typeof line != 'undefined'){
                    for(var x=ss;x<se;x++){
                        var c = line[x];
                        t += typeof c == 'string' ? c : ' ';
                    }
                }
                if(crlf){
                    t += '\r\n';
                }
            }
            return t;
        }
    };

    this.getLines = function(){
	return this.buff;
    };
    
};

module.exports.HostBuff = HostBuff;

// window.HostBuff = HostBuff;
