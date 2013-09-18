$(document).ready(function(){

  var Minesweeper = function(){
    var self = this;
    var defaultOptions = {
      boardSize: [8, 8],
      difficulty: 'easy'
    }
    
    // initialize our cell object
    var cells;
    
    this.init = function(options){
      // empty the cell object if it has anything in it
      cells = [];
      if (typeof options == 'object') {
        options = $.extend(defaultOptions, options);
      } else {
        options = defaultOptions;
      }
      self.difficulty = options.difficulty;

      // setup a new game
      self.newGame(options.boardSize);
    };

    this.newGame = function (boardSize){
      //remove the old board if there is one, detach event listeners as well
      $('#minesweeper').empty();

      var x = boardSize[0];
      var y = boardSize[1];
      self.width = x;
      
      //setup our new board
      self.addUI();
      self.buildGrid(x, y);
    }

    this.addUI = function(){
      var board = $('#minesweeper');
      var checkMe = $('<div/>').attr({
        id: 'check-me',
        class: 'happy-smiley'
      });
      var mineCount = $('<div/>').attr('id', 'mine-count');
      var timer = $('<div/>').attr('id', 'timer').html('0');
   
      var ui = $('<div/>').attr('id','ui');
      ui.append(mineCount);
      ui.append(timer);
      ui.append(checkMe);
      board.append(ui);
    }

    this.buildGrid = function(columns, rows) {
      var rowDiv;
      var id = 0;

      // build a containg div for each row, and then populate each row with the correct
      // number of cells to fill out our grid
      for (var i=0; i<=rows-1; i++){
        rowDiv = $('<div/>').attr({
          id : 'row'+i,
          class : 'row'
        }).appendTo($('#minesweeper'));

        for (var j=0; j<=columns-1; j++){
          var cell = $('<div/>').attr({
            'id' : id ++,
            'class' : 'cell'
          }).appendTo(rowDiv);
          // add the cell to the cells array so we can access it later instead of 
          // looping through the DOM
          cells.push({
            hasMine: false,
            flagged: false,
            cleared: false
          });
        }
      }

      // set the width and height of our minesweeper container based on how many columns we have 
      var cellWidth = $('.cell').outerWidth();
      var uiHeight = $('#ui').outerHeight();
      $('#minesweeper').width(cellWidth*columns).height(cellWidth*rows+uiHeight);
      $('.cell').css('cursor', 'pointer');
      
      // add event listeners for our newly created cells
      self.setHandlers();

      // add the mines to our grid 
      self.setMines(self.difficulty);
    }

    this.setMines = function(difficulty){

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
      self.mineCount = numberOfMines;

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
    }

    
    this.setHandlers = function(){
      
      var firstClick = true;
      $('.cell').on('click', function(){
        //start the timer only on the first click
        if(firstClick){
          self.startTimer();
          firstClick = false;
        }
        var id = this.id;
        if(cells[id].hasMine){
          self.gameOver();
          $(this).css('background-color','#ff0000');
        }
        else{
          self.clearCell(id);
        }
        
      });

      $('.cell').on('contextmenu', function(event){
        var cell = $(this);
        var id = this.id;
        if(cells[id].flagged){
          cell.removeClass('flagged');
          cells[id].flagged = false;
          cells[id].checked = false;
          self.mineCount ++;
          $('#mine-count').html(self.mineCount);
          return false;
        }
        else{
          if (cells[id].cleared){
            return false;
          }
          else{
            cell.addClass('flagged');
            cells[id].flagged = true;
            self.mineCount = self.mineCount -1;
            $('#mine-count').html(self.mineCount);
            return false;
          }
        }
         event.preventDefault();
       
      });

      $('#check-me').on('click', function(){
        if($(this).hasClass('sad-smiley')){
          self.reset();
        }
        else{
        self.check();
        }
      });
     }

    this.gameOver = function(){
      $('.cell').css('cursor', 'default');
      $('#minesweeper .mine').toggleClass('show');
      $('#check-me').attr('class', 'sad-smiley');
      
      //lock the game board so the user can't click on any cells 
     $('.cell').off();
      self.stopTimer = true;
    }

    this.reset = function(){
      self.init();
    }

    this.check = function(){
      var loser;
      $.each(cells, function(index){
        if (cells[index].cleared == false && cells[index].hasMine == false){
          self.gameOver();
          alert('Looks like you missed a few...');
          loser = true;
          return false;
        }
      });
      if(!loser){
        self.win();
      }
    }

    this.win = function(){
      $('#check-me').attr('class','cool-smiley');
      alert("Winner!")
    }

    this.getNeighbors = function(cellId){
      var neighbors = new Array();
      var neighborBombs = 0;
      var width = self.width;
      
      // need to fix this. It was just a hack to make sure we had an integer not a string
      var id = +cellId;
      
      // If we are on the top row, the id - width will always be < 0
      if(id - width > 0){

        // We are not on the top row. So get the cell above us (Top)
        var top = id - width;
        neighbors.push(top);
        if(cells[top].hasMine){
          neighborBombs += 1;
        }

        // before we get the Top Right cell, check that we aren't on the far right edge of the board
        if(((top + 1) % width) !== 0){
          var topRight = top + 1;
          neighbors.push(topRight);
          if(cells[topRight].hasMine){
            neighborBombs += 1;
          }
        }

        // do the same with the Top Left cell
        if((top % width) !== 0){
          var topLeft = top - 1;
          neighbors.push(topLeft);
          if(cells[topLeft].hasMine){
            neighborBombs += 1;
          }
        }
      }

      // if the cell id is evenly divisble by the width, then we are on the left edge
      if(id % width !== 0){
        var left = id - 1;
        neighbors.push(left);
        if(cells[left].hasMine){
          neighborBombs += 1;
        }
      }

      // if the cell id + 1 is evenly divisible by the width, then we are on the right edge
      if((id + 1) % width !== 0){
        var right = id + 1;
        neighbors.push(right);
        if(cells[right].hasMine){
          neighborBombs += 1;
        }
      }

      // if the cell id + the width of the grid is < the total number of cells, we are not on the bottom row
      if(id + width < cells.length){
        var bottom = id + width;
        neighbors.push(bottom);
        if(cells[bottom].hasMine){
          neighborBombs += 1;
        }
      
        // check that we aren't on the right edge of the board
        if((bottom + 1) % width !== 0){
          var bottomRight = bottom + 1;
          neighbors.push(bottomRight);
          if(cells[bottomRight].hasMine){
            neighborBombs += 1;
          }
        }

        // check that we aren't on the left edge of the board
        if(bottom % width != 0){
          var bottomLeft = bottom - 1;
          neighbors.push(bottomLeft);
          if(cells[bottomLeft].hasMine){
            neighborBombs += 1;
          }
        }
      }

      var cellData = {
        cells : neighbors,
        bombs : neighborBombs
      }

      return cellData;
    }

    this.startTimer = function(){
      self.stopTimer = null;
      var time = 0;
      $('#timer').html(time);
      (function tick(){
        if(self.stopTimer){
          clearTimeout(moreTime);
        }
        else{
          time +=1;
          $('#timer').html(time);
          var moreTime=setTimeout(tick, 1000);
        }
      })();
    }

    this.clearCell = function(cellId){
     
      if(cells[cellId].checked){
        // been here before...
      }
      else{

        // make sure there isn't flag on this cell before we clear it
        if(cells[cellId].flagged == false){
          
          $('#'+cellId).addClass('cleared');
          cells[cellId].checked = true;
          cells[cellId].cleared = true;

          var neighbors = self.getNeighbors(cellId);
          if(neighbors.bombs > 0){
            $('#'+cellId).html(neighbors.bombs);
            $('#'+cellId).addClass("number"+neighbors.bombs);
          }
          else{
            $('#'+cellId).addClass('cleared');
            $.each(neighbors.cells, function(index, value){
              if(cells[value].hasMine){
              
              }
              else{
                self.clearCell(value);
              }
            });
          } 
        }
        else{
          cells[cellId].checked = true;
        }
      }
    }
  }

 
  var minesweeper = new Minesweeper();
 
  minesweeper.init({
    boardSize: [8, 8],
    difficulty: 'easy'
  });

  // add event listeners for the options panel

  $('#new-game').on('click', function(){
     minesweeper.reset();
     minesweeper.stopTimer = true;
  });

  $('#difficulty').change(function(){
    minesweeper.init({
      difficulty : $(this).val()
    });
  });

  $('#board-size').change(function(){
    var selected = $(this).find('option:selected');
    var x = selected.data('x'); 
    var y = selected.data('y'); 
    minesweeper.init({boardSize : [x,y]});
  })

  $('#show-timer').change(function(){
    $('#timer').toggleClass('hidden');
  });
});
