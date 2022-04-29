/* setup dates library */
let today = dayjs();
const year = today.year(); //this year
dayjs.extend(window.dayjs_plugin_isBetween);

/* DOM elements */
// Cache references to DOM elements.
const elms = ['splash', 'stage', 'content', 'poem', 'home', 'dateinfo', 'langbutton', 'ko', 'weather', 'prev', 'next', 'playbutton', 'mutebutton', 'langselection', 'infotable', 'info'];
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
let all = true; //autoplay all toggle

/* typewriter */
let first = true; //toggle this off after first poem

/* language */
let langlist;
let active_lang = 'en';


/*-----------------------------------------
  Setup Season Poems
-----------------------------------------*/
let rows = [];
function getPoem( ){
// from a seasons.json data file
// populates info table in the #info section
// sets up the tracklist and initalizes the player
// calculates which season is the current via dayjs
  fetch("data/seasons.json")
    .then(response => response.json())
    .then(json => {
      data = json;
      console.log(data);
      infotable.innerHTML = ""; //clear table from placeholder text

      for(let i = 0; i<json.length; i++){
          //setup tracklist
          tracklist.push( {
            file:  i+1 +'.mp4',
            howl: null
          });

          let season = json[i];

          rows[i] = document.createElement('div');
          rows[i].id = 'season'+i;
          rows[i].classList.add("row");
          rows[i].style.setProperty('--wght', season.weight);
          rows[i].innerHTML=`<div class="cell star">*</div>
              <div class="cell audio">♪</div>
              <div class="cell text">${season['English']}</div> 
              <div class="cell range">${formatDates(season.start, season.end)}</div>             
              <div class="cell name jp" lang="jp" title="${season['furigana']}">${season['name-jp']}</div>
              `;
          rows[i].addEventListener('click', function(){
            // clicking on each row plays that poem
            // console.log(i);            
            clearStage();  
            body.setAttribute('data-mode', 'stage');   
            Howler.stop();
            setTimeout(function(){
              season_index = i; 
              displayPoem(data[i]); //display poem in selected language
              player.play(i); //replay audio
            }, 1000);            
          });
        
          if(Object.keys(this_season).length === 0){
            //only evaluate if current season hasn’t been determined yet
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
              let days = toplus.diff(today, 'day');
              setDaysLeft(days);
            // break;
            }
          }
      }

      //append row elements
      rows.forEach(function(el){
        infotable.append(el);
      });

      //initialize player
      player = new Player(tracklist, season_index);
    })
    .then(function(){
      //add * indicator to table view
      document.getElementById('season'+season_index).classList.add("current","playing");
    });
}

//get first season poem
getPoem();


/*-----------------------------------------
  Poem Display
-----------------------------------------*/
function formatDates(start,end){
  // given to/from dates in the format 2/4, 2/7
  // outputs days in the format February 4–7  
  let from_date = dayjs(year+'/'+start);
  let to_date = dayjs(year+'/'+end);
  if( to_date.month() != from_date.month() ){
    to_date = to_date.format('MMMM D');
  }else{
    to_date = to_date.format('D');
  }
  let date_text = `${from_date.format('MMMM D')}—${to_date}`;
  return date_text;
}


function clearStage(){
  var id = window.setTimeout(function() {}, 0);
  while (id--) {
    window.clearTimeout(id); // will do nothing if no timeout with id is present
  }
  poem.innerHTML = "";
}

async function displayPoem(season){
// given a season object
// populates the HTML elements accordingly

  //clear timeouts and stage area
  clearStage();
  console.log(season);
  //adjust font weight for all elements
  stage.style.setProperty('--wght', season['weight']);

  let jp_text = `${season['name-jp']} <span class="kana">${season['furigana']}</span>`;

  //get language name from language data
  let lang_key = langlist[active_lang];

  let daysleft_text = formatDates(season.start, season.end);
  if (first){
    //if this is the first poem, current season, add how many days are left
    daysleft_text += `<span class="daysleft"> … ${daysleft}</span>`;
    first = false; //turn off first flag
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
  let text_contents = [home, dateinfo, playbutton, mutebutton, weather, langbutton, next, prev];
  //after poem is typed up, show peripheral elements
  for (let i = 0; i < text_contents.length; i++) {
     let element = text_contents[i];
     await waitForMs(150); //delay between showing each element
     element.style.visibility = 'visible';
     element.style.opacity = '1';
  }
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
  // Howler.stop();
  player.skip('next');
  showNextPoem();
}, false);

prev.addEventListener('click', function(){
  // Howler.stop();
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
  // console.log(this.playlist, this.index);
};

const vol_min = 0.02;
const vol_max = 0.08;


Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    console.log('play', index, all);
    
    let self = this;
    let sound;

    index = typeof index === 'number' ? index : self.index;
    let data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    // console.log(data);
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['audio/' + data.file ],
        html5: true,
        volume: 0,
        loop: !all
      });
    }

    sound_id = sound.play();
    sound.fade(vol_min, vol_max, 2000);
    
    if(all){
      sound.loop(false);
      sound.on('end', function(){
        player.skip('next');
        showNextPoem();
      });
    }else{
      sound.loop(true);
      sound.off('end');      
    }

    // Keep track of the index we are currently playing.
    self.index = index;
    //add indicator on info table
    document.querySelector('.playing').classList.remove("playing");
    document.getElementById('season'+index).classList.add("playing");
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



// play behavior button on top right
playbutton.addEventListener('click', function(){
  Howler.stop();
  if( playbutton.getAttribute('data-playall') == 'true' ){
    all = false;
    playbutton.setAttribute('data-playall', 'false');
    playbutton.innerHTML = '•';
  }else{
    all = true;
    playbutton.setAttribute('data-playall', 'true');
    playbutton.innerHTML = '…';
  }
  displayPoem(data[season_index]);
  player.play(season_index);
});

// mute button on bottom right
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





/*-----------------------------------------
Language options
-----------------------------------------*/
function setupLanguages(){
//populates the language menu
//from languages.json data file
  let langs = "";
  fetch("data/languages.json")
    .then(response => response.json())
    .then(langJson => {
      langlist = langJson;
      Object.keys(langJson).forEach(function(key){
        //create lang option and assign event handler
        let language = langJson[key];
        let langElement = document.createElement("option");
        langElement.className = 'language';
        langElement.setAttribute('value', key);
        langElement.setAttribute('title', language);
        langElement.innerText = language;
        langselection.appendChild(langElement);
      });

      langselection.addEventListener('change', function(e){
        let selectedLang = e.target.value;
        // langselection.classList.add('hidden');
        // langbutton.classList.remove('hidden');
        // langbutton.innerText = selectedLang;

        content.setAttribute('lang', selectedLang);

        active_lang = selectedLang;
        // body.setAttribute('data-mode', 'stage');        
        Howler.stop();
        displayPoem(data[season_index]); //display poem in selected language
        player.play(season_index); //replay audio
      });
    });
  // langbutton.addEventListener('click', function(e){
  //   langselection.classList.remove('hidden');
  //   langbutton.classList.add('hidden');
  // });
}
setupLanguages();


/*-----------------------------------------
Splash page and initial setup
-----------------------------------------*/

// display initial poem
splash.addEventListener('click', function(){
  body.setAttribute('data-mode', 'stage');
  
  setTimeout(function(){
    displayTexts(this_season);
    player.play();
  }, 1000);

});

/*-----------------------------------------
Navigational buttons
-----------------------------------------*/
/* CSS controls what section is being displayed
 * based on the 'data-mode' attribute on the body
 */

let backbutton = document.querySelectorAll('#info .back');
backbutton.forEach(function(el){
  el.addEventListener('click', function(){
    body.setAttribute('data-mode', 'stage');    
  });
});


/*-----------------------------------------
Info Table Toggles
-----------------------------------------*/
let aboutbuttons = document.querySelectorAll('.aboutbutton');
aboutbuttons.forEach(function(el){
  el.addEventListener('click', function(){
    console.log('info show ');
    document.querySelector('#info .container').scrollTo({
      top: 0
    });
    body.setAttribute('data-mode', 'info');
  });
});

/*-----------------------------------------
About text/sound/font accordion toggles
-----------------------------------------*/
let infobuttons = document.querySelectorAll('#info h2');
infobuttons.forEach(function(el){
  el.addEventListener('click', function(){
    let text_element = el.nextElementSibling;// console.log('toggle');
    text_element.classList.toggle('show');
    if( !text_element.classList.contains('show') ){
      text_element.style.setProperty('max-height', 'none');
      text_element.style.animation = "fade 300ms 400ms 1 forwards";
    }else{
      text_element.style.animation = "none";
    }
  });
});
