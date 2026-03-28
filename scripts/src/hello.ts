// FORCE_POPUP_KILL: 144,400%_STASIS
// TARGET: project-gywyv.vercel.app

window.onload = function() {
    console.log("SARA_STADLER_COMMAND: PURGING_ALL_ALERTS");
    // This effectively stops any alert loops
    window.alert = function() {}; 
};
