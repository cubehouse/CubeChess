define(["jquery", "board", "chess"], function() {
    var $t = {};
    
    var Board = require('board');
    var Chess = require('chess');
    
    // some general game functions
    var sidebarBox = function(d) {
        return '<li class="button">'+d+'</li>';
    };
    var sidebarButton = function(d, cb) {
        return $(sidebarBox("<a href='#'>"+d+"</a>")).click(function() {
            cb();
            return false;
        });
    };
    
    var funcs = {
        info: function(msg) {
            this.message(msg, "info");
        },
        error: function(msg) {
            this.message(msg, "error");
        },
        message: function(msg, type) {
            this.messages.push({
                type: type,
                message: msg
            });
            this.drawConsole();
        },
        html: function() {
            return this.body;
        },
        updateBoard: function() {
            // use the chess logic option to update the board
            this.board.move = this.chess.turn();
            
            // update board layout
            this.board.fen(this.chess.fen());
        },
        draw: function() {
            // update board
            this.drawBoard();
            
            // update sidebar
            this.drawSidebar();
            
            // redraw console
            this.drawConsole();
        },
        drawBoard: function() {
            this.body_board.html(this.board.draw());
        },
        drawSidebar: function() {
            var html = this.sidebar.html("");
            var that = this;
            var c = this.chess;
            
            // who's turn?
            var turn = "";
            if (c.game_over()) {
                // game over states
                if (c.in_checkmate()) {
                    turn = "Checkmate!";
                } else if (c.in_stalemate()) {
                    turn = "Stalemate!";
                } else if (c.in_draw()) {
                    turn = "Draw!";
                }
            } else {
                turn = ((c.turn()=="w")?"White":"Black")+"&apos;s move";
            }
            html.append("<div id='turn' class='button success right'>"+turn+"</div>");
            
            // some basic game stats
            var list = $('<ul class="list right clear">');
            
            var pos_moves = c.moves().length;
            list.append(sidebarBox(
                'Move: <span id="stats_moves">'+c.move_number()+'</span><br />'+
                pos_moves+' possible move'+((pos_moves!=1)?"s":"")
            ));
            
            // flip board function
            list.append(sidebarButton("Flip Board", function() {
                that.board.flip();
                that.draw();
            }));
            
            html.append(list);
        },
        drawConsole: function() {
            var html = "";
            for(var ii=0; ii<this.messages.length; ii++) {
                var m = this.messages[ii];
                if (m.type == "info") {
                    html += "[INFO] ";
                } else if (m.type == "error") {
                    html += "[ERROR] ";
                }
                html += this.messages[ii].message+"<br />";
            }
            this.console.html(html);
        }
    };
    
    $t.create = function(div, fen) {
        var g = {
            div: div,
            board: Board.create(),
            body: $("<div class='container board1'>"), // game container
            chess: new Chess(fen), // new logic handler
            messages: []
        };
        
        // create sidepanel
        g.sidebar = $("<div class='panel right'>");
        // apend to body
        g.body.append(g.sidebar);
        
        // board holder
        g.body_board = $("<div class='board_frame'>");
        g.body.append(g.body_board);
        
        // console
        g.console = $('<div id="terminal" class="clear container">');
        g.body.append(g.console);
        
        // clone functions to this object
        for(var ii in funcs) {
            g[ii] = funcs[ii];
        }
        
        // validate passed fen
        if (fen) {
            var valid = g.chess.validate_fen(fen);
            if (!valid.valid) {
                g.error(valid.error);
            }
        }
        
        // push chess logic changes to board
        g.updateBoard();
        
        // draw initial layout
        g.draw();
        
        // push elements to div
        g.div.html(g.body);
        
        // return
        return g;
    };
    
    return $t;
});