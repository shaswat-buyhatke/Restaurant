fetch('/menu', {
    method: 'GET',
})
.then(response => response.json())
.then(menu => {
    // console.log(menu[0]);
    let sz = Object.keys(menu).length;
    let place = document.getElementById('menu');
    // let p = document.createElement('pre');
    // p.append(`NAME           COST`);
    // place.append(p);
    // place.append(document.createElement("br"));
    for(let i = 0 ; i < sz ; ++i){
        const newDiv = document.createElement("div");
        newDiv.append(`${menu[i].name} :  ${menu[i].cost} `)
        const input = document.createElement("input")
        input.setAttribute("type" , "number");
        input.setAttribute("name" , `${menu[i].name}`);
        newDiv.append(input);
        place.append(newDiv);
        place.append(document.createElement("br"));
    }
});


function placeOrder(){
    let orders = document.getElementsByTagName('input');
    let sz = orders.length;
    let obj = {};
    for(let i = 0 ; i < sz ; ++i){
        obj[orders[i].name] = orders[i].value;
    }
    console.log(obj);
    fetch('/placeOrder', {
        method: 'POST',

        body: JSON.stringify(obj),
        headers: {
            'Content-type': 'application/json; charset=UTF-8'
        }
    })
    .then(response => {
        console.log(response);
    })
}