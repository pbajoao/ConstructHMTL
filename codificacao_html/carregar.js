$(function(){
    SCORM.carregar();
    Tutorial.criar();

    /*extras*/
    Players.carregar();
    $('img[usemap]').rwdImageMaps();
    Popup.carregar();
});
