/* -*- coding: utf-8 -*- */

var {HostBuff} = require('./buffer.js');

class TermKeyEventsHandler{

    formatKeySeq(seq){
	var s = '';
	for(var i=0;i<seq.length;i++){
	    var c = seq[i];
	    if(typeof c == 'number'){
		s += String.fromCharCode(c);
	    }else if(typeof c == 'string'){
		s += c;
	    }
	}
	return s;
    }

    handle(e, comm){
	var ctrl = e.ctrlKey;
	// console.info((ctrl ? 'ctrl + ' : '') + e.keyCode);
	if(ctrl){
	    var ctrlSeq = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_';
	    var c = String.fromCharCode(e.keyCode);
	    var i = ctrlSeq.indexOf(c);
	    if(i >= 0){
		comm.sendKeyAll(i);
		e.preventDefault();
		return;
	    }
	}
	var BS = 8, TAB = 9, ESC = 27;
	switch(e.keyCode){
	case BS:
	    comm.sendKeyAll(BS);
	    e.preventDefault();
	    break;
	case TAB/* TAB */:
	    comm.sendKeyAll(TAB);
	    e.preventDefault();
	    break;
	case ESC/* ESC */:
	    comm.sendKeyAll(ESC);
	    e.preventDefault();
	    break;
	case 37/*left*/:
	    comm.sendAll(this.formatKeySeq([ESC, 'OD']));
	    e.preventDefault();
	    break;
	case 38/*up*/:
	    comm.sendAll(this.formatKeySeq([ESC, 'OA']));
	    e.preventDefault();
	    break;
	case 39/*right*/:
	    comm.sendAll(this.formatKeySeq([ESC, 'OC']));
	    e.preventDefault();
	    break;
	case 40/*bottom*/:
	    comm.sendAll(this.formatKeySeq([ESC, 'OB']));
	    e.preventDefault();
	    break;
	case 13:
	    comm.sendKeyAll(13);
	    break;
	case 10:
	    comm.sendKeyAll(10);
	    break;
	default:
	    if(e.key && e.key.length == 1){
		comm.sendAll(e.key);
		e.preventDefault();
	    }
	    // var code = e.keyCode;
	    // if(code >= ' '.charCodeAt(0)){
	    //     if(code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0)){
	    // 	if(!e.shiftKey){ code += 32; }
	    //     }
	    //     if(code < 0x7f){
	    // 	var t = String.fromCharCode(code);
	    // 	console.info(e.keyCode+': ' + code+', '+t);
	    // 	comm.sendKeyAll(code);
	    // 	e.preventDefault();
	    //     }
	    // }
	    break;
	}
	// console.info(e);
	// console.info(e.keyCode);
    }
    
}

class TextTerminal extends React.Component{

    constructor(props){
	super(props);
	this.state = {
	    inputBuffer: ''
	};
	this._scrollToEnd = this._scrollToEnd.bind(this);
	this._keyEventsHandler = new TermKeyEventsHandler();
    }

    componentDidUpdate(oldProps, oldState){
	setTimeout(this._scrollToEnd, 0);
    }

    componentWillReceiveProps(newProps){
	setTimeout(this._scrollToEnd, 0);
    }

    _scrollToEnd(){
	var el = ReactDOM.findDOMNode(this);
	if(!el){ return; }
	var div = el.querySelector('.lines');
	if(div){
	    div.scrollTop = div.scrollHeight;
	}
    }

    onKeyPress(e){
    }

    onInput(e){
	var {inputBuffer} = this.state;
	var {comm} = this.props;
	if(!comm){
	    return;
	}
	// console.info(typeof e.key, e.key);
	if(false && e.keyCode == 13){
	    comm.sendAll((inputBuffer || '') + '\r');
	    this.setState({inputBuffer: ''});
	}else{
	    this._keyEventsHandler.handle(e, comm);
	}
    }

    onInputChanged(e){
	this.setState({inputBuffer: e.target.value});
    }

    renderLines_Text(){
	var {buff} = this.props;
	return (<div className='lines'>
		{buff.getLines().map(function(line, i){
		    return (<pre key={i} className='line'>{line}</pre>);
		})}
		</div>);
    }

    renderLines_Canvas(){
	var {comm, buff, ptySize} = this.props;
	return (<CanvasTerminal buff={buff} comm={comm} ptySize={ptySize}/>);
    }

    renderLines(){
	return this.renderLines_Canvas();
    }

    render(){
	var {inputBuffer} = this.state;
	return (<div className='terminal terminal-text'>
		{this.renderLines()}
		<div className='line-input'>
		<input type='text' value={inputBuffer} size={80}
		onChange={this.onInputChanged.bind(this)}
		onKeyDown={this.onInput.bind(this)}
		onKeyPress={this.onKeyPress.bind(this)}/>
		</div>
		</div>);
    }
    
}

class CanvasTerminal extends React.Component{

    constructor(props){
	super(props);
	this.state = {
	    hasFocus: false
	};
	this._ctx = null;
	this._size = null;
	this._font = '14px consolas';
	this._emSize = this._calcEmSize();
	this._lineHeight = this._emSize * 2;
	this._keyEventsHandler = new TermKeyEventsHandler();
	this.colorTableBk = ['#111111',
			     '#660909',
			     '#097000',
			     '#999900',
			     '#000099',
			     '#7f0050',
			     '#097f7f',
			     '#999999'];
	this.colorTableFc = ['#7f7f7f',
			     '#ff3300',
			     '#03ff00',
			     '#ffff00',
			     '#0033ff',
			     '#ff00ff',
			     '#00ffff',
			     '#f0f0f0'];
        this.colorSelectionBk = '#0000e3';
        this.colorSelectionFc = '#f9f9f9';
    }

    _calcEmSize(){
	var c = document.createElement('canvas');
	c.width = 1;
	c.height = 1;
	document.body.appendChild(c);
	var ctx = c.getContext('2d');
	ctx.font = this._font;
	var size = ctx.measureText('A').width;
	document.body.removeChild(c);
	return size;
    }

    componentWillReceiveProps(newProps){
	this._updateCanvas();
    }

    componentDidUpdate(oldProps, oldState){
	this._updateCanvas();
    }

    componentDidMount(){
	this._initCanvas();
	this._updateCanvas();
    }

    componentWillUnmount(){
	this._cleanUp();
    }

    _cleanUp(){
	if(this._ctx){
	    this._ctx = null;
	}
    }

    _initCanvas(){
	if(this._ctx){ return; }
	var el = ReactDOM.findDOMNode(this);
	if(!el){ return; }
	var canvas = el.querySelector("canvas");
	if(!canvas){ return; }
	var ctx = canvas.getContext('2d');
	if(!ctx){ return; }
	this._ctx = ctx;
	var size = {w: canvas.width, h: canvas.height};
	this._size = size;
	// --
	ctx.fillStyle = this.colorTableBk[0];
	ctx.fillRect(0, 0, size.w, size.h);
	ctx.font = this._font;
	// --
	canvas.focus();
    }

    // _updateCanvasCursor(){
    // 	var {buff, ptySize} = this.props;
    // 	var {hasFocus} = this.state;
    // 	var ctx = this._ctx;
    // 	var size = this._size;
    // 	var lineHeight = this._lineHeight;
    // 	if(!ctx){ return; }

    // 	var tm = ctx.measureText('A');
    // 	var pad = {left: (size.w - tm.width * ptySize.w) / 2};
    // 	var defaultFcValue = this.colorTableFc.length - 1;
	
    // 	// visible offset
    // 	var offsetY = buff.getVisibleWindowOffset();
	
    // 	// draw cursor
    // 	var curPosY = buff.cursor.y - offsetY;
    // 	if(curPosY >= 0 && curPosY <= ptySize.h - 1){
    // 	    var curX = pad.left + buff.cursor.x * tm.width;
    // 	    var curY = curPosY * lineHeight + 3;
    // 	    var curColor = this.colorTableFc[hasFocus ? 2 : defaultFcValue];
    // 	    ctx.fillStyle = curColor;
    // 	    ctx.fillRect(curX, curY, tm.width, lineHeight);
    // 	}
    // }

    _updateCanvas(){
	var {buff, ptySize, keyboardEnabled} = this.props;
	var {hasFocus} = this.state;
	var ctx = this._ctx;
	var size = this._size;
	var lineHeight = this._lineHeight;
	if(!ctx){ return; }
	
	ctx.fillStyle = this.colorTableBk[0];
	ctx.fillRect(0, 0, size.w, size.h);
	var tm = ctx.measureText('A');
	var pad = {left: (size.w - tm.width * ptySize.w) / 2};
	var defaultFcValue = this.colorTableFc.length - 1;

	// visible offset
	var offsetY = buff.getVisibleWindowOffset();

	// cursor info
	var curPosY = buff.cursor.y - offsetY;
	
	// draw text lines
	var currentFcValue = defaultFcValue;
        ctx.fillStyle = this.colorTableFc[currentFcValue];
	for(var y=0;y<ptySize.h;y++){
	    var row = buff.text[y + offsetY];
	    if(typeof row == 'undefined'){
		continue;
	    }
	    var colorRow = buff.color[y + offsetY];
	    for(var x=0;x<ptySize.w;x++){
                var selected = buff.isInSelection(x, y);
                if(selected){ // && !(x == buff.cursor.x && y == curPosY)){
                    var _x = pad.left + x * tm.width;
                    var _y = y * lineHeight + 3;
                    ctx.fillStyle = this.colorSelectionBk;
                    ctx.fillRect(_x, _y, tm.width + 1, lineHeight + 1);
                    // ctx.fillStyle = this.colorTableFc[currentFcValue];
                }
		var fcValue = currentFcValue;
		if(typeof colorRow != 'undefined'){
		    if(typeof colorRow[x] != 'undefined'){
			var cVals = colorRow[x];
			var fcValue = cVals[1];
                        if(fcValue == -2){
                            fcValue = -2; // defaultFcValue;
			}else if(fcValue < 0){
			    fcValue = defaultFcValue;
			}else{
			    // if(fcValue >= 30){
			    //     fcValue -= 30;
			    // }
			    fcValue = fcValue % this.colorTableFc.length;
			}
			// console.info('=> ('+y+','+x+') '+cVals);
		    }
		}
                ctx.fillStyle = this.colorTableFc[fcValue];
                if(fcValue == -2){
                    ctx.fillStyle = '#ff00ff';
                    fcValue = defaultFcValue;
                }
		if(fcValue != currentFcValue){
		//     var fc = this.colorTableFc[fcValue];
		    currentFcValue = fcValue;
		}
                
		// --
		var c = row[x];
		if(typeof c == 'undefined'){
		    continue
		}
                if(selected){
                    ctx.fillStyle = this.colorSelectionFc;
                }
		ctx.fillText(c, pad.left + x*tm.width, (y+1)*lineHeight);
	    }
	}

        // draw cursor
        if(curPosY >= 0 && curPosY <= ptySize.h - 1){
	    var curX = pad.left + buff.cursor.x * tm.width;
	    var curY = curPosY * lineHeight + 3;
	    var curColor = this.colorTableFc[hasFocus ? 2 : defaultFcValue];
            if(keyboardEnabled){
	        ctx.fillStyle = curColor;
	        ctx.fillRect(curX, curY, tm.width + 1, lineHeight);
            }
	}
    }

    onMouseDown(e){
        if(!e || !e.nativeEvent){ return; }
        var {ptySize, buff} = this.props;
        e = e.nativeEvent;
        if(e.button != 0){ return; }
        var x = parseInt(Math.floor(e.offsetX / this._emSize));
        var y = parseInt(Math.floor(e.offsetY / this._lineHeight));
        buff.selectionUpdating = true;
        buff.setSelectionStart(x, y);
        this.forceUpdate();
        var {onSelect} = this.props;
        if(typeof onSelect == 'function'){
            onSelect(buff.getSelectedLength());
        }
    }

    onMouseMove(e){
        if(!e || !e.nativeEvent){ return; }
        var {ptySize, buff} = this.props;
        e = e.nativeEvent;
        var x = parseInt(Math.floor(e.offsetX / this._emSize));
        var y = parseInt(Math.floor(e.offsetY / this._lineHeight));
        if(buff.selectionUpdating){
            buff.setSelectionEnd(x, y);
            this.forceUpdate();
            var {onSelect} = this.props;
            if(typeof onSelect == 'function'){
                onSelect(buff.getSelectedLength());
            }
        }
    }

    onMouseUp(e){
        if(!e || !e.nativeEvent){ return; }
        var {ptySize, buff} = this.props;
        // e = e.nativeEvent;
        // var x = parseInt(Math.floor(e.offsetX / this._emSize));
        // var y = parseInt(Math.floor(e.offsetY / this._lineHeight));
        // buff.setSelectionEnd(x, y);
        buff.selectionUpdating = false;
    }

    onWheel(e){
	var d = e.deltaY / Math.abs(e.deltaY);
	var {buff} = this.props;
	buff.moveVisibleWindowByLines(d * 1);
	this.forceUpdate();
    }

    onInput(e){
	var {comm, buff, keyboardEnabled} = this.props;
	if(!comm){ return; }
        if(!keyboardEnabled){ return; }
	buff.resetVisibleWindow();
	this._keyEventsHandler.handle(e, comm);
    }

    onCanvasFocus(hasFocus, e){
	this.setState({hasFocus: hasFocus});
    }

    render(){
	var {ptySize, buff} = this.props;
	if(!ptySize){
	    return (<div>WARN: ptySize not specified.</div>);
	}
	var emSize = this._emSize;
	var lineHeight = this._lineHeight;
	var w = parseInt((ptySize.w + 1) * emSize);
	var h = parseInt((ptySize.h + 2) * lineHeight);
	return (<div className='terminal-canvas'>
		<canvas width={w} height={h}
		onWheel={this.onWheel.bind(this)}
		onFocus={this.onCanvasFocus.bind(this, true)}
		onBlur={this.onCanvasFocus.bind(this, false)}
		tabIndex={0}
		onKeyDown={this.onInput.bind(this)}
                onMouseDown={this.onMouseDown.bind(this)}
                onMouseMove={this.onMouseMove.bind(this)}
                onMouseUp={this.onMouseUp.bind(this)}></canvas>
		</div>);
    }
    
}

CanvasTerminal.defaultProps = {
    comm: null,
    buff: null,
    ptySize: null,
    keyboardEnabled: false,
    onSelect: null
};


module.exports.TextTerminal = TextTerminal;
module.exports.CanvasTerminal = CanvasTerminal;

