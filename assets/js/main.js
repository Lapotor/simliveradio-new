new WOW().init();
$(function () {
    $.isvg();
    $.isvg.fallbackFormat( "jpg" );
    $.isvg.inheritClass( false );
    $.isvg.inheritId( true );
});

$('.dropdown').on('shown.bs.dropdown', function(e) {
    let menu = e.target.parentNode.querySelector('.dropdown-menu');
    if(menu) {
        menu.style.maxHeight =
            'calc(100vh - ' + menu.getBoundingClientRect().top + 'px)';
    }
});