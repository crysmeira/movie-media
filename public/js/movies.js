var search = $(".search")[0].textContent;
var page = 1;
loadMore(search, page);

function loadMore(seach, page) {
    console.log("loading " + search + " " + page);
    $.getJSON("https://www.omdbapi.com/?s="+search+"&page="+page, function(data) {
        var divInfo = $(".additional-info")[0];
        var element = document.createElement("div");
        if (!data["Search"]) {
            element.innerHTML = "<h3>No results were found</h3>";
            $(divInfo).append(element);
            return;
        }
        if (page == 1) {
            element.innerHTML = "<h3>" + data["totalResults"] + " results found</h3>";
            $(divInfo).append(element);
        }
        data["Search"].forEach(function(m) {
            render(new Movie(m));
        });
    });
}

function render(drawable) {
    var divMovies = $(".movies")[0];
    var element = document.createElement("div");
    drawable.render(element);
    $(divMovies).append(element);
}

class Movie {
    constructor(data) {
        this.data = data;
    }
    
    render(pageElement) {
        var imdbID = this.data["imdbID"];
        var title = this.data["Title"];
        var poster = this.data["Poster"];
        if (!poster || poster === "N/A") {
            poster = "/images/no_image_available.png";
        }
        var year = this.data["Year"];
        pageElement.className = "col col-md-3 col-sm-4 col-xs-6";
        pageElement.innerHTML = this.generateHTML(imdbID, title, year, poster);
    }
    
    generateHTML(imdbID, title, year, poster) {
        return  "<a class='thumbnail' href='/movies/" + imdbID + "'>" +
                    "<div class='poster'>" +
                        "<img class='img-responsive' src=" + poster + " alt=" + title + " - Poster>" + 
                        "<p class='title'>" + title + "</p>" +
                        "<p>(" + year + ")</p>" +
                    "</div>" +
                "</a>";
    }
}

$(window).scroll(function () { 
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10) {
        page += 1;
        loadMore(search, page);
    }
});