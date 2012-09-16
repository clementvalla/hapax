//require casper
phantom.casperPath = '/usr/local/Cellar/casperjs/1.0/libexec/';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

//load casper
var casper = require('casper').create({
  clientScripts: ["/Users/clementvalla/code/js/jquery-1.8.0.js"],
  verbose: true
});
casper.on('remote.message', function(message) {
  console.log(message);
});
var fs = require('fs');

var results;
var image;


casper.start().repeat(70, function() {
  //get the terms from rita
  var rs = newTerm();
  rss = rs.split(" ");
  rss = rss[0] + "_" + rss[1];
  query = escape("\"" + rs + "\"");

  var search_url = "https://www.google.com/search?q=";
  search_url += query;
  search_url += "&gs_l=serp.3...1620.2794.0.2952.2.2.0.0.0.0.155.215.1j1.2.0.les%3B..0.0...1c.1.r1Z55DPTxic";
  search_url += "&pbx=1&bav=on.2,or.r_gc.r_pw.r_cp.r_qf.&fp=f8988a7f1ebacbd3&biw=1238&bih=779";

  //build the query - don't forget quotes for exact matches
  var url = "https://www.google.com/search?num=10&hl=en&biw=1380&site=imghp&tbm=isch&source=hp&biw=1380&bih=766";
  url += '&q=' + query + '&oq=' + query;
  url += '&gs_l=img.3...7374.9536.0.9725.15.3.0.12.0.2.354.683.1j0j1j1.3.0...0.0...1ac.W4swI14FluQ';

  //open the google query page
  this.open(url);

  //once the page is open
  this.then(function() {

    //get the number of results
    var nr = this.evaluate(getGoogleResultCount);
    console.log(nr + " results from IMAGE search");

    if (nr == 1) {
      //getResults returns link to a single image search page
      results = this.evaluate(getImageLink);
    } else {
      results = false;
    }

    //write out the link
    //console.log("results:" + results);
    //if there is a single result link
    if (results) {
      

        //take a screencapture of the search results
        var img = '/Users/clementvalla/code/js/hapax/imgs/' + rss + '.png';
        this.capture(img);
        console.log('wrote: ' + img);

        //does the term appear infrequently in regular search?
        //regular google search
        this.open(search_url);
        this.then(function() {
        //get the number of results from the REGULAR search
        var nr = this.evaluate(getGoogleResultCount);
        console.log(nr + " results from REGULAR search");
        if (nr == null) {
          //take a screencapture of the search results
          var err = '/Users/clementvalla/code/js/hapax/errors/' + rss + '.png';
          this.capture(err);
        }
        if (nr < 10) {

        //if (true) {
          //grab the link to the search result
          this.open(results);

          this.then(function() {
            //make sure we can grab the image from the page
            image = this.evaluate(grabImageFromSearch);

            //if we can, then download the image
            if (image) {
              this.open(image);
              this.then(function() {
                var ext = image.split('.').pop()
                var img = '/Users/clementvalla/code/js/hapax/imgs/' + rss + '_result.' + ext;
                this.download(image, img);
                var content = "term:" + rs + "\n";
                var d = new Date();
                var n = d.toUTCString();
                var unixdate = Math.round(+d / 1000);
                content += "unixtime:" + unixdate + "\n";
                content += "date:" + n + "\n";
                content += "image:" + image + "\n";
                content += "screenshot:" + 'imgs/' + rss + ".png\n";
                content += "save:" + img;
                fs.write("/Users/clementvalla/code/js/hapax/imgs/" + rss + ".txt", content, 'w');
              });
            }
          });
        }
      });
    }
  });
});

casper.run();

function newTerm() {
  //create blank webpage
  var ripage = require('webpage').create();

  //setup console for debugging
  ripage.onConsoleMessage = function(msg) {
    console.log(msg);
  };

  //inject local copy of rita
  if (ripage.injectJs('/Users/clementvalla/code/js/rita_full-017a.min.js')) {

    //do rita stuff on page
    var rs = ripage.evaluate(function() {
      var lex = new RiLexicon();
      var s = lex.getRandomWord("jj") + " " + lex.getRandomWord("nn");
      return s;
    });
    //rs = "liberal collarbone";
    console.log(rs);
    return rs;
  } else {
    return "blank";
  }
}

function getImageLink() {
  var link = $('#center_col #res #ires a').attr('href');
  console.log("found a hapax");
  return link;
}

function getGoogleResultCount() {
  //find the div with the results text
  var results = $('#resultStats').html();

  if (results) {
    //echo the number of results
    //console.log(results);
    //split the results string
    var n = results.split(" ");

    if (n[0] == "About") {
      //console.log(parseInt(n[1].replace(/,/g, '')));
      return parseInt(n[1].replace(/,/g, ''));
    } else {
      return parseInt(n[0]);
    }
  } else {
    console.log('no results:' + $('div#topstuff').html());
    return false;
  }
}

function grabImageFromSearch() {
  link = $('#il #il_m .il_ul a').attr('href');
  if (link) {
    console.log(" ");
    console.log('///////////////////////////////////////////////////////////////////////');
    console.log('found an image' + link);
    console.log('///////////////////////////////////////////////////////////////////////');
    console.log(" ");
    return link;
  } else {
    return false;
  }
}