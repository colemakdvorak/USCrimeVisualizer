var graphs = function (data) {
  var margin = {top: 30, right: 100, bottom: 30, left: 60},
  width = window.innerWidth - 300 - margin.left - margin.right,
  height = 180 - margin.top - margin.bottom;

  // Parse the date / time
  var parseDate = d3.time.format("%Y-%m");
  var parseFullDate = d3.time.format("%B of %Y");

  // Set the ranges
  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  // Define the axes
  var xAxis = d3.svg.axis().scale(x)
  .orient("bottom").ticks(10);

  var yAxis = d3.svg.axis().scale(y)
  .orient("left").ticks(5);

  // Define the line
  var valueline = d3.svg.line()
  .interpolate("cardinal")
  .x(function(d) { return x(d.Date); })
  .y(function(d) { return y(d.count); });
  
  // Adds the svg canvas
  var svg = d3.select("#graph")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
    "translate(" + margin.left + "," + margin.top + ")");

  // Get the data
  data.forEach(function (d) {
    d.Date = parseDate.parse(d._id.Date);
    d.count = +d.count;
  });

  data.sort(function (a, b) {
    return a.Date-b.Date;
  });

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) { return d.Date; }));
  y.domain([d3.min(data, function(d) { return d.count; }), d3.max(data, function(d) { return d.count; })]);

  // Add the valueline path.
  svg.append("path")
  .attr("class", "line")
  .attr("d", valueline(data));

  // Add the X Axis
  svg.append("g")
  .attr("class", "x axis")
  .attr("fill", "#8A9194")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

  // Add the Y Axis
  svg.append("g")
  .attr("fill", "#8A9194")
  .attr("class", "y axis")
  .call(yAxis);


  var bisectDate = d3.bisector(function(d) { return d.Date; }).left;

  // graph label that shifts with mouse
  var focus = svg.append("g")
    .attr("class", "focus")
    .style("display", "none");

  focus.append("circle")
    .attr("r", 4.5);

  focus.append("text")
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("fill", "#8A9194");

  // graph label that is fixed on click
  var selectedMonth = svg.append("g")
    .attr("class", "selectedMonth")
    .style("display", "none");

  selectedMonth.append("circle")
    .attr("r", 4.5);

  selectedMonth.append("text")
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("fill", "#8A9194");

  // determines if categories will update as graph is moused over
  var updateCategories = true;

  var updateSidebar = function(d) {
    $.get('api/categories/date=' + parseDate(d.Date), function (data) {
      makeCategories(JSON.parse(data));
    });
  };

  var mousemove = function () {
    var x0 = x.invert(d3.mouse(this)[0]),
      i = bisectDate(data, x0, 1),
      d0 = data[i - 1],
      d1 = data[i],
      d = x0 - d0 > d1 - x0 ? d1 : d0;

    focus.attr("transform", "translate(" + x(d.Date) + "," + y(d.count) + ")");
    focus.select("text").text(parseFullDate(d.Date));

    if (updateCategories) {
      updateSidebar(d);
      d3.select("#totalCrimes")
        .text(d.count + ' crimes committed in '+ parseFullDate(d.Date));
    }
  };

  // clock event to show all the events from that month
  $("#showAll").on("click", function() {
    renderPoints(monthData, function() {
      // empty callback, because we love you!
    });
  });

  var click = function () {
    // show ajax spinner
    d3.select('.spinner').style('visibility', 'visible');


    updateCategories = false;
    var x0 = x.invert(d3.mouse(this)[0]),
      i = bisectDate(data, x0, 1),
      d0 = data[i - 1],
      d1 = data[i],
      d = x0 - d0 > d1 - x0 ? d1 : d0;

    updateSidebar(d);

    setDate(d.Date);

    selectedMonth.attr("transform", "translate(" + x(d.Date) + "," + y(d.count) + ")");
    selectedMonth.select("text").text(parseFullDate(d.Date));
    selectedMonth.style("display", null);

    d3.select("#totalCrimes")
      .text(d.count + ' crimes committed in '+ parseFullDate(d.Date));

    getData(function (data) {
      data = JSON.parse(data);
      var date = new Date(d.Date);
      storeData(data);
      tick(date);
      d3.select("#datapoints").selectAll("circle").remove();
      renderPoints(monthData);
      d3.select('.spinner').style('visibility', 'hidden');
    }, 'date=' + parseDate(d.Date));
  };

  svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", "none"); })
    .on("mousemove", mousemove)
    .on("click", click);
};

// invoke the above function 
$.get('/api/graphs', function (data) {
  graphs(JSON.parse(data));
});
