var supports = {
  // check for local storage support
  localStorage: (function() {
    var t = 'test';
    try {
      localStorage.setItem(t, t);
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  })(),

  geolocation: !!navigator.geolocation
};

$(function() {

  setTimeout(function() {
    window.scrollTo(0, 1);
  }, 1000);

  // Submit the lookup by zipcode
  $('.container').on('submit', function(e) {
    lookup($(this).find('.zip').val());
    e.preventDefault();
  });

  $('.go-back').click(function(e) {
    $('#page1').addClass('active');
    $('#page2').removeClass('active');
  });

  // save the temperature scale on change
  if(supports.localStorage) {
    $('.container').on('change', '[name=scale]', function() {
      localStorage['scale'] = $(this).val();
      lookup(lastQuery);
    });

    localStorage['scale'] && ($('[name=scale][value=' + localStorage['scale'] + ']').prop('checked', true));
  }

  // enable label clicks on mobile safari
  $('label').click(function() {});

});

// normalize the conditions
function getcondition(observation) {
  var condition;
  switch(observation) {
    case 'sunny':
    case 'clear':
      condition = 'weather-sunny';
      break;
    case 'mostlysunny':
    case 'mostlycloudy':
    case 'partlysunny':
    case 'partlycloudy':
      condition = 'weather-partly-cloudy';
      break;
    case 'cloudy':
      condition = 'weather-cloudy';
    break;
    case 'rain':
    case 'chancerain':
      condition = 'weather-rain';
      break;
    case 'snow':
    case 'chancesnow':
      condition = 'weather-snow';
      break;
    case 'tstorms':
    case 'chancetstorms':
      condition = 'weather-storm';
      break;
    case 'flurries':
      condition = 'weather-flurry';
      break;
    default:
      condition = 'weather-sunny';
  }

  return condition;
}

// If navigation is supported, use longitude/latitude
if(supports.geolocation) {
  navigator.geolocation.getCurrentPosition(lookup);
}

// Call the service getting the current conditions and forecast
var lastQuery;
function lookup(position) {

  var query = '',
      loader = $('.loading').addClass('active');
  if(position.coords) {
    query = position.coords.latitude + ',' + position.coords.longitude;
  } else {
    query = position;
  }

  // cache the last query for later
  lastQuery = query;

  $.getJSON('http://api.wunderground.com/api/7847bcd68d4b1b29/geolookup/conditions/forecast/q/' + query + '.json?callback=?', function(response) {

    var current = response.current_observation,
        isF = ($('[name=scale]:checked').val() == 'F') ? 1 : 0;
    loader.removeClass('active');

    $('#page1').removeClass('active');
    $('#page2').addClass('active');

    $('.temperature').text((isF ? current.temp_f : current.temp_c)+'°');
    $('.feels-temp').text((isF ? current.feelslike_f : current.feelslike_c)+'°');
    $('.location').text(current.display_location.full);

    var conditions = $('<ul class="conditions"/>')
      .append('<li>' + current.weather + '</li>')
      .append('<li>Relative Humidity ' + current.relative_humidity + '</li>')
      .append('<li>Winds ' + current.wind_dir + ' @ ' + current.wind_mph + ' mph</li>');
    $('.stats:eq(1)').empty().append(conditions);

    $('.weather').removeClass('weather-sunny weather-partly-cloudy weather-rain weather-snow weather-flurry sunny');

    $('.conditions .weather').addClass(getcondition(response.current_observation.icon));

    // get the days
    $.each(response.forecast.simpleforecast.forecastday, function(index, day) {
      var theday = $('.day' + (index+1));
      theday.find('.weather').addClass(getcondition(day.icon));
      theday.find('strong').text(day.date.weekday);
      theday.find('.temp').text((day.high[isF ? 'fahrenheit' : 'celsius']) + '° / ' + day.low[isF ? 'fahrenheit' : 'celsius'] + '°')
    });

  });
}
