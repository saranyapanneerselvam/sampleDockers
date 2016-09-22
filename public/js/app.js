/**
 * INSPINIA - Responsive Admin Theme
 *
 */
(function () {
    angular.module('inspinia', [
        'ui.router',                    // Routing
        'oc.lazyLoad',                  // ocLazyLoad
        'ui.bootstrap',                 // Ui Bootstrap
        'pascalprecht.translate',       // Angular Translate
        'ngIdle',                       // Idle timer
        'ngSanitize',
        'ngAnimate',
        'ui.bootstrap.tpls',
        'gridster',
        'nvd3',
        //'d3-cloud',
        /*'daterangepicker',*/
        'xeditable',
        'uiSwitch'

    ])
})();

// Other libraries are loaded dynamically in the config.js file using the library ocLazyLoad