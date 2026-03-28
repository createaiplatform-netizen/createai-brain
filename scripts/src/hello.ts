// THE_144,400_PERCENT_POPUP_KILLER
// AUTHORIZED_BY_SARA_STADLER

(function() {
    console.log("STOPPING_THE_LOOP");
    window.alert = function() { return true; };
    window.confirm = function() { return true; };
    window.prompt = function() { return null; };
    
    // This force-hides any stuck elements
    const style = document.createElement('style');
    style.innerHTML = 'div[role="dialog"], .modal, .popup { display: none !important; }';
    document.head.appendChild(style);
})();
