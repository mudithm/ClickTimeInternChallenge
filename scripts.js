// Entry in the HistoryTable
class HistoryTableEntry {
    // constructor. Elaped time defaults to 0
    // sets date(UTC), latitude, longitude
    constructor(date, latitude, longitude, elapsed_time = '00:00:00') {
        this.date = date;
        this.latitude = latitude;
        this.longitude = longitude;
        this.universal_date = date.getTime();
        this.elapsed_time = elapsed_time;
    }

    // returns a table row in html to be displayed in the history table
    get entry() {
        console.log(this.date);
        const time = two_d_date(this.date.getHours()) + ":" + two_d_date(this.date.getMinutes()) + ":" + two_d_date(this.date.getSeconds());
        const date = two_d_date(this.date.getMonth() + 1) + "-" + two_d_date(this.date.getDate()) + "-" + this.date.getFullYear();
        const entry = "<tr>" +
            "<td>" + date + " " + time + " (" + this.date.toLocaleDateString(navigator.language, { timeZoneName: 'short' }).split(',')[1] + " ) " + "</td>" +
            "<td>" + this.latitude + "</td>" +
            "<td>" + this.longitude + "</td>" +
            "<td>" + this.elapsed_time + "</td>" +
            "</tr>";

        return entry;
    }

    // return the date, in milliseconds (UTC time)
    getDateTime() {
        return this.date.getTime();
    }

    // return the time elapsed since the last start
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

    // set the elapsed time; necessary to reset elapsed_time field
    // for "stop" entries
    set_elapsed_time() {
        this.elapsed_time = this.elapsedTime();
    }

}

// HistoryTable; holds HistoryTableEntry objets in an array
class HistoryTable {
    // constructor; takes array of HistoryTableEntry objects
    constructor(entries) {
        this.entries = entries;
    }

    // adds HistoryTableEntry to the array
    addEntry(entry) {
        console.log("entry: ");
        console.log(entry);
        this.entries.push(entry);
    }

    // clear HistoryTable array
    clear() {
        this.entries.length = 0;
    }

    // return length of entries
    get length() {
        return this.entries.length;
    }

    // return entries array
    getEntries() {
        return this.entries;
    }

}

// default globals
var entries = [];
window.history_table = new HistoryTable(entries);
window.history_size = 0;

// default storage functions
var setCurrentStart = function(value) {};
var getCurrentStart = function() { return 0; };
var addCurrentHistory = function(value) {};
var getCurrentHistory = function() { return 0; };
var clear = function() {};

// function to run if geolocation successful 
function loc_success(pos, date) {
    // initialize new htable entry
    const htable_ent = new HistoryTableEntry(date,
        pos.coords.latitude, pos.coords.longitude);

    // set elapsed time
    htable_ent.set_elapsed_time();
    addCurrentHistory(htable_ent);

    // add entry to table and update styles
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

    //scroll to bottom of table
    scroll_table();


}

// if geolocation unsuccessful
function loc_error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    return null;
}

// geolocation options
var loc_options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};


// start button onclick handler
$('#start').on("click", function() {
    const date = new Date();

    // set current start time
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

// stop button onclick handler
$('#stop').on("click", function() {
    // if current start not set, notify user
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

// reset button onclick handler
$('#reset').on("click", function() {

    clear();

});

// convert date values to two digits, if necessary
function two_d_date(value) {
    return value < 10 ? '0' + value : '' + value;
}

// scroll to bottom of table
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


// main code

// if local storage is available, set storage functions
// else, use default storage
if (storageAvailable('localStorage')) {
    console.log("local storage available");

    // set current start function
    // store current start in localStorage 
    setCurrentStart = function(value) {
        localStorage.setItem('current_start', value);
        window.current_start = value;
    };

    // get current start function
    // return current start from local storage
    getCurrentStart = function() {
        return localStorage.getItem('current_start');
    };

    // get current history table
    // return current history table, or empty if none exists
    getCurrentHistory = function() {
        const len = localStorage.getItem('history_size');
        var out = [];
        if (len === null)
            return new HistoryTable(out);

        // populate entries from table
        for (let i = 0; i < len; i++) {
            var item = JSON.parse(localStorage.getItem('history_table' + i));
            out[i] = new HistoryTableEntry(new Date(item["date"]), item["latitude"], item["longitude"], item["elapsed_time"]);
        }

        console.log("len");
        console.log(len);

        return new HistoryTable(out);
    };

    // initialize globals
    if (getCurrentStart() == null)
        setCurrentStart(0);
    var entries = [];
    const hist = getCurrentHistory();
    // if table in storage is not empty, populate globals & table
    if (hist != null && hist.length != 0) {
        // update table...
        window.history_table = hist;
        window.history_size = localStorage.getItem('history_size');
        entry_list = hist.getEntries();
        for (let i = 0; i < window.history_size; i++) {
            $("#history tbody").append(
                entry_list[i].entry
            ).fadeIn(10);
            // mark last start position
            if (entry_list[i].getDateTime() == getCurrentStart()) {
                console.log("last start");

                $('tr').last().addClass('last_start');
            }

        }

        // update styles
        $('tr').last().filter("[class!='last_start']").addClass('last_stop');
        $('.last_start').nextUntil("last_stop", "[class!='last_stop']").addClass('current_block');

        // scroll to bottom of table
        scroll_table();

        console.log(getCurrentHistory());
        console.log(window.history_table);
    } else {
        console.log("empty");
    }

    // add to current history 
    // if local_storage, add entry to local storage
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

    // clear function
    // if local storage, clear
    clear = function() {
        localStorage.clear();
        window.history_table.clear();
        window.current_start = 0;
        window.history_size = 0;
        $('tbody').hide(800).empty().fadeIn();
    }
} else {
    // set globals
    window.current_start = 0;
    var entries = []
    window.history_table = new HistoryTable(entries);

    // set current start from global
    setCurrentStart = function(value) {
        window.current_start = value;
    }

    // get current start from global
    getCurrentStart = function() {
        return window.current_start;
    }

    // add current history from global
    addCurrentHistory = function(value) {
        window.history_table.addEntry(value);
    }

    // get current history from global
    getCurrentHistory = function() {
        return window.history_table;
    }

    // create empty historytable
    setCurrentStart(0);
    var entries = [];
    setCurrentHistory(new HistoryTable(entries))

    // clear globals and empty table
    clear = function() {
        window.history_table = new HistoryTable([]);
        window.current_start = 0;
        window.history_size = 0;
        $('tbody').hide().empty().fadeIn();
    }

}