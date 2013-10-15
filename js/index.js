$(document).ready(function(){

  function Game() {
    // initialize our cell object
    this.cells = [];
    this.active = true;
    this.defaultOptions = {
      boardSize: [8, 8],
      difficulty: 'easy'
    }
  }

  Game.prototype = {

  setup: function(options){
    var that = this;
    
    // empty the cell object if it has anything in it
    cells = [];

    //remove the old board if there is one, detach event listeners as well
    $('#minesweeper').empty();

    if (typeof options == 'object') {
      options = $.extend(this.defaultOptions, options);
    } else {
      options = this.defaultOptions;
    }

    this.difficulty = options.difficulty;
    var x = options.boardSize[0];
    var y = options.boardSize[1];
    game.width = x;
    
    this.addUI();

    this.board = new Board(x,y);

    this.board.draw(function(){
      // this a callback from the board.draw method call
     // it sets the width and height of our minesweeper container based on how many columns we have 
      var cellWidth = $('.cell').outerWidth();
      var uiHeight = $('#ui').outerHeight();

      $('#minesweeper').width(cellWidth*x).height(cellWidth*y+uiHeight);

      $('.cell').css('cursor', 'pointer');
    
      // add event listeners for our newly created cells. Have to use 'that' because we are in the inner function
      that.board.setHandlers();

      // add the mines to our board
      that.board.setMines(game.difficulty);

    });

      this.timer = new Timer();
    },

    gameOver: function(){

      game.active = false;

      $('.cell').css('cursor', 'default');

      $('#minesweeper .mine').toggleClass('show');

      $('#check-me').attr('class', 'sad-smiley');
      
      //lock the game board so the user can't click on any cells 
     $('.cell').off();
     
    },

    reset: function(){
      this.setup();
    },

    check: function(){
      var loser;
      $.each(cells, function(index){
        if (cells[index].cleared == false && cells[index].hasMine == false){
          game.gameOver();
          alert('Looks like you missed a few...');
          loser = true;
          return false;
        }
      });
      if(!loser){
        game.win();
      }
    },

    win: function(){
      $('#check-me').attr('class','cool-smiley');
      alert("Winner!")
    },

    addUI: function(){
      var gameBoard = $('#minesweeper');
      var checkMe = $('<div/>').attr({
        id: 'check-me',
        class: 'happy-smiley'
      });

      var mineCount = $('<div/>').attr('id', 'mine-count');
      var timer = $('<div/>').attr('id', 'timer').html('0');
   
      var ui = $('<div/>').attr('id','ui');
      
      ui.append(mineCount).append(timer).append(checkMe);
      gameBoard.append(ui);
    }
  }

  function Board(x,y){
    this.columns = x;
    this.rows = y;
  }

  Board.prototype = {

    draw: function(callback){
      var rowDiv;
      var id = 0;
      var rows = this.rows;
      var columns = this.columns;
      // build a containg div for each row, and then populate each row with the correct
      // number of cells to fill out our grid

      for (var y=0; y<=rows-1; y++){
        rowDiv = $('<div/>').attr({
          id : 'row'+y,
          class : 'row'
        }).appendTo($('#minesweeper'));

        for (var x=0; x<=columns-1; x++){
          var currentCell = new Cell(id);
          cells.push(currentCell);  
          var cell = $('<div/>').attr({
            'id' : id ++,
            'class' : 'cell'
          }).appendTo(rowDiv);
          // add the cell to the cells array so we can access it later instead of 
          // looping through the DOM
        }
      }
      callback();
    },

    setMines: function(difficulty){

      // the number of mines is different for each difficulty level
      switch(difficulty){
        case 'hard': 
          var mineDensity = 4;
          break;
        case 'middle': 
          var mineDensity = 5.2;
          break;
        default:
          var mineDensity = 6.4;
          break;
      }

      var numberOfCells = cells.length;
      var maxCellId = numberOfCells -1;
      var numberOfMines = Math.round(numberOfCells/mineDensity);
      game.mineCount = numberOfMines;

      $('#mine-count').html(numberOfMines);
      
      for (var i=0; i<numberOfMines;i++){

        // generate a random number between 0 and the maximum cell id we have
        var cellId = Math.floor(Math.random()*maxCellId)+1;
        
        // check if we have already placed a mine on this cell
        // if we have, deincrement the counter to make sure we get the correct number of mines
        if (cells[cellId].hasMine) {
           i--;
        }
        else{
          // place mine
          cells[cellId].hasMine = true;
          $('#'+cellId).addClass('mine');
        }
      }
    },

    
    setHandlers: function(){
      
      var firstClick = true;
      $('.cell').on('click', function(){
        //start the timer only on the first click
        if(firstClick){
          game.timer.start();
          firstClick = false;
        }
        var id = this.id;
        if(cells[id].hasMine){
          game.gameOver();
          $(this).css('background-color','#ff0000');
        }
        else{
          cells[id].clear();
        }
        
      });

      $('.cell').on('contextmenu', function(event){
        var cell = $(this);
        var id = this.id;
        if(cells[id].flagged){
          cell.removeClass('flagged');
          cells[id].flagged = false;
          cells[id].checked = false;
          game.mineCount ++;
          $('#mine-count').html(game.mineCount);
          return false;
        }
        else{
          if (cells[id].cleared){
            return false;
          }
          else{
            cell.addClass('flagged');
            cells[id].flagged = true;
            game.mineCount = game.mineCount -1;
            $('#mine-count').html(game.mineCount);
            return false;
          }
        }
         event.preventDefault();
       
      });

      $('#check-me').on('click', function(){
        if($(this).hasClass('sad-smiley')){
          game.reset();
        }
        else{
          game.check();
        }
      });
     },
  }
    

  function Cell(id) {
    this.id = id;
    this.hasMine = false;
    this.flagged = false;
    this.cleared = false;
    
  }

  Cell.prototype = {
    
    clear: function(){
      var id = this.id;
      if(this.checked){
        // been here before...
      }
      else{
        // make sure there isn't flag on this cell before we clear it
        if(this.flagged == false){
          
          $('#'+id).addClass('cleared');
          this.checked = true;
          this.cleared = true;

          var neighbors = this.getNeighbors();
          if(neighbors.bombs > 0){
            $('#'+id).html(neighbors.bombs);
            $('#'+id).addClass("number"+neighbors.bombs);
          }
          else{
            $('#'+id).addClass('cleared');
            $.each(neighbors.cells, function(index, value){
              if(cells[value].hasMine){
              }
              else{
                cells[value].clear();
              }
            });
          } 
        }
        else{
          cells[id].checked = true;
        }
      }
    },

    getNeighbors: function(){
      var neighbors = new Array();
      var bombs = 0;
      var width = game.width;
      
      // need to fix this. It was just a hack to make sure we had an integer not a string
      var id = this.id;
      
      // If we are on the top row, the id - width will always be < 0
      if(id - width > 0){

        // We are not on the top row. So get the cell above us (Top)
        var top = id - width;
        check(top);

        // before we get the Top Right cell, check that we aren't on the far right edge of the board
        if(((top + 1) % width) !== 0){
          var topRight = top + 1;
          check(topRight);
        }

        // do the same with the Top Left cell
        if((top % width) !== 0){
          var topLeft = top - 1;
          check(topLeft);
        }
      }

      // if the cell id is evenly divisble by the width, then we are on the left edge
      if(id % width !== 0){
        var left = id - 1;
        check(left);
      }

      // if the cell id + 1 is evenly divisible by the width, then we are on the right edge
      if((id + 1) % width !== 0){
        var right = id + 1;
        check(right);
      }

      // if the cell id + the width of the grid is < the total number of cells, we are not on the bottom row
      if(id + width < cells.length){
        var bottom = id + width;
        check(bottom);
      
        // check that we aren't on the right edge of the board
        if((bottom + 1) % width !== 0){
          var bottomRight = bottom + 1;
          check(bottomRight);
        }

        // check that we aren't on the left edge of the board
        if(bottom % width != 0){
          var bottomLeft = bottom - 1;
          check(bottomLeft);
        }
      }

      function check(id){
        if(cells[id].hasMine){
            bombs += 1;
          }
          else{
            neighbors.push(id);
          }
      }

      var cellData = {
        cells : neighbors,
        bombs : bombs
      }

      return cellData;
    }
  }

  function Timer(){

  }

  Timer.prototype = {

    start: function(){
      var time = 0;
      $('#timer').html(time);
      (function tick(){
        if(!game.active){
          clearTimeout(moreTime);
        }
        else{
          time +=1;
          $('#timer').html(time);
          var moreTime=setTimeout(tick, 1000);
        }
      })();
    }   
  }

 
  var game = new Game();
 
  game.setup({
    boardSize: [8, 8],
    difficulty: 'easy'
  });

  // add event listeners for the options panel

  $('#new-game').on('click', function(){
     game.reset();
  });

  $('#difficulty').change(function(){
    game.setup({
      difficulty : $(this).val()
    });
  });

  $('#board-size').change(function(){
    var selected = $(this).find('option:selected');
    var x = selected.data('x'); 
    var y = selected.data('y'); 
    game.setup({boardSize : [x,y]});
  })

  $('#show-timer').change(function(){
    $('#timer').toggleClass('hidden');
  });
});
