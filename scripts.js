class HistoryTableEntry {
    constructor(date, latitude, longitude, elapsed_time = '00:00:00') {
        this.date = date;
        this.latitude = latitude;
        this.longitude = longitude;
        this.universal_date = date.getTime();
        this.elapsed_time = elapsed_time;
    }


    get entry() {
        const time = two_d_date(this.date.getHours()) + ":" + two_d_date(this.date.getMinutes()) + ":" + two_d_date(this.date.getSeconds());
        const date = two_d_date(this.date.getMonth() + 1) + "-" + two_d_date(this.date.getDate()) + "-" + this.date.getFullYear();
        const entry = "<tr>" +
            "<td>" + date + " " + time + "</td>" +
            "<td>" + this.latitude + "</td>" +
            "<td>" + this.longitude + "</td>" +
            "<td>" + this.elapsed_time + "</td>" +
            "</tr>";

        return entry;
    }

    getDateTime() {
        return this.date.getTime();
    }

    elapsedTime() {
        var ms = this.universal_date - getCurrentStart();
        const seconds = two_d_date(parseInt((ms / 1000) % 60));
        const minutes = two_d_date(parseInt((ms / (1000 * 60)) % 60));
        const hours = two_d_date(parseInt((ms / (1000 * 60 * 60)) % 24));
        const days = two_d_date(parseInt((ms / (24 * 1000 * 60 * 60))));

        if (days > 0)
            var elapsed = days + "Days " + hours + ":" + minutes + ":" + seconds;
        else
            var elapsed = hours + ":" + minutes + ":" + seconds;
        return elapsed;
    }

    set_elapsed_time() {
        this.elapsed_time = this.elapsedTime();
    }

}

class HistoryTable {
    constructor(entries) {
        this.entries = entries;
    }

    addEntry(entry) {
        console.log("entry: ");
        console.log(entry);
        this.entries.push(entry);
    }

    clear() {
        this.entries.length = 0;
    }

    get length() {
        return this.entries.length;
    }

    getEntries() {
        return this.entries;
    }

}

// default 
var entries = [];
window.history_table = new HistoryTable(entries);
window.history_size = 0;

var setCurrentStart = function(value) {};
var getCurrentStart = function() { return 0; };
var addCurrentHistory = function(value) {};
var getCurrentHistory = function() { return 0; };
var clear = function() {};

// Code begins here
if (storageAvailable('localStorage')) {
    console.log("local storage available");

    setCurrentStart = function(value) {
        localStorage.setItem('current_start', value);
        window.current_start = value;
    };

    getCurrentStart = function() {
        return localStorage.getItem('current_start');
    };

    getCurrentHistory = function() {
        const len = localStorage.getItem('history_size');
        var out = [];
        if (len === null)
            return new HistoryTable(out);

        for (let i = 0; i < len; i++) {
            var item = JSON.parse(localStorage.getItem('history_table' + i));
            out[i] = new HistoryTableEntry(new Date(item["date"]), item["latitude"], item["longitude"], item["elapsed_time"]);
        }

        console.log("len");
        console.log(len);

        return new HistoryTable(out);
    };


    if (getCurrentStart() == null)
        setCurrentStart(0);
    var entries = [];
    const hist = getCurrentHistory();
    if (hist.length != 0) {
        // update table...
        window.history_table = hist;
        window.history_size = localStorage.getItem('history_size');
        entry_list = hist.getEntries();
        for (let i = 0; i < window.history_size; i++) {
            $("#history tbody").append(
                entry_list[i].entry
            ).fadeIn(10);
            if (entry_list[i].getDateTime() == getCurrentStart()) {
                console.log("last start");

                $('tr').last().addClass('last_start');
            }

        }

        $('tr').last().filter("[class!='last_start']").addClass('last_stop');
        $('.last_start').nextUntil("last_stop", "[class!='last_stop']").addClass('current_block');


        scroll_table();

        console.log(getCurrentHistory());
        console.log(window.history_table);
    } else {
        console.log("empty");
    }

    addCurrentHistory = function(value) {
        console.log("hi");
        console.log(JSON.stringify(value));
        const index = 'history_table' + window.history_table.length;
        window.history_size++;

        localStorage.setItem(index, JSON.stringify(value));
        localStorage.setItem('history_size', window.history_size);


        window.history_table.addEntry(value);

        console.log(window.history_table);
    };

    clear = function() {
        localStorage.clear();
        window.history_table = new HistoryTable([]);
        window.current_start = 0;
        window.history_size = 0;
        $('tbody').hide().empty().fadeIn();
    }
} else {
    window.current_start = 0;
    var entries = []
    window.history_table = new HistoryTable(entries);

    setCurrentStart = function(value) {
        window.current_start = value;
    }

    getCurrentStart = function() {
        return window.current_start;
    }

    addCurrentHistory = function(value) {
        window.history_table.addEntry(value);
    }

    getCurrentHistory = function() {
        return window.history_table;
    }

    setCurrentStart(0);
    var entries = [];
    setCurrentHistory(new HistoryTable(entries))

    clear = function() {
        window.history_table = new HistoryTable([]);
        window.current_start = 0;
        window.history_size = 0;
    }

}

function loc_success(pos, date) {
    const htable_ent = new HistoryTableEntry(date,
        pos.coords.latitude, pos.coords.longitude);
    htable_ent.set_elapsed_time();
    addCurrentHistory(htable_ent);
    $("#history tbody").append(
        htable_ent.entry
    ).fadeIn(200);
    if (date.getTime() - getCurrentStart() < 10) {
        $("#no_start").remove();
        $('.last_start').removeClass('last_start');
        $('.current_block').removeClass('current_block');
        $('.last_stop').removeClass('last_stop');
        $('tr').last().addClass('last_start');
    } else {
        $('.last_stop').removeClass('last_stop');
        $('tr').last().addClass('last_stop');
        $('.last_start').nextUntil("last_stop", "[class!='last_stop']").addClass('current_block');
    }

    scroll_table();


}

function loc_error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    return null;
}

var loc_options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

$('#start').on("click", function() {
    const date = new Date();

    setCurrentStart(date.getTime());
    // Check whether geolocation is available
    // on the current device
    if ("geolocation" in navigator) {
        console.log("Geolocation available.");
        navigator.geolocation.getCurrentPosition(function(position) {
            loc_success(position, date);
        }, loc_error, loc_options);

        return;
    } else {
        console.log("Geolocation not available.");
    }

});

$('#stop').on("click", function() {
    if (getCurrentStart() == 0) {
        console.log("not yet started");
        $("#history tbody").html(
            "<tr id='no_start'><td>No start set</td></td>"
        );

        return;
    }
    const date = new Date();

    // Check whether geolocation is available
    // on the current device
    if ("geolocation" in navigator) {
        console.log("Geolocation available.");
        navigator.geolocation.getCurrentPosition(function(position) {
            loc_success(position, date);
        }, loc_error, loc_options);
        return;
    } else {
        console.log("Geolocation not available.");
    }


});

$('#reset').on("click", function() {

    clear();

});


function two_d_date(value) {
    return value < 10 ? '0' + value : '' + value;
}

function scroll_table() {
    var table_height = $('tbody').prop('scrollHeight');
    var scrolled_height = $("tbody").innerHeight() + $("tbody").scrollTop();

    if (table_height - scrolled_height > 50) {
        $("tbody").animate({ scrollTop: table_height }, '20', 'swing', function() {});
    } else {
        $("tbody").scrollTop(table_height);
    }
}



// Code sourced from the MDN WebDoc on the Web Storage API
//  found here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) {
    var storage;
    try {
        storage = window[type];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}