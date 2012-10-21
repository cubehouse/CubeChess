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
    
    var funcs = {
        // flip board over
        flip: function() {
            this.flipped = !this.flipped;
            this.draw();
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
                    if ( (this.player==='w') && (!this.flipped) ) {
                        // "forward" board
                        id = ((7-y)*8)+x;
                    } else {
                        // "reversed" board
                        id = (y*8)+(7-x);
                    }
                    
                    var piece = "";
                    if (this.pieces[id]) {
                        piece = "<div id='piece_"+id+"' class='piece "+(this.pieces[id][0])+"piece' name='"+id+"'>"+
                                    "<img id='img_"+id+"' name='"+this.pieces[id]+"' src='images/sets/1/64/"+this.pieces[id]+".png' />"+
                                "</div>";
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
            this.body = $(this.drawHTML());
            
            // TODO - add hooks etc.
            
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
        }
    };
    
    $t.create = function(fen) {
        // new board object
        var b = {
            move: 'w', // who's move
            player: 'w', // who is playing? w/b/s (spectator)
            pos_moves: {},
            fliped: false, // is board flipped?
            hooks: {} // store board hooks
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