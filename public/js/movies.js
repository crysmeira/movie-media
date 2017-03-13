var search = $(".search")[0].textContent;
var page = 1;
loadMore(search, page);

function loadMore(seach, page) {
    console.log("loading " + search + " " + page);
    $.getJSON("https://www.omdbapi.com/?s="+search+"&page="+page, function(data) {
        if (!data["Search"]) {
            return;
        }
        if (page == 1) {
            var divInfo = $(".additional-info")[0];
            var element = document.createElement("div");
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
        if (poster === "N/A") {
            poster = "https://s-media-cache-ak0.pinimg.com/736x/92/9d/3d/929d3d9f76f406b5ac6020323d2d32dc.jpg";
        }
        var year = this.data["Year"];
        pageElement.className = "col-md-3 col-sm-4 col-xs-6 elem";
        pageElement.innerHTML = this.generateHTML(imdbID, title, year, poster);
    }
    
    generateHTML(imdbID, title, year, poster) {
        return  "<div class='poster'>" +
                    "<a class='thumbnail' href='/movies/" + imdbID + "'>" +
                        "<img class='img-responsive' src=" + poster + " alt=" + title + " - Poster>" + 
                    "</a>" +
                    "<p class='title'>" + title + " - " + year + "</p>" +
                "</div>";
    }
}

$(window).scroll(function () { 
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10) {
        page += 1;
        loadMore(search, page);
    }
});