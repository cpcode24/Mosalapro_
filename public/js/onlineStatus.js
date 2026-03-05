function setMeOnline() {
    console.log("Setting user online..");
    fetch("/user/online-status", {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    });
}
const interval = 300000; // 5 min

setMeOnline();
window.setInterval(setMeOnline, interval);