(function () {
    angular.module('exportPDF', [
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
        'daterangepicker',
        'xeditable'
    ])
})();