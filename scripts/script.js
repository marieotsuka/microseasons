let today = dayjs();

$(document).ready(function(){ 

  const wghtmax = 700;
  const wdthmax = 150;

  //standard sliders
  $('.axis-range').on('input', function(){

    let value = parseInt($(this).val()); //get slider input value
    // console.log(value);

    const slidertype = $(this).data('type'); //get slider axis

    console.log("--"+slidertype, value );

    $('#poem').css("--"+slidertype, value);

  });

  $('#ss01').change(function(){
    if( $(this).is(':checked') ) {
      $('#poem').css('--ss01', 1);
    } else {
     $('#poem').css('--ss01', 0);
    }
  });

  $('#ss03').change(function(){
    if( $(this).is(':checked') ) {
      $('#poem a').css({
        '--ss03': 1,
        'text-decoration': 'none'
      });
    } else {
     $('#poem a').css({
      '--ss03': 0,
      'text-decoration': 'underline'
    });
    }
  });

  
  getPoem();

});


function getPoem( ){
  fetch("seasons.json")
    .then(response => response.json())
    .then(json => displayPoem(json));
} 

function displayPoem(data){
  const poem = document.getElementById('poem');
  dayjs.extend(window.dayjs_plugin_isBetween);

  for(var i = 0; i<data.length; i++){
      let season = data[i]
      let from = dayjs(season.start);  
      let to = dayjs(season.end);
      let toplus = to.add(1, 'days');
      if( today.isBetween(from, toplus, null, '[)') ){
        console.log(season);
        poem.innerHTML = season.ko;
      }
  }
}
