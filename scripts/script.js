/* setup dates library */
let today = dayjs();
const year = today.year();
dayjs.extend(window.dayjs_plugin_isBetween);

/* DOM elements */
// Cache references to DOM elements.
var elms = ['content', 'poem','fromdate', 'todate', 'daysleft', 'ko', 'weather'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

/* seasons data */
let data;
let season_index = 0;

/* typewriter options */
let t = 0;
const speed = 100; 
let text = ""; 

function getPoem( ){
  fetch("data/seasons.json")
    .then(response => response.json())
    .then(json => {
      data = json;
      // console.log(data);

      for(var i = 0; i<json.length; i++){
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
            break;
          }
      }
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
const next = document.getElementById('next');
next.addEventListener('click', function(){
  if (season_index < 71){
    season_index++;    
  }else{
    season_index = 0;
  }
  displayPoem(data[season_index]);
  daysleft.innerHTML = "";
}, false);

const back = document.getElementById('back');
back.addEventListener('click', function(){
  if (season_index > 0){
    season_index--;    
  }else{
    season_index = 71;
  }
  displayPoem(data[season_index]);
  daysleft.innerHTML = "";
}, false);