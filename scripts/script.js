/* setup dates library */
let today = dayjs();
const year = today.year();
dayjs.extend(window.dayjs_plugin_isBetween);

/* DOM elements */
// Cache references to DOM elements.
const elms = ['splash', 'content', 'poem', 'home', 'dateinfo', 'langbutton', 'ko', 'weather', 'prev', 'next', 'playbutton', 'languages', 'langmenu'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

const body = document.body;

/* seasons data */
let data;
let season_index = 0;
let this_season;
let from = "";
let to = ""; 
let daysleft = "";

/* audio tracks */
let player;
let tracklist = [];
let sound_id = 0;

/* typewriter options */
let first = true; //toggle this off after first poem
let t = 0;
const speed = 100; 
let text = ""; 

/* language options */
let langlist;
let active_lang = 'en';

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

          if(typeof this_season == "undefined"){
            //only evaluate if season hasn't been determined yet
            let season = json[i];
            
            //setup current year dates
            let from_date = dayjs(year+'/'+season.start);  
            let to_date = dayjs(year+'/'+season.end);
            let toplus = to_date.add(1, 'days');

            //determine current season by checking if today’s date falls
            //between the start and end date
            if( today.isBetween(from_date, toplus, null, '[)') ){
              console.log(season);
              season_index = i; // store index of current season
              this_season = season;

              from = dayjs(season.start).format('MMMM D');
              to = dayjs(season.end).format('MMMM D');

              let days = toplus.diff(today, 'day');
              setDaysLeft(days);
            // break;
            }
          }
      }

      console.log(tracklist);
      player = new Player(tracklist, season_index); //initialize player
    });
} 

//initialize
getPoem();

function displayPoem(season){
  from = dayjs(season.start).format('MMMM D');
  to = dayjs(season.end).format('MMMM D');

  poem.style.setProperty('--wght', season.weight);

  let lang_key = langlist[active_lang];

  let text_updates = [
    {
      text: season[lang_key],
      container: poem
    },
    {
      text: `${from} — ${to}`,
      container: dateinfo
    },
    {
      text: season['ko'],
      container: weather
    }
  ]

  text_updates.forEach(function(t){
    t.container.innerHTML = ""; //reset containers
    typeWriter(t.text, t.container);
  });  
}

async function displayTexts( season ){

  poem.style.setProperty('--wght', season.weight);

  let text_contents = [
    {
      text: season['English'],
      container: poem
    },
    { 
      text: "[ * ]",
      container: home
    },
    {
      text: `${from} — ${to} … ${daysleft}`,
      container: dateinfo
    },
    {
      text: "[ ? ]",
      container: aboutbutton
    },
    {
      text: "→",
      container: next
    },
    {
      text: "[ ♪ ]",
      container: playbutton
    },
    {
      text: season['ko'],
      container: weather
    },
    {
      text: "[ en ]",
      container: langbutton
    },
    {
      text: "←",
      container: prev
    }
  ]

  //go through and populate text containers
  for (let i = 0; i < text_contents.length; i++) {
    let content = text_contents[i];
    await typeWriter(content.text, content.container);
  }

}

async function typeWriter(string, element, delay = 100) {
  const letters = string.split("");
  let i = 0;
  while(i < letters.length) {
    await waitForMs(delay);
    element.innerHTML += letters[i];
    i++
  }
  return; 
}

function waitForMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


function setDaysLeft(days){
  if (days == 1){
    daysleft = "one day left";
  }else if (days == 0){
    daysleft = "today is the last day";
  }else{
    let numwords = ["two", "three", "four"];
    let dayindex = days-2;
    daysleft = numwords[dayindex] + " days left";
  }
}


// display initial poem
splash.addEventListener('click', function(){
  body.setAttribute('data-mode', 'stage');
  splash.classList.remove('visible');
  setupStage();
});


function setupStage(){
  //sets up elements of poem stage
  //begins audio
  // displayPoem(this_season);
  player.play();
  displayTexts(this_season);
}


// next and previous controls

next.addEventListener('click', function(){
  player.skip('next');
  if (season_index < 71){
    season_index++;    
  }else{
    season_index = 0;
  }
  displayPoem(data[season_index]);
}, false);


prev.addEventListener('click', function(){
  player.skip('prev');
  if (season_index > 0){
    season_index--;    
  }else{
    season_index = 71;
  }
  displayPoem(data[season_index]);
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

    sound_id = sound.play();

    // Begin playing the sound.
    sound.fade(0, 0.3, 800, sound_id);
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
    // Get the Howl we want to manipulate
    var sound = self.playlist[self.index].howl;
    
    // fadeout the sound
    sound.fade(0.3, 0, 800, sound_id);
    playbutton.setAttribute('data-playing', 'false');
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

// Bind our player controls
playbutton.addEventListener('click', function() {
  if( playbutton.getAttribute('data-playing') == 'true' ){
    player.pause();
  }else{
    player.play();
  } 
});


// Language controls

function setupLanguages(){
  let langs = "";
  fetch("data/languages.json")
    .then(response => response.json())
    .then(json => {
      langlist = json;
      Object.keys(json).forEach(function(key){
        //create lang option and assign event handler
        let langElement = document.createElement("div");
        langElement.className = 'language';
        langElement.setAttribute('id', key);
        langElement.innerText = json[key];

        if (key == 'en'){
          langElement.classList.add('active-lang')
        }

        langElement.addEventListener('click', function(){
          content.setAttribute('lang', key);
          document.querySelector('.active-lang').classList.remove('active-lang');
          langElement.classList.add('active-lang');
          langbutton.innerText = '[ '+key+ ' ]';
          active_lang = key; 
          body.setAttribute('data-mode', 'stage');
          displayPoem(data[season_index]);
        });

        languages.appendChild(langElement);
      });
    });
  langbutton.addEventListener('click', function(){
    body.setAttribute('data-mode', 'lang');
  });
}

setupLanguages();

let backbutton = document.querySelector('.back');
backbutton.addEventListener('click', function(){
  body.setAttribute('data-mode', 'stage');
});