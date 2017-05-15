define(['marionette', 'backbone', './templates/layout.tpl', 'lib/regions/fade_in', 'lib/api', './performances',
        '../entities/performance_collection', '../entities/performance', './queue', './timelines', 'jquery',
        'underscore', 'select2', 'select2-css'],
    function (Marionette, Backbone, template, FadeInRegion, api, PerformancesView, PerformanceCollection, Performance,
              QueueView, TimelinesView, $, _) {
        return Marionette.View.extend({
            template: template,
            cssClass: 'app-performances-page',
            regions: {
                performances: {
                    el: '.app-performances-region',
                    regionClass: FadeInRegion
                },
                queue: {
                    el: '.app-performance-queue-container',
                    regionClass: FadeInRegion
                }
            },
            ui: {
                languageButton: '.app-language-select button',
                container: '.app-performances-region'
            },
            events: {
                'click @ui.languageButton': 'changeLanguage'
            },
            initialize: function (options) {
                this.mergeOptions(options, ['editing', 'autoplay', 'dir', 'nav', 'readonly', 'hideQueue', 'disableSaving']);
            },
            onRender: function () {
                // fluid by default
                this.setFluidContainer(this.fluid || typeof this.fluid == 'undefined');
                this.performanceCollection = new PerformanceCollection();

                let self = this,
                    queueView = new QueueView({
                        performances: self.performanceCollection,
                        readonly: this.readonly,
                        autoplay: this.autoplay,
                        hidden: this.hideQueue,
                        disableSaving: this.disableSaving
                    }),
                    performancesView = new PerformancesView({
                        collection: self.performanceCollection,
                        queueView: queueView,
                        readonly: this.readonly,
                        autoplay: this.autoplay,
                        dir: this.dir,
                        nav: this.nav
                    });

                self.getRegion('queue').show(queueView);
                self.getRegion('performances').show(performancesView);

                performancesView.on('new', queueView.editPerformance, queueView);
                this.performanceCollection.fetch({
                    reset: true,
                    success: function (response, collection) {
                        queueView.showCurrent();
                    }
                });
            },
            changeLanguage: function (e) {
                var language = $(e.target).data('lang');

                this.ui.languageButton.removeClass('active');
                $(e.target).addClass('active');

                api.setRobotLang(language);
            },
            setFluidContainer: function (enable) {
                if (enable)
                    this.ui.container.removeClass('container').addClass('container-fluid');
                else
                    this.ui.container.removeClass('container-fluid').addClass('container');
            }
        });
    });
