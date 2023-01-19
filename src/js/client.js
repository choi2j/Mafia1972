const socket = io();

/**
 * 
 * @param {string} name GET 파라미터
 * @returns GET 파라미터 값
 */
function getParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/**
 * 방 검색 기능
 */
function filter() {
    let search = document.getElementById("search").value.toLowerCase();
    let item = document.getElementsByClassName("room-item");

    for (let i = 0; i < item.length; i++) {
        let name = item[i].getElementsByClassName("room-name");
        let owner = item[i].getElementsByClassName("room-owner");

        if (name[0].innerText.toLowerCase().indexOf(search) != -1 || owner[0].innerText.toLowerCase().indexOf(search) != -1) {
            item[i].style.display = "flex";
            item[i].style.flexDirection = "column";
        } else {
            item[i].style.display = "none";
        }
    }
}