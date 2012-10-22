// module for rendering HTML chess boards

define(['jquery'], function() {
    var $t = {};
    
    // general board functions
    $t.fen2pieces = function(fen) {
        var ret = [];
        var a = 0; // keeps track of square ID
        for(var i=0; i<fen.length; i++){
			if (fen[i].match(/[A-Z]/i)){
				// a piece
				var piece = "";
				if (fen[i].match(/[A-Z]/)){
					// white piece
					piece = "w";
				}else if(fen[i].match(/[a-z]/)){
					// black piece
					piece = "b";
				}
				piece += fen[i].toLowerCase();
				// add to return array
				var col = a%8;
				var row = Math.floor(a/8);
				ret[ ((7-row)*8)+col ] = piece;
				a++;
			}else if(fen[i].match(/[0-9]/)){
				// a space
				a += parseInt(fen[i]);
			}
		}
		return ret;
    };
    
    // convert a square string to ID number (eg. a2)
    $t.squaretoID = function(sq) {
        if (sq.length != 2) return;
        
        sq = sq.toUpperCase();
        
        var col = sq.charCodeAt(0) - 65;
        var row = parseInt(sq[1]) - 1;
        
        if ( (row < 8) && (row >= 0) && (col < 8) && (col >= 0) ) {
            return (row * 8) + col;
        }
        
        return;
    };
    
    $t.pieceHTML = function(piece, square) {
        return "<div id='piece_"+square+"' class='piece "+(piece[0])+"piece' name='"+square+"'>"+
                    "<img id='img_"+square+"' name='"+piece+"' src='images/sets/1/64/"+piece+".png' />"+
                "</div>";
    };
    
    var funcs = {
        // flip board over
        flip: function() {
            // literally just reverse the list of squares
            var ul = this.body.find(".board");
            ul.children().each(function(i,li){ul.prepend(li)})
        },
        // draw board, return HTML of board
        drawHTML: function() {
            // check the object has a pieces array
            if (!this.pieces) this.pieces = [];
            
            // basic board holder
            var html = "<ul class='board'>";
            
            // create board layout
            for(var y=0; y<8; y++){
                for(var x=0; x<8; x++){
                    // work out square ID
                    var id;
                    if ( (this.player==='w') ) {
                        // "forward" board
                        id = ((7-y)*8)+x;
                    } else {
                        // "reversed" board
                        id = (y*8)+(7-x);
                    }
                    
                    var piece = "";
                    if (this.pieces[id]) {
                        piece = $t.pieceHTML(this.pieces[id], id);
                    }
                    
                    html += "<li id='sq_"+id+"' name='"+id+"' class='square "+(((y+x)%2===0)?"light":"dark")+"'>"+piece+"</li>";
                }
            }
            html += "</ul>";
            
            // return
            return html;
        },
        draw: function() {
            // fetch raw HTML of board and save jQuery object
            this.body.html(this.drawHTML());
            
            this.addDrags();
            this.addClicks();
            this.addHovers();
            
            return this.body;
        },
        html: function() {
            return this.body;
        },
        // load FEN notation
        fen: function(fen) {
            this.pieces = $t.fen2pieces(fen);
            
            // return this for chaining
            return this;
        },
        // take a chess.js object and extract possible moves
        chessjstoposmoves: function(c) {
            // get full moves list from chess object
            var moves = c.moves({verbose: true});
            
            var m = [];
            for(var ii=0; ii<moves.length; ii++) {
                var s = $t.squaretoID(moves[ii].from);
                if (!m[s]) m[s] = [];
                m[s].push($t.squaretoID(moves[ii].to));
            }
            
            this.pos_moves = m;
        },
        addClicks: function(){
            var that = this;
            
            if (this.move==this.player){
                this.body.find("."+this.move+"piece").delay(200).click(function(){
                    var sq = $(this).attr("name");
                    // only actually do anything if there are legal moves
                    if (typeof(that.pos_moves[sq])!="undefined"){
                        that.last_piece = this;
                        
                        // add piece click too (for non-dragging interfaces)
                        that.body.find("#sq_"+$(this).attr("name")).addClass("poss");
                        that.body.find('.piece').unbind('click').unbind('mousedown').unbind('mouseup');
                        
                        that.removeHovers();
                        that.removeDrags();
                        
                        var reset = function() {
                            that.draw();
                        };
                        
                        // clicking again removes all this
                        $(this).mouseup(function() {
                            reset();
                        });
                        
                        that.body.find(".square").mouseup(function(){
                            if (!$(this).hasClass("legal")) reset();
                        });
                        
                        // add event handlers to possible choices
                        // grab list of legal moves
                        var moves = that.pos_moves[sq];
                        
                        // loop through and set clickable events to possible squares
                        for(var i=0; i<moves.length; i++){
                            that.body.find("#sq_"+moves[i]).data("move", {"from": sq, "to":moves[i]});
                            that.body.find("#sq_"+moves[i]).mousedown(function(){
                                // commit move
                                var mov = $(this).data("move");
                                that.makeMove(mov.from, mov.to);
                                
                                // add new piece
                                var piece = $("#img_"+mov.from).attr("name");
                                $(this).html($t.pieceHTML(piece, mov.to));
                                
                                // delete original piece
                                that.body.find(that.last_piece).remove();
                                
                                // reset board
                                that.removeClicks();
                                that.removeHovers();
                                that.removeDrags();
                                
                            }).addClass("legal").removeClass("poss").hover(function(){
                                // hover over
                                $(this).removeClass("legal").addClass("hover");
                            },function(){
                                $(this).removeClass("hover").addClass("legal");
                            });
                        }
                    }else{
                        // TODO - maybe show a message saying it's impossible!
                    }
                });
            }
        },
        removeClicks: function(){
            this.body.find(".square").removeClass("poss").removeClass("take").removeClass("legal").removeClass("hover").unbind('mouseenter mouseleave');
            this.body.find('.square').unbind('click').unbind('mousedown').unbind('mouseup');
            this.body.find('.piece').unbind('click').unbind('mousedown').unbind('mouseup');
            this.addHovers();
            this.addDrags();
        },
        addDrags: function(){
            var that = this;
            
            if (this.move==this.player){
                that.body.find("."+((this.move=="w")?"b":"w")+"piece").draggable({
                    distance: 9000
                });
                
                that.body.find("."+this.move+"piece").draggable({
                    distance: 20,
                    revert: "invalid",
                    revertDuration: 50,
                    containment: that.body.find("ul"),
                    stop: function(e){
                        // remove droppable binds
                        var p_moves = that.pos_moves[$(this).attr("name")];
                        for(var i=0; i<p_moves.length; i++){
                            that.body.find("#sq_"+p_moves[i]).droppable("destroy");
                        }
                        
                        that.addHovers();
                        that.addDrags();
                    },
                    start: function() {
                        // fix z-index so dragged floats above
                        that.body.find(".piece").css("z-index", 2);
                        $(this).css("z-index", '99');
                        
                        // remove location highlights (in case of rare bug)
                        that.body.find(".square").removeClass("legal").removeClass("hover").removeClass("poss").removeClass("ui-droppable");
                        
                        // remove hovers
                        that.removeHovers();
                        
                        // add droppable handlers for accepted squares
                        var sq = $(this).attr("name");
                        if (typeof(that.pos_moves[sq])!="undefined"){
                            // grab list of legal moves
                            var p_moves = that.pos_moves[sq];
                            
                            // loop through and set as droppable areas
                            for(var i=0; i<p_moves.length; i++){
                                var sq_class = (that.body.find("#piece_"+p_moves[i]).length>0)?"take":"legal";
                                that.body.find("#sq_"+p_moves[i]).data("move", {"from": sq, "to":p_moves[i]});
                                
                                that.body.find("#sq_"+p_moves[i]).droppable({
                                    accept: ".piece",
                                    activeClass: sq_class,
                                    hoverClass: "hover",
                                    drop: function( event, ui ){
                                        // commit move
                                        var mov = $(this).data("move");
                                        that.makeMove(mov.from, mov.to);
                                        
                                        // build new
                                        var piece = $("#img_"+mov.from).attr("name");
                                        
                                        // delete old piece
                                        $(event.srcElement.parentNode).remove();
                                        
                                        // add new piece
                                        $(this).html($t.pieceHTML(piece, mov.to));
                                        
                                        // remove draggable and hover event handlers to tidy up UI
                                        that.removeClicks();
                                        that.removeDrags();
                                        that.removeHovers();
                                    }
                                });
                            }
                        }
                    }
                });
            }else{
                // not player's turn, make everything non-draggable
                that.body.find(".piece").draggable({
                    distance: 9000
                });
            }
        },
        removeDrags: function(){
            this.body.find(".piece").draggable({
                distance: 9000
            });
        },
        addHovers: function(){
            if (this.move==this.player) this.addHover("."+this.move+"piece");
        },
        addHover: function(p){
            var that = this;
            
            if (this.move==this.player){
                that.body.find(p).hover(function(){
                    // hover over piece
                    var sq = $(this).attr("name");
                    
                    if (typeof(that.pos_moves[sq])!="undefined"){
                        // only highlight if piece has legal moves
                        $(this).addClass("legal");
                        
                        var moves = that.pos_moves[sq];
                        
                        // loop through and set as droppable areas
                        for(var i=0; i<moves.length; i++){
                            that.body.find("#sq_"+moves[i]).addClass((that.body.find("#piece_"+moves[i]).length===0)?"poss":"take");
                        }
                    }
                },function(){
                    // hover out piece
                    $(this).removeClass("legal");
                    that.body.find(".square").removeClass("poss").removeClass("take");
                });
            }
        },
        removeHovers: function(){
            $(".piece").unbind('mouseenter mouseleave').removeClass("legal");
        },
        makeMove: function(from, to) {
            // change player
            this.move = (this.move == "w")?"b":"w";
            
            // TODO - execute hooks
            
            // redraw board when all callback
        }
    };
    
    $t.create = function(fen) {
        // new board object
        var b = {
            move: 'w', // who's move
            player: 'b', // who is playing? w/b/s (spectator)
            pos_moves: [],
            hooks: {}, // store board hooks
            body: $("<div>")
        };
        
        // clone functions to this object
        for(var ii in funcs) {
            b[ii] = funcs[ii];
        }
        
        // load fen if supplied
        if (fen) {
            b.fen(fen);
        }
        
        // setup initial board view
        b.draw();
        
        return b;
    };
    
    return $t;
});