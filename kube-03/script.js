
// https://favicon.io/favicon-generator/
// https://fakejson.com/how-to-connect-to-the-fakejson-api-using-pure-javascript
var app = document.getElementById('root');

var container = document.createElement('div');
container.setAttribute('class', 'container');

app.appendChild(container);

var request = new XMLHttpRequest();

fetch("http://localhost:3002/forecast/geneva")
.then(res => res.json())
.then(forecast => {

	console.log('Checkout this JSON! ', forecast);
	var card = document.createElement('div');
	card.setAttribute('class', 'card');

	var elem = document.createElement("img");
	elem.setAttribute("src", forecast.condition.icon);
	elem.setAttribute("height", "180px");
	elem.setAttribute("width", "100%");
	elem.setAttribute("alt", forecast.condition.text);

    var h1 = document.createElement('h1');
    h1.textContent = forecast.location.name;

    var p1 = document.createElement('p1');
    p1.textContent = forecast.location.country;

    var p2 = document.createElement('p2');
    p2.textContent = forecast.location.country;

    var br = document.createElement("br");

    container.appendChild(card);

	card.appendChild(elem);
	card.appendChild(h1);
	card.appendChild(p1);
	card.appendChild(br);
	card.appendChild(p2);

}
  );

  var x = document.getElementById("demo");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(weatherdata);
      } else { 
        x.innerHTML = "Geolocation is not supported by this browser.";
      }
    //fetch openweather map url with api key
    function weatherdata(position) {
//put corrdinates to get weather data of that location
      fetch('https://api.openweathermap.org/data/2.5/weather?lat='+position.coords.latitude+'&lon='+position.coords.longitude+'&appid=b2c336bb5abf01acc0bbb8947211fbc6')
      .then(response => response.json())
      .then(data => {
      console.log(data);
      document.getElementById("demo").innerHTML = 
      '<br>wind speed:-'+data.wind.speed + 
      '<br>humidity :-'+data.main.humidity + 
      '<br>temprature :-'+data.main.temp  
      });
    }