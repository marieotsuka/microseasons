/* setup dates library */
let today = dayjs();
const year = today.year();
dayjs.extend(window.dayjs_plugin_isBetween);

/* DOM elements */
// Cache references to DOM elements.
const elms = ['splash', 'content', 'poem', 'home', 'dateinfo', 'langbutton', 'ko', 'weather', 'prev', 'next', 'playbutton', 'mutebutton', 'languages', 'langmenu', 'infotable', 'info'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

const body = document.body;

/* seasons data */
let data;
let season_index = 0;
let this_season = {};
let from = "";
let to = ""; 
let daysleft = "";

/* audio tracks */
let player;
let tracklist = [];
let sound_id = 0;
let audio = false;
let all = false;

/* typewriter */
let first = true; //toggle this off after first poem

/* language */
let langlist;
let active_lang = 'en';


/*-----------------------------------------
  Setup Season Poems
-----------------------------------------*/

function getPoem( ){
// from a seasons.json data file
// populates info table in the #info section
// sets up the tracklist and initalizes the player
// calculates which season is the current via dayjs
  fetch("data/seasons.json")
    .then(response => response.json())
    .then(json => {
      data = json;
      // console.log(data);
      let tablehtml = `<div class="row">
                <dt>
                  <div class="heading name">七十二候</div>
                  <div class="heading range">Dates</div>
                </dt>
                <dd class="description">
                  
                  <div class="heading text">Microseason (English)</div>

                </dd>
            </div>`;

      for(var i = 0; i<json.length; i++){
          //setup tracklist
          tracklist.push( {
            file:  i+1 +'.mp4',
            howl: null
          });

          let season = json[i];

          //setup info table
          tablehtml += `
            <div class="row">
                <dt>
                  <div class="cell name">${season['name-jp']}</div>
                  <div class="cell range">${season['start']}—${season['end']}</div>
                </dt>
                <dd class="description">

                  <div class="cell text" style="--wght: ${season['weight']};">${season['English']}</div>
                 
                </dd>
            </div>
          `

          if(Object.keys(this_season).length === 0){
            //only evaluate if season hasn’t been determined yet            
            //setup current year dates
            let from_date = dayjs(year+'/'+season.start);  
            let to_date = dayjs(year+'/'+season.end);
            let toplus = to_date.add(1, 'days');

            // console.log(from_date, to_date, toplus);
            //determine current season by checking if today’s date falls
            //between the start and end date
            if( today.isBetween(from_date, toplus, null, '[)') ){
              // console.log(season);
              season_index = i; // store index of current season
              this_season = season;

              // from = dayjs(from_date).format('MMMM D');
              // to = dayjs(to_date).format('MMMM D');
              console.log(this_season);
              let days = toplus.diff(today, 'day');
              setDaysLeft(days);
            // break;
            }
          }
      }

      //append information table
      infotable.innerHTML = tablehtml;

      //initialize player
      player = new Player(tracklist, season_index); 
    });
} 

//get first season poem
getPoem();


/*-----------------------------------------
  Poem Display
-----------------------------------------*/

async function displayPoem(season){
// given a season object
// populates the HTML elements accordingly

  from = dayjs(year+'/'+season.start).format('MMMM D');
  to = dayjs(year+'/'+season.end).format('MMMM D');

  //clear timeouts
  var id = window.setTimeout(function() {}, 0);
  while (id--) {
      window.clearTimeout(id); // will do nothing if no timeout with id is present
  }

  //prepare poem container
  poem.innerHTML = "";
  poem.style.setProperty('--wght', season.weight);

  let jp_text = '「'+season['name-jp']+'」'+season['furigana'];

  //get language name from language data
  let lang_key = langlist[active_lang];

  let daysleft_text = `${from} — ${to}`;
  if (first){
    //if this is the first poem, current season, add how many days are left
    daysleft_text += `… ${daysleft}`;
  }
  
  let text_updates = [
    {
      text: daysleft_text,
      container: dateinfo
    },
    {
      text: jp_text,
      container: weather
    }
  ]

  //reset and populate date and sekki info
  text_updates.forEach(function(t){
    t.container.innerHTML = ""; 
    t.container.innerHTML = t.text;
  }); 

  //typeout poem for specified language
  await typeWriter(season[lang_key], poem); 
}

async function displayTexts(season) {
// for the first poem, show the navigational 
// surrounding elements afterwards
  await displayPoem(season);
  let text_contents = [home, dateinfo, playbutton, next, mutebutton, weather, langbutton, prev]
  //after poem is typed up, show peripheral elements
  for (let i = 0; i < text_contents.length; i++) {
     let element = text_contents[i];
     await waitForMs(600); //delay between showing each element
     element.style.visibility = 'visible';    
   }
  first = false; //turn off first flag
}


async function typeWriter(string, element, delay = 100) {
//given a text string, html container object, and delay
//appends one character at a time
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
//converts the calculated days left
//into a user-friendly phrase
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

// next and previous season controls
function showNextPoem(){
  if (season_index < 71){
    season_index++;    
  }else{
    season_index = 0;
  }
  displayPoem(data[season_index]);
}
next.addEventListener('click', function(){
  player.skip('next');
  showNextPoem();
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
  console.log(this.playlist, this.index);
};

Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    console.log('play', index, all);
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
        loop: true,
        volume: 0.3
        // onend: function() {
        //   self.skip('next');
        // }
      });
    }

  
    sound_id = sound.play();
    // Begin playing the sound.
    sound.fade(0, 0.3, 800, sound_id);

    //loop only for single play mode
    if(all){
      sound.loop(false, sound_id);
      sound.on('end', function(){
        console.log(sound_id, 'next track')
        self.skip('next');
        showNextPoem();
      }, sound_id);
    }else{
      sound.loop(true, sound_id);
      sound.on('end', function(){
        console.log('loop');
      }, sound_id);
    }


    console.log(sound);
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
    sound.on('fade', function(){
      sound.stop(sound_id);
    });
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

    self.index = index;
    self.play(index);
  }

};

// Bind our player controls
mutebutton.addEventListener('click', function() {
  if( mutebutton.getAttribute('data-mute') == 'false' ){
    // player.pause();
    Howler.mute(true)
    mutebutton.setAttribute('data-mute', 'true');
  }else{ 
    Howler.mute(false);
    mutebutton.setAttribute('data-mute', 'false');
    // player.play(season_index);
  } 
});

playbutton.addEventListener('click', function(){
  if( playbutton.getAttribute('data-playall') == 'true' ){
    Howler.stop(); 
    all = false; 
    player.play(season_index);
    playbutton.setAttribute('data-playall', 'false');
    playbutton.innerHTML = '•'; 
  }else{
    Howler.stop();
    all = true;
    player.play(season_index);

    playbutton.setAttribute('data-playall', 'true');
    playbutton.innerHTML = '';
  }
});

/*-----------------------------------------
About info section toggles
-----------------------------------------*/

dateinfo.addEventListener('click', function(){
  body.setAttribute('data-mode', 'info');
  info.setAttribute('data-infomode', 'text');
});
weather.addEventListener('click', function(){
  body.setAttribute('data-mode', 'info');
  info.setAttribute('data-infomode', 'text');
});


/*-----------------------------------------
Language options
-----------------------------------------*/
function setupLanguages(){
//populates the language menu
//from languages.json data file
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
          langbutton.innerText = key;
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


/*-----------------------------------------
Splash page and initial setup
-----------------------------------------*/

// display initial poem
splash.addEventListener('click', function(){
  body.setAttribute('data-mode', 'stage');
  player.play();
  displayTexts(this_season);
});

/*-----------------------------------------
Navigational buttons
-----------------------------------------*/
/* CSS controls what section is being displayed
 * based on the 'data-mode' attribute on the body
 */

let backbutton1 = document.querySelector('#info .back');
backbutton1.addEventListener('click', function(){
  body.setAttribute('data-mode', 'stage');
});

let backbutton2 = document.querySelector('#langmenu .back');
backbutton2.addEventListener('click', function(){
  body.setAttribute('data-mode', 'stage');
});

let infobuttons = document.querySelectorAll('#info .button');
infobuttons.forEach(function(el){
  el.addEventListener('click', function(){
    let infotype = el.getAttribute('id');
    info.setAttribute('data-infomode', infotype);
  });
});

