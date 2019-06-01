/*
File: isvg.js
Dependencies: jQuery,
Globals: none
Designer: © Michael Schwarz, CyDot, info@cydot.de
Vers. 0.3.4
Updated: 2019-03-07
*/

/*
Transforms short svg html notations into inline svg

Fallback possibility
Callback with detailed event object
General parameter settings: optimize, inheritClass, inheritId, fallbackFormat
Insertion methods: replace, before, after

HTML:

<img class="isvg" src="logo.svg">

<div class="isvg" data-src="logo.svg"></div>


JS:

$( document ).ready( onDoc );

function onDoc ( e ) {
    $.isvg( onISVG );
}

function onISVG ( e ) {
    console.log( "onISVG", e );
}

*/

;( function ( $ ) {
    
    var version = "0.3.4",
    feature = hasSVG(),
    optimize = true,
    inheritClass = true,
    inheritId = true,
    fallbackFormat = "png",
    
    isvgClass = "isvg",
    fallbackClass = "isvg-fallback",
    missingClass = "isvg-missing",
    
    currentLoad = 0,
    eventCount = 0,
    events = {};
    
    function isvg ( callback ) {
        var $elems = $( "img.isvg, div.isvg" ).filter( __hasSVGURL ),
        evt = registerEvent( $elems, callback );
        
        if ( ! $elems.length ) {
            fire( evt );
            return;
        };
        currentLoad = $elems.length
        $elems.each( feature ? __replace : __fallback );
    }
    
    isvg.version = version;
    
    isvg.feature = feature;
    
    isvg.optimize = function ( bool ) {
        if ( ! arguments.length ) {
            return optimize;
        };
        optimize = !! bool;
    };
    
    isvg.inheritClass = function ( bool ) {
        if ( ! arguments.length ) {
            return inheritClass;
        };
        inheritClass = !! bool;
    };
    
    isvg.inheritId = function ( bool ) {
        if ( ! arguments.length ) {
            return inheritId;
        };
        inheritId = !! bool;
    };
    
    isvg.fallbackFormat = function ( suffix ) {
        if ( ! arguments.length ) {
            return fallbackFormat;
        }
        fallbackFormat = suffix;
    };
    
    isvg.replace = function ( targetEl, svgUrl, callback ) {
        if ( ! isSVGURL( svgUrl )) return;
        
        var $trg = $( targetEl ),
        $isvg = createISVGEl( svgUrl ),
        method = feature ? __replace : __fallback;
        
        copyAtts( $isvg, $trg );
        $trg.replaceWith( $isvg ).remove();
        
        registerEvent( $isvg, callback );
        method.call( $isvg );
    };
    
    isvg.before = function ( targetEl, svgUrl, callback ) {
        if ( ! isSVGURL( svgUrl )) return;
        
        var $trg = $( targetEl ),
        $isvg = createISVGEl( svgUrl ),
        method = feature ? __replace : __fallback;
        
        $trg.before( $isvg );
        
        registerEvent( $isvg, callback );
        method.call( $isvg );
    };
    
    isvg.after = function ( targetEl, svgUrl, callback ) {
        if ( ! isSVGURL( svgUrl )) return;
        
        var $trg = $( targetEl ),
        $isvg = createISVGEl( svgUrl ),
        method = feature ? __replace : __fallback;
        
        $trg.after( $isvg );
        
        registerEvent( $isvg, callback );
        method.call( $isvg );
    };
    
    $.isvg = isvg;
    
    function __replace () {
        var $el = $( this ),
        url = getUrl( $el ),
        xhr = $.get( url, function (){}, "xml" );
        
        xhr.done( function ( xmlData ) {
            var $svg = $( xmlData ).find( "svg" ),
            evtId = $el.data( "isvg-id" );
            
            if ( optimize ) optimizeForCSS( $svg );
            copyAtts( $svg, $el );
            $el.replaceWith( $svg ).remove();
            
            updateEvent( events[ evtId ], "svg", $svg );
            checkLoad( evtId );
        });
        
        xhr.fail( function ( response ) {
            __fallback.call( $el );
        });
    }
    
    function __fallback () {
        var $el = $( this ),
        url = getUrl( $el ),
        fbURL = url.slice( 0, -3 ) + fallbackFormat,
        $img = $( new Image());
        
        $img.on( "load", { origin: $el }, __fallbackLoaded );
        $img.on( "error", { origin: $el }, __fallbackError );
        $img.attr( "src", fbURL );
    }
    
    function __fallbackLoaded ( e ) {
        var $img = $( this ),
        $origin = e.data.origin,
        evtId = $origin.data( "isvg-id" );
        
        copyAtts( $img, $origin );
        $img.removeClass( "isvg" ).addClass( fallbackClass );
        $origin.replaceWith( $img ).remove();
        
        updateEvent( events[ evtId ], "fallback", $img );
        checkLoad( evtId );
    }
    
    function __fallbackError ( e ) {
        $( this ).remove();
        var $origin = e.data.origin,
        evtId = $origin.data( "isvg-id" );
        
        $origin.removeClass( "isvg" ).addClass( missingClass );
        updateEvent( events[ evtId ], "missing", $origin );
        
        if ( console ) {
            console.log( "iSVG - missing fallback", $origin );
        };
        checkLoad( evtId );
    }
    
    function registerEvent ( $query, callback ) {
        var evt = {
            event: "isvg",
            id: ++ eventCount + "",
            svg: $(),
            fallback: $(),
            missing: $(),
            amount: $query.length,
            toload: $query.length,
            callback: callback
        };
        events[ evt.id ] = evt;
        $query.data( "isvg-id", evt.id );
        
        return evt;
    }
    
    function updateEvent ( evt, type, $el ) {
        evt[ type ] = evt[ type ].add( $el );
    }
    
    function checkLoad ( evtId ) {
        var evt = events[ evtId ];
        
        if ( ! -- evt.toload ) {
            fire( evt );
        }
    }
    
    function fire ( evt ) {
        if ( typeof evt.callback === "function" ) {
            evt.callback.call( null, evt );
        }
    }
    
    function copyAtts ( $to, $from ) {
        if ( inheritId && $from.attr( "id" )) {
            $to.attr( "id", $from.attr( "id" ))
        }
        if ( inheritClass ) {
            $to.addClass( $from.attr( "class" ));
        }
        else if ( ! $to.hasClass( "isvg")) {
            $to.addClass( "isvg");
        }
    }
    
    function createISVGEl ( url ) {
        return $( "<div class='isvg' data-src='" + url + "'></div>" );
    }
    
    function optimizeForCSS ( $svg ) {
		svg = $svg[ 0 ];
		svg.removeAttribute( "width" );
		svg.removeAttribute( "height" );
	}
        
    function __hasSVGURL () {
        return isSVGURL( getUrl( $( this )));
    }
    
    function isSVGURL ( strg ) {
        return endsWith( strg, ".svg" );
    }
    
    function getUrl ( $el ) {
        var url = $el.attr( "src" ) || $el.data( "src" );
        return typeof url === "string" ? url : "";
    }
    
    function hasSVG () {
        if ( window.Modernizr ) {
            return Modernizr.svg;
        }
        if ( document.implementation.hasFeature
	       ( "http://www.w3.org/TR/SVG11/feature#Image", "1.1" )) {
            $( "html" ).addClass( "svg" );
            return true;
        };
        $( "html" ).addClass( "no-svg" );
        return false;
    }
    
    function endsWith ( subj, search ) {
        var pos = subj.length - search.length,
        i = subj.lastIndexOf( search );
            
        return i !== -1 && i === pos;
    }
    
    // :)
    
})( jQuery );
