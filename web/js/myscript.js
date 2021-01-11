/* ToDo:
-fix delete button. (the eventlistener doesnt append to the button)
-stop updating once all items are deleted
-save local data with save button
-stop window resizing if possible
*/

var modelDict = new Array(); //create an array to store model nums
var input = document.getElementById("userInput"); // fetch user input
var inputType = document.getElementById("inputType"); //fetch input type from dropdown menu
var table = document.querySelector("tbody"); // fetch table body to append rows to
var submit = document.getElementById("form");

async function getInfoFromModel(model) {
    if (model == "") {
        alert("Please input model number");
        return false;
    }
    model = model.trim();

    let output = await eel.addModel(model, true)();
    
    if (modelDict.length >= 10) {
        alert("List full. Delete an entry to add more.");
        return false;
    } else if (modelDict.includes(model)) {
        alert("Model already inputed.")
        return false;
    } else if (output == -3) {
        alert("Could not find page")
        return false;
    }

    modelDict.push(model);
    return output;

}

async function getInfoFromLink(link) {
    if (link == "") {
        alert("Please input link");
        return false;
    }

    let output = await eel.addModel(link, false)();
    let model = output[1]
    
    if (modelDict.length >= 10) {
        alert("List full. Delete an entry to add more.");
        return false;
    } else if (modelDict.includes(model)) {
        alert("Model already inputed.")
        return false;
    } else if (output == -4) {
        alert("Could not find model.")
        return false;
    }

    modelDict.push(model);
    return output;
}

async function update() {
    /* check stock for each row at a regual interval of 3 min per row*/

    

    while(true) {

        if (modelDict.length < 1) { 
            var sleepInterval = 180000;
        } else {
            var sleepInterval = 180000 / modelDict.length;
        }
        
        if (sleepInterval < 18000) { sleepInterval = 18000; }

        for (let row of table.rows) {

            let link = row.firstChild.firstChild.href
            let name = row.firstChild.firstChild.textContent;
            let stock = await eel.updateStock(link)();

            let span = row.children[2].firstChild;
       
            span.textContent = stock;
            span.firstChild = setStockColor(stock, span);
            
            console.log(`'${name}' stock checked at ${new Date().toLocaleTimeString()}`);
            await sleep(sleepInterval);
        }
    }
}

function showDesktopNotification() {
    /* send desktop notification if item changes from oos to in-stock */
    if (!window.Notification) {
        console.log('Browser does not support notifications.');
    } else {
        // check if permission is already granted
        if (Notification.permission === 'granted') {
            // show notification here
        } else {
            // request permission from user
            Notification.requestPermission().then(function(p) {
               if(p === 'granted') {
                var notify = new Notification('eggChecker', {
                    body: 'An item is now in stock!',
                    icon: 'https://img.icons8.com/windows/32/000000/egg--v1.png',
                });
               } else {
                   console.log('User blocked notifications.');
               }
            }).catch(function(err) {
                console.error(err);
            });
        }
    }
}

async function generateRow(event) {
    /*  Calls functions to add values to map and appends a row to the table */

    event.preventDefault();

    // Find text to be inputted into table. 
    if (inputType.value == "model") {
        var output = await getInfoFromModel(input.value);
        if (output == false) {
            console.log("invalid model");
            input.value = "";
            return;
        }
        var model = input.value;
        var link = output[2];
        console.log("model inputted")
    } else {
        var output = await getInfoFromLink(input.value);
        if (output == false) {
            console.log("invalid link");
            input.value = "";
            return;
        }
        var model = output[2];
        var link = input.value;
        console.log("link inputted")
    }

    // below is for testing 
    // output = ["name", "In Stock", "model"]
    // model = "model"

    console.log(output)
    let pname = output[0];
    let stock = output[1];
    // stock = stock.trim()

    // Add Data to Table
    let row = table.insertRow();

    // add Name to row
    let cell = row.insertCell();
    let a = document.createElement("a");
    let text = document.createTextNode(pname);
    a.appendChild(text);
    a.href = link;
    a.target = "_blank";
    cell.appendChild(a);
    cell.className = "pname";

    // add model to row
    cell = row.insertCell();
    text = document.createTextNode(model);
    cell.appendChild(text);

    // add Stock
    cell = row.insertCell();
    span = document.createElement("span");
    text = document.createTextNode(stock);
    span.appendChild(text);
    span = setStockColor(stock, span);  // setStockColor
    cell.appendChild(span);
    cell.className = "stock";

    // add X Button
    cell = row.insertCell();
    let btn = createButton();
    cell.appendChild(btn);
    btn.addEventListener("click", deleteRow(this));

    // reset input
    input.value = "";

    // start updating once an item is added;
    if ( modelDict.length == 1 ) {
        update();
    }
    
}

function setStockColor(stock, span) {  

    if (stock.toLowerCase().includes("in stock")) {
        console.log("in stock");
        if (span.className == ".out-of-stock") {
            showDesktopNotification();
        }
        span.className = "in-stock";
    } else if (stock.toLowerCase().includes("out of stock")) {
        console.log("out of stock")
        span.classList.add("out-of-stock");
    }
    return span;
}

function deleteRow(r) {
    /* Deletes row and removes model from list. Needs to be fixed to append to correct button */

    // console.log("click");
    // modelDict.pop(input.value);  // change to model
    // var i = r.parentNode.parentNode.rowIndex;
    // table.deleteRow(i);
}

function createButton() {
    let btn = document.createElement("BUTTON");
    let text = document.createTextNode("X");
    btn.appendChild(text);

    return btn;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

submit.addEventListener('submit', generateRow);