/* setup dates library */
let today = dayjs();
const year = today.year();
dayjs.extend(window.dayjs_plugin_isBetween);

/* DOM elements */
// Cache references to DOM elements.
var elms = ['content', 'poem','fromdate', 'todate', 'daysleft', 'ko', 'weather', 'back', 'next', 'playbutton'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

/* seasons data */
let data;
let season_index = 0;

/* audio tracks */
let player;
let tracklist = [];

/* typewriter options */
let t = 0;
const speed = 100; 
let text = ""; 

let loop = false;
function getPoem( ){
  fetch("data/seasons.json")
    .then(response => response.json())
    .then(json => {
      data = json;
      // console.log(data);


      for(var i = 0; i<json.length; i++){
          //setup tracklist
          tracklist.push( {
            file:  i+1 +'.mp3',
            howl: null
          });

          if(!loop){
            let season = json[i];
            
            //setup current year dates
            let from = dayjs(year+'/'+season.start);  
            let to = dayjs(year+'/'+season.end);
            let toplus = to.add(1, 'days');

            //determine current season by checking if today’s date falls
            //between the start and end date
            if( today.isBetween(from, toplus, null, '[)') ){
              console.log(season);
              season_index = i; // store index of current season
              displayPoem(season);

              let days = toplus.diff(today, 'day');
              displayDaysLeft(days);
              loop = true;
            // break;
            }
          }
      }

      console.log(tracklist);
      player = new Player(tracklist, season_index); //initialize player
    });
} 

function displayPoem(season){
  resetTypeWriter();
  text = season['English'];
  typeWriter();

  poem.style.setProperty('--wght', season.weight);
  fromdate.innerHTML = dayjs(season.start).format('MMMM D');
  todate.innerHTML = dayjs(season.end).format('MMMM D');
  ko.innerHTML = season.ko;
  weather.innerHTML = season['sekki-en'];
}

function resetTypeWriter(){
  poem.innerHTML = ""; //reset text
  t = 0; //reset counter
  document.body.setAttribute('data-typed', ''); //reset data attribute
}

function typeWriter( ) {
  if (t < text.length) {
    poem.innerHTML += text.charAt(t);
    t++;
    setTimeout(typeWriter, speed);
  }else{
    //mark as done
    setTimeout(function (){
      document.body.setAttribute('data-typed', 'done');                
    }, 800); 
  }
}

function displayDaysLeft(days){
  if (days == 1){
    daysleft.innerHTML = "one day left";
  }else if (days == 0){
    daysleft.innerHTML = "today is the last day";
  }else{
    let numwords = ["two", "three", "four"];
    let dayindex = days-2;
    daysleft.innerHTML = numwords[dayindex] + " days left";
  }
}


// display initial poem
getPoem();

// next and previous controls

next.addEventListener('click', function(){
  player.skip('next');
  if (season_index < 71){
    season_index++;    
  }else{
    season_index = 0;
  }
  displayPoem(data[season_index]);
  daysleft.innerHTML = "";
}, false);


back.addEventListener('click', function(){
  player.skip('prev');
  if (season_index > 0){
    season_index--;    
  }else{
    season_index = 71;
  }
  displayPoem(data[season_index]);
  daysleft.innerHTML = "";
}, false);


/*-----------------------------------------
  Setup Player
-----------------------------------------*/
/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */

let Player = function(playlist, trackid) {
  this.playlist = playlist;
  this.index = trackid; 

  // populate active track
  if( this.playlist[this.index] ){
    let thistrack = this.playlist[this.index];
  }else{
    console.log('required track isn’t setup properly');
  }

};

Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {

    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['audio/' + data.file ],
        autoplay: true,
        volume: 0.3,
        loop: true,
        html5: true // Force to HTML5 so that the audio can stream in (best for large files).
      });
    }

    // Begin playing the sound.
    sound.play();
    playbutton.setAttribute('data-playing', 'true');

    // Update the track display.
    // track.innerHTML = data.num + '. ' + data.title;
    // navtrack.innerHTML = data.title;
    // artist.innerHTML = data.artist;
    // duration.innerHTML = data.length;
    console.log('playing track', index)
    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;
    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;
    // Puase the sound.
    sound.pause();
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    console.log(self.index);
    // Get the next track based on the direction of the track.
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }
    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Play the new track.
    self.play(index);
  }
};



// Bind our player controls.
playbutton.addEventListener('click', function() {
  if( playbutton.getAttribute('data-playing') == 'true' ){
    player.pause();
  }else{
    player.play();
  } 
});